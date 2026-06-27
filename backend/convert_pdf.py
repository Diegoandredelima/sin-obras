"""Converte arquivos .md para PDF usando weasyprint."""
import markdown
import weasyprint
import sys
import os

CSS = """
body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    margin: 20px;
    color: #1a1a1a;
}
h1 {
    font-size: 20px;
    border-bottom: 2px solid #2563eb;
    padding-bottom: 6px;
}
h2 {
    font-size: 15px;
    border-bottom: 1px solid #d1d5db;
    padding-bottom: 4px;
    margin-top: 20px;
}
h3 { font-size: 13px; }
h4 { font-size: 12px; }
pre {
    background: #f3f4f6;
    padding: 10px;
    border-radius: 4px;
    font-family: Consolas, monospace;
    font-size: 9px;
    white-space: pre-wrap;
    word-break: break-all;
}
code {
    background: #f3f4f6;
    padding: 1px 4px;
    border-radius: 3px;
    font-family: Consolas, monospace;
    font-size: 9px;
}
table {
    border-collapse: collapse;
    width: 100%;
    margin: 10px 0;
    font-size: 10px;
}
th, td {
    border: 1px solid #d1d5db;
    padding: 5px 8px;
    text-align: left;
}
th {
    background: #2563eb;
    color: white;
}
tr:nth-child(even) { background: #f9fafb; }
blockquote {
    border-left: 3px solid #2563eb;
    margin: 10px 0;
    padding: 5px 15px;
    background: #eff6ff;
}
hr {
    border: none;
    border-top: 1px solid #d1d5db;
    margin: 20px 0;
}
"""

def convert(md_path: str):
    with open(md_path, "r", encoding="utf-8") as f:
        md_content = f.read()

    html_body = markdown.markdown(
        md_content, extensions=["tables", "fenced_code", "codehilite"]
    )

    html_full = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<style>{CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""

    pdf_path = md_path.replace(".md", ".pdf")
    weasyprint.HTML(string=html_full).write_pdf(pdf_path)
    print(f"PDF gerado: {pdf_path} ({os.path.getsize(pdf_path)} bytes)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python convert_pdf.py arquivo.md")
        sys.exit(1)
    convert(sys.argv[1])
