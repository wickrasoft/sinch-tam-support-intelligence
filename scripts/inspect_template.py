from pptx import Presentation
from pptx.util import Emu

SRC = "/Users/kalwic/Documents/Resume/Kalum Wickramatunga/Kalum - Sinch - TAM/30-60-90 Day Plan.pptx"
prs = Presentation(SRC)

print("Slide size:", Emu(prs.slide_width).inches, "x", Emu(prs.slide_height).inches)
print("Masters:", len(prs.slide_masters))

want = {
    "Title slide", "Chapter", "Agenda", "Title and content",
    "Title and Preamble w three colored boxes",
    "Title and Preamble w roadmap",
    "Title and four highlights",
    "Title and four content w icons",
    "TItle, text and timeline", "Timeline",
    "End cover", "Only title",
    "Title and Preamble w colored box",
    "Title, text and object",
}

for mi, master in enumerate(prs.slide_masters):
    for layout in master.slide_layouts:
        if layout.name in want:
            print("\n==== [master %d] LAYOUT: %s ====" % (mi, layout.name))
            for ph in layout.placeholders:
                f = ph.placeholder_format
                print("  idx=%s type=%s name=%r pos=(%.2f,%.2f) size=(%.2f,%.2f)" % (
                    f.idx, f.type, ph.name,
                    Emu(ph.left).inches if ph.left is not None else -1,
                    Emu(ph.top).inches if ph.top is not None else -1,
                    Emu(ph.width).inches if ph.width is not None else -1,
                    Emu(ph.height).inches if ph.height is not None else -1,
                ))
