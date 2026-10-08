"""Checks a built Microsoft Store package before it is uploaded to Partner Center.
Run:  python tools/check_store_package.py dist/Tartiba-Store-1.0.0.appx

It confirms that the identity inside the package matches the "appx" section of
package.json, that the package is unsigned (Microsoft signs it), and that the
app and its Store icons are inside.  Exits with an error if anything is wrong.
"""
import json
import os
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parent.parent
NS = {
    "m": "http://schemas.microsoft.com/appx/manifest/foundation/windows10",
    "uap": "http://schemas.microsoft.com/appx/manifest/uap/windows10",
}
UAP = "{%s}" % NS["uap"]


def main(path):
    pkg = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    want = pkg["build"]["appx"]
    problems = []

    def expect(label, got, wanted):
        if got != wanted:
            problems.append(f"{label} is {got!r} but should be {wanted!r}")

    with zipfile.ZipFile(path) as z:
        names = {unquote(n) for n in z.namelist()}
        man = ET.fromstring(z.read("AppxManifest.xml"))

    ident = man.find("m:Identity", NS)
    props = man.find("m:Properties", NS)
    app = man.find("m:Applications/m:Application", NS)
    visual = app.find("uap:VisualElements", NS)
    tile = visual.find("uap:DefaultTile", NS)
    langs = [r.get("Language") for r in man.findall("m:Resources/m:Resource", NS)]
    caps = [c.get("Name") for c in man.find("m:Capabilities", NS)]

    expect("Identity Name", ident.get("Name"), want["identityName"])
    expect("Identity Publisher", ident.get("Publisher"), want["publisher"])
    expect("Version", ident.get("Version"), pkg["version"] + ".0")
    expect("PublisherDisplayName", props.findtext("m:PublisherDisplayName", namespaces=NS), want["publisherDisplayName"])
    expect("DisplayName", props.findtext("m:DisplayName", namespaces=NS), want["displayName"])
    expect("Application Id", app.get("Id"), want["applicationId"])
    expect("Languages", langs, want["languages"])
    expect("Capabilities", caps, ["runFullTrust"])

    if "AppxSignature.p7x" in names:
        problems.append("the package is signed; the Store expects it unsigned with this publisher")
    exe = app.get("Executable").replace("\\", "/")
    for needed in (exe, "app/resources/app.asar", "resources.pri"):
        if needed not in names:
            problems.append(f"{needed} is missing from the package")

    logos = [props.findtext("m:Logo", namespaces=NS), visual.get("Square150x150Logo"), visual.get("Square44x44Logo")]
    logos += [tile.get(k) for k in ("Wide310x150Logo", "Square310x310Logo", "Square71x71Logo")]
    for logo in logos:
        if logo is None:
            problems.append("a tile image is not declared in the manifest")
        elif logo.replace("\\", "/") not in names:
            problems.append(f"{logo} is declared but missing from the package")
    assets = sorted(n for n in names if n.startswith("assets/"))
    if any("SampleAppx" in n for n in assets) or len(assets) < 20:
        problems.append("the Store icons from build/appx are not all in the package")

    size_mb = os.path.getsize(path) / 1e6
    summary = (
        f"{os.path.basename(path)} ({size_mb:.0f} MB): {ident.get('Name')} {ident.get('Version')} "
        f"{ident.get('ProcessorArchitecture')}, publisher {ident.get('Publisher')} ({props.findtext('m:PublisherDisplayName', namespaces=NS)}), "
        f"display name {props.findtext('m:DisplayName', namespaces=NS)!r}, languages {', '.join(langs)}, "
        f"capabilities {', '.join(caps)}, {len(assets)} icon files, "
        f"{'signed' if 'AppxSignature.p7x' in names else 'unsigned'}, {len(names)} files"
    )
    in_ci = os.environ.get("GITHUB_ACTIONS") == "true"
    print(("::notice title=Store package::" if in_ci else "") + summary)
    for p in problems:
        print(("::error title=Store package::" if in_ci else "PROBLEM: ") + p)
    return 1 if problems else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: python tools/check_store_package.py <file.appx>")
    sys.exit(main(sys.argv[1]))
