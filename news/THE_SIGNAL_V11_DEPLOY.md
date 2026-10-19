# The Signal — editorial/mobile refinement (v11)

This is a static HTML/CSS/JavaScript upgrade for `/news/`. It has no build step or additional runtime dependencies. It is compatible with the existing GitHub Pages structure and custom domain configuration.

## What changed

- The archive and all 22 full article pages load `news-v11.css`; each full article also loads `news-v11.js`.
- Article titles and artwork are less oversized on desktop. Artwork is shown in its entirety rather than cropped.
- Reading areas use a consistent neutral editorial layout, with restrained story-specific accents, reduced box styling, and natural-case takeaway headings.
- On mobile, article headers are more compact and the text-size tools share one row. A small native expandable **Jump to a section** navigator reuses existing section links.
- Article share buttons now use a proper vector sharing icon. Previous sharing, bookmarking, text-resizing, archive search and filters remain in place.
- Original article prose, images, metadata, animation rules, article destinations and unrelated portfolio pages were not edited.

## Publishing to an existing GitHub repository

1. **Back up or clone** your repository first. Confirm that its root contains `index.html`, the `news` directory, `CNAME`, and `.nojekyll`.
2. For the complete ZIP, **extract it first**. The ZIP already starts at the repository root (`index.html`, `news/`, etc.). Copy the extracted **contents** into the repository root, replacing files with matching paths. Do **not** upload the ZIP itself as if it were a website file, and do not create an extra containing directory.
3. Alternatively, extract the **news-only update** and copy its `news/` directory **into your existing repository root** (merging the directory). The existing files will be updated and the new `news-v11.css` and `news-v11.js` files will be added.
4. Commit and push to the branch and folder configured in **Settings → Pages**. For example, in a local clone: `git add -A && git commit -m "Polish The Signal news experience" && git push`.
5. Check `/news/` and a few article URLs on the published site after deployment, and hard-refresh if the previous design is cached.

Git/GitHub replaces a file **at the same path** in the new commit; it does not create `index (2).html` unless you explicitly name it that way. Keep the directory structure exact.

## Checks performed

- Responsive article layouts checked for all 22 articles at 320, 390, 768, 1024, 1360 and 1920 px (132 page/viewport combinations); no horizontal overflow or uncaught JavaScript errors in the tested browser.
- Archive search/reset and Load More, text-size increments/reset, mobile section navigation, saved stories and sharing fallback checked in Chromium.
- Verified 1,213 local HTML asset/navigation references across the website; no missing local file paths.
- Compared article page text and non-news files against the prior ZIP: all article text preserved, no existing non-news files modified.

These are local Chromium-based checks, **not** a promise of live hosting or physical-iPhone/Safari validation. The published deployment should be checked separately.
