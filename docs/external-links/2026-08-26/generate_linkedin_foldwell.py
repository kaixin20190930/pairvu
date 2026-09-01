from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent / "linkedin-foldwell"
OUT.mkdir(parents=True, exist_ok=True)

BG_SOURCE = Path(__file__).resolve().parent / "linkedin-foldwell/background-imagegen.png"

W, H = 1080, 1350
INK = "#20312d"
MUTED = "#61716c"
SAGE = "#78978c"
GREEN = "#177451"
RED = "#b74343"
AMBER = "#a36a18"
PAPER = "#fffdf7"
FONT = "/System/Library/Fonts/SFNS.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size: int, bold: bool = False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT, size=size)


def canvas():
    bg = Image.open(BG_SOURCE).convert("RGB")
    return ImageOps.fit(bg, (W, H), method=Image.Resampling.LANCZOS)


def rounded_card(draw, box, fill="#fffefb", outline="#d9e0dc", radius=28, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw, xy, value, size, color=INK, bold=False, anchor=None, spacing=8):
    draw.multiline_text(
        xy,
        value,
        font=font(size, bold),
        fill=color,
        anchor=anchor,
        spacing=spacing,
        align="center" if anchor and anchor.startswith("m") else "left",
    )


def brand(draw, slide):
    text(draw, (70, 62), "PAIRVU", 23, SAGE, True)
    text(draw, (1010, 62), f"{slide}/5", 20, MUTED, False, "ra")


def fit_image(path, size):
    img = Image.open(path).convert("RGB")
    return ImageOps.fit(img, size, method=Image.Resampling.LANCZOS)


def pair_block(base, original, candidate, y=360):
    d = ImageDraw.Draw(base)
    card_w, card_h, gap = 450, 500, 36
    x1 = (W - card_w * 2 - gap) // 2
    x2 = x1 + card_w + gap
    for x, label, path in [(x1, "ORIGINAL", original), (x2, "CANDIDATE", candidate)]:
        rounded_card(d, (x, y, x + card_w, y + card_h), radius=24)
        text(d, (x + 24, y + 28), label, 20, MUTED, True)
        img = fit_image(path, (402, 402))
        base.paste(img, (x + 24, y + 72))


def save(img, name):
    img.save(OUT / name, format="PNG", optimize=True)


def slide_cover():
    img = canvas()
    d = ImageDraw.Draw(img)
    brand(d, 1)
    text(d, (W // 2, 270), "THREE OUTCOMES", 28, SAGE, True, "mm")
    text(d, (W // 2, 425), "Every AI product image\nQA workflow needs", 64, INK, True, "mm", 16)
    for x, label, color in [(230, "FAIL", RED), (540, "PASS", GREEN), (850, "REVIEW", AMBER)]:
        rounded_card(d, (x - 125, 650, x + 125, 770), fill=PAPER, outline=color, radius=30, width=4)
        text(d, (x, 710), label, 34, color, True, "mm")
    text(d, (W // 2, 920), "A controlled visual QA example\nfor AI-generated product photography", 35, MUTED, False, "mm", 12)
    text(d, (W // 2, 1225), "Swipe to see why uncertainty must not become a pass.", 25, INK, True, "mm")
    save(img, "01-cover.png")


def slide_fail():
    img = canvas()
    d = ImageDraw.Draw(img)
    brand(d, 2)
    text(d, (70, 145), "FAIL", 34, RED, True)
    text(d, (70, 200), "The visible product changed", 48, INK, True)
    pair_block(
        img,
        ROOT / "public/examples/foldwell-scent-count-change/original.png",
        ROOT / "public/examples/foldwell-scent-count-change/candidate.png",
        320,
    )
    rounded_card(d, (80, 880, 1000, 1160), fill="#fff9f7", outline="#e5b8b4", radius=28, width=3)
    text(d, (120, 930), "CONFIRMED CHANGES", 22, RED, True)
    text(d, (120, 990), "Fresh Linen → Unscented\n30 sheets → 20 sheets", 38, INK, True, spacing=18)
    text(d, (120, 1105), "A creative edit must not change visible product claims.", 24, MUTED)
    save(img, "02-fail.png")


def slide_pass():
    img = canvas()
    d = ImageDraw.Draw(img)
    brand(d, 3)
    text(d, (70, 145), "PASS", 34, GREEN, True)
    text(d, (70, 200), "Only the background changed", 48, INK, True)
    pair_block(
        img,
        ROOT / "public/examples/foldwell-background-change/original.png",
        ROOT / "public/examples/foldwell-background-change/candidate.png",
        320,
    )
    rounded_card(d, (80, 880, 1000, 1160), fill="#f7fcf9", outline="#afd7c4", radius=28, width=3)
    text(d, (120, 930), "VISIBLE CLAIMS STAYED CONSISTENT", 22, GREEN, True)
    text(d, (120, 995), "Same scent. Same sheet count.\nSame product identity.", 36, INK, True, spacing=16)
    text(d, (120, 1110), "A valid scene change should not fail.", 24, MUTED)
    save(img, "03-pass.png")


def slide_review():
    img = canvas()
    d = ImageDraw.Draw(img)
    brand(d, 4)
    text(d, (70, 145), "REVIEW", 34, AMBER, True)
    text(d, (70, 200), "The evidence is not observable", 48, INK, True)
    pair_block(
        img,
        ROOT / "public/examples/foldwell-back-view/original.png",
        ROOT / "public/examples/foldwell-back-view/candidate.png",
        320,
    )
    rounded_card(d, (80, 880, 1000, 1160), fill="#fffaf1", outline="#e2c48f", radius=28, width=3)
    text(d, (120, 930), "FRONT VS. BACK", 22, AMBER, True)
    text(d, (120, 995), "Front-label claims cannot be\nverified from the back view.", 36, INK, True, spacing=16)
    text(d, (120, 1110), "Do not guess. Send it to review.", 24, MUTED)
    save(img, "04-review.png")


def slide_close():
    img = canvas()
    d = ImageDraw.Draw(img)
    brand(d, 5)
    text(d, (W // 2, 235), "A background change\nshould not fail.", 56, INK, True, "mm", 14)
    text(d, (W // 2, 440), "A hidden product label\nshould not pass.", 56, INK, True, "mm", 14)
    rounded_card(d, (100, 630, 980, 865), fill=PAPER, outline="#b9c9c3", radius=34, width=3)
    text(d, (W // 2, 705), "PAIRVU", 25, SAGE, True, "mm")
    text(d, (W // 2, 780), "Separate confirmed changes\nfrom unobservable evidence.", 38, INK, True, "mm", 12)
    text(d, (W // 2, 1015), "Try the visual QA checker", 28, MUTED, False, "mm")
    text(d, (W // 2, 1080), "pairvu.com", 42, GREEN, True, "mm")
    text(
        d,
        (W // 2, 1240),
        "Selected, founder-reviewed controlled example.\nNot a population-level accuracy estimate or independent certification.",
        19,
        MUTED,
        False,
        "mm",
        7,
    )
    save(img, "05-close.png")


slide_cover()
slide_fail()
slide_pass()
slide_review()
slide_close()
print(OUT)
