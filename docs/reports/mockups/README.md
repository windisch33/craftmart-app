# Reports Mockups

HTML mockups that reflect the updated requirements:
- Show both Invoice # and Order # (job item id) in invoice lists
- Provide a Job Items drill‑down (section, item, qty, unit price, line total)

Files
- `sales-by-salesman.html` — summary + invoice list + job items
- `unpaid-invoices.html` — unpaid with Order # column
- `tax-by-state.html` — invoice drill‑down with identifiers

Viewing
- Open any `.html` file directly in a browser.

Exporting to PNG (manual)
- In Chrome: File → Print → Save as PDF; or use DevTools `Capture full size screenshot`.

Exporting to PNG (headless Chrome via a container)
- If you have `zenika/alpine-chrome` locally:
  ```bash
  docker run --rm -v "$PWD":/work zenika/alpine-chrome:with-node \
    chromium-browser \
    --headless --disable-gpu --screenshot=/work/docs/reports/mockups/sales-by-salesman.png \
    --window-size=1600,1200 file:///work/docs/reports/mockups/sales-by-salesman.html
  ```
- Repeat for the other files.

Note
- Our `docker-compose` backend service does not mount the repository root, so headless export from inside that container will not see the `docs/` directory. Use the one‑off container run above or export manually from your browser.

