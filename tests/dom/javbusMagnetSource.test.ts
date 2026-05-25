import { describe, expect, it } from 'vitest';
import {
  buildJavbusAjaxUrl,
  extractJavbusAjaxParams,
  getJavbusResponseDiagnostics,
  parseJavbusFallbackMagnets,
  parseJavbusMagnetRows,
} from '../../src/content/javbusMagnetSource';

describe('JAVBUS magnet source helpers', () => {
  it('extracts ajax params from a JAVBUS detail page', () => {
    const html = `
      <script>
        var gid = 987654;
        var uc = 0;
        var img = 'https://www.javbus.com/pics/cover/abc.jpg';
      </script>
    `;

    const params = extractJavbusAjaxParams(html);

    expect(params).toEqual({
      gid: '987654',
      uc: '0',
      img: 'https://www.javbus.com/pics/cover/abc.jpg',
    });
    expect(buildJavbusAjaxUrl(params!)).toBe(
      'https://www.javbus.com/ajax/uncledatoolsbyajax.php?gid=987654&lang=zh&img=https%3A%2F%2Fwww.javbus.com%2Fpics%2Fcover%2Fabc.jpg&uc=0',
    );
  });

  it('parses ajax table rows into magnet results', () => {
    const rows = `
      <tr>
        <td>
          <a href="magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567&dn=SSIS-795-C">SSIS-795-C 中文字幕 1080p</a>
          <a class="btn btn-primary">字幕</a>
          <a class="btn btn-primary">高清</a>
        </td>
        <td><a>5.20 GB</a></td>
        <td><a>2026-05-01</a></td>
      </tr>
      <tr>
        <td><a href="magnet:?xt=urn:btih:abcdefabcdefabcdefabcdefabcdefabcdefabcd">SSIS-795 720p</a></td>
        <td><a>1.1 GB</a></td>
        <td><a>2026-04-29</a></td>
      </tr>
      <tr>
        <td><a href="magnet:?xt=urn:btih:ignored">ABCD-123 wrong video</a></td>
        <td><a>800 MB</a></td>
        <td><a>2026-04-20</a></td>
      </tr>
    `;

    const results = parseJavbusMagnetRows(rows, 'SSIS-795');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      name: 'SSIS-795-C 中文字幕 1080p',
      size: '5.20 GB',
      sizeBytes: 5.2 * 1024 * 1024 * 1024,
      date: '2026-05-01',
      source: 'JAVBUS',
      hasSubtitle: true,
      quality: '1080p',
    });
    expect(results[0].magnet).toBe('magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567');
    expect(results[1]).toMatchObject({
      name: 'SSIS-795 720p',
      hasSubtitle: false,
      quality: '720p',
    });
  });

  it('accepts generic JAVBUS magnet names when the exact detail page response has no code in names', () => {
    const rows = `
      <tr>
        <td><a href="magnet:?xt=urn:btih:2222222222222222222222222222222222222222">中文字幕 1080p</a></td>
        <td><a>2.3 GB</a></td>
        <td><a>2026-05-02</a></td>
      </tr>
      <tr>
        <td><a href="magnet:?xt=urn:btih:3333333333333333333333333333333333333333">高清</a></td>
        <td><a>1.8 GB</a></td>
        <td><a>2026-05-01</a></td>
      </tr>
    `;

    const results = parseJavbusMagnetRows(rows, 'MEYD-992');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      name: '中文字幕 1080p',
      source: 'JAVBUS',
      hasSubtitle: true,
      quality: '1080p',
    });
  });

  it('extracts ajax params without requiring semicolons', () => {
    const html = `
      <script>
        var gid = 111222
        var uc = 1
        var img = "https://www.javbus.com/pics/cover/no-semicolon.jpg"
      </script>
    `;

    expect(extractJavbusAjaxParams(html)).toEqual({
      gid: '111222',
      uc: '1',
      img: 'https://www.javbus.com/pics/cover/no-semicolon.jpg',
    });
  });

  it('falls back to parsing magnet links from a full JAVBUS html document', () => {
    const html = `
      <!doctype html>
      <html>
        <body>
          <table>
            <tr>
              <td><a href="magnet:?xt=urn:btih:4444444444444444444444444444444444444444">JUR-730 中文字幕 高清</a></td>
              <td><a>7.1 GB</a></td>
              <td><a>2026-05-20</a></td>
            </tr>
          </table>
        </body>
      </html>
    `;

    const results = parseJavbusFallbackMagnets(html, 'JUR-730');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'JUR-730 中文字幕 高清',
      size: '7.1 GB',
      date: '2026-05-20',
      source: 'JAVBUS',
      hasSubtitle: true,
      quality: '1080p',
    });
  });

  it('parses raw magnet text when JAVBUS ajax markup is not table-shaped', () => {
    const html = `
      <div class="item" data-title="JUR-730 中文字幕 高清">
        <span>7.1 GB</span><span>2026-05-20</span>
        <button data-copy="magnet:?xt=urn:btih:5555555555555555555555555555555555555555&dn=JUR-730">copy</button>
      </div>
    `;

    const results = parseJavbusMagnetRows(html, 'JUR-730');

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      name: 'JUR-730 中文字幕 高清',
      source: 'JAVBUS',
      size: '7.1 GB',
      date: '2026-05-20',
      hasSubtitle: true,
      quality: '1080p',
    });
    expect(results[0].magnet).toBe('magnet:?xt=urn:btih:5555555555555555555555555555555555555555');
  });

  it('parses real JAVBUS ajax rows with onclick magnet links in every cell', () => {
    const html = `
      <tr onmouseover="this.style.backgroundColor='#F4F9FD';this.style.cursor='pointer';" height="35px">
        <td width="70%" onclick="window.open('magnet:?xt=urn:btih:05164e5d11111111111111111111111111111111','_self')">
          <a style="color:#333" rel="nofollow" href="magnet:?xt=urn:btih:05164e5d11111111111111111111111111111111"> JUR730 </a>
        </td>
        <td style="text-align:center" onclick="window.open('magnet:?xt=urn:btih:05164e5d11111111111111111111111111111111','_self')">
          <a href="magnet:?xt=urn:btih:05164e5d11111111111111111111111111111111"> 2.24GB </a>
        </td>
        <td style="text-align:center" onclick="window.open('magnet:?xt=urn:btih:05164e5d11111111111111111111111111111111','_self')">
          <a href="magnet:?xt=urn:btih:05164e5d11111111111111111111111111111111"> 2026-05-23 </a>
        </td>
      </tr>
      <tr height="35px">
        <td width="70%" onclick="window.open('magnet:?xt=urn:btih:7F7C25C222222222222222222222222222222222','_self')">
          <a href="magnet:?xt=urn:btih:7F7C25C222222222222222222222222222222222"> JUR-730 高清 </a>
        </td>
        <td><a href="magnet:?xt=urn:btih:7F7C25C222222222222222222222222222222222"> 7.10GB </a></td>
        <td><a href="magnet:?xt=urn:btih:7F7C25C222222222222222222222222222222222"> 2026-05-21 </a></td>
      </tr>
    `;

    const results = parseJavbusMagnetRows(html, 'JUR-730');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ name: 'JUR730', size: '2.24GB', date: '2026-05-23' });
    expect(results[1]).toMatchObject({ name: 'JUR-730 高清', size: '7.10GB', date: '2026-05-21', quality: '1080p' });
  });

  it('reports safe diagnostics for unparsed JAVBUS responses', () => {
    const diagnostics = getJavbusResponseDiagnostics('<div><a href="/x">无磁力</a></div>');

    expect(diagnostics).toMatchObject({
      rows: 0,
      anchors: 1,
      magnetTextCount: 0,
      encodedMagnetTextCount: 0,
      hasNoMagnetText: true,
    });
  });
});
