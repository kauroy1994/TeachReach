"""Insert the shared tutor on module office-hours pages."""
from html import escape


def tutor_markup(module, register):
    return (f'<div data-tr-tutor data-module="{escape(module)}" '
            f'data-register="{escape(register, quote=True)}"></div>')


def add_tutor_assets(html):
    return html.replace("</head>", '<link rel="stylesheet" href="../../../assets/tutor/chat.css">'
                        '<script type="module" src="../../../assets/tutor/chat.js?v=3"></script></head>', 1)


def add_office_tutor(page, html):
    if page.name != "office.html" or len(page.parts) != 4 or "data-tr-tutor" in html:
        return html
    module = "/".join(page.parts[1:3])
    host = tutor_markup(module, "index.html#question")
    # The original office-hours template has a two-column enclosing grid.
    for marker in ('<div class="room-panel-head">', '<label for="faq-search">'):
        if marker in html:
            return add_tutor_assets(html.replace(marker, host + marker, 1))
    raise ValueError(f"No tutor insertion point in {page}")
