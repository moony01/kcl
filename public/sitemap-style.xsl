<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml">

  <xsl:output method="html" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html lang="ko">
      <head>
        <title>MEARROW Sitemap - K-pop Talent Network</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #e4e4e7;
            min-height: 100vh;
            padding: 2rem;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          header {
            text-align: center;
            margin-bottom: 2rem;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            backdrop-filter: blur(10px);
          }
          h1 {
            font-size: 2rem;
            background: linear-gradient(90deg, #315cff, #5477ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 0.5rem;
          }
          .subtitle {
            color: #a1a1aa;
            font-size: 0.9rem;
          }
          .stats {
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 1rem;
          }
          .stat {
            text-align: center;
          }
          .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #315cff;
          }
          .stat-label {
            font-size: 0.75rem;
            color: #71717a;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            overflow: hidden;
          }
          th {
            background: rgba(99, 102, 241, 0.2);
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #a5b4fc;
          }
          td {
            padding: 0.75rem 1rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            font-size: 0.875rem;
          }
          tr:hover {
            background: rgba(99, 102, 241, 0.1);
          }
          a {
            color: #818cf8;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            color: #a5b4fc;
            text-decoration: underline;
          }
          .priority {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          .priority-high {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
          }
          .priority-medium {
            background: rgba(234, 179, 8, 0.2);
            color: #facc15;
          }
          .priority-low {
            background: rgba(161, 161, 170, 0.2);
            color: #a1a1aa;
          }
          .lang-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
          }
          .lang-tag {
            display: inline-block;
            padding: 0.125rem 0.375rem;
            background: rgba(139, 92, 246, 0.2);
            border-radius: 4px;
            font-size: 0.625rem;
            color: #c4b5fd;
            text-transform: uppercase;
          }
          footer {
            text-align: center;
            margin-top: 2rem;
            padding: 1rem;
            color: #71717a;
            font-size: 0.75rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <h1>MEARROW Sitemap</h1>
            <p class="subtitle">K-pop Talent Network - Search Engine Optimization</p>
            <div class="stats">
              <div class="stat">
                <div class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></div>
                <div class="stat-label">Total URLs</div>
              </div>
              <div class="stat">
                <div class="stat-value">12</div>
                <div class="stat-label">Languages</div>
              </div>
            </div>
          </header>

          <table>
            <thead>
              <tr>
                <th style="width: 50%">URL</th>
                <th>Priority</th>
                <th>Change Freq</th>
                <th>Languages</th>
                <th>Last Modified</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <xsl:choose>
                      <xsl:when test="sitemap:priority &gt;= 0.8">
                        <span class="priority priority-high"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:when>
                      <xsl:when test="sitemap:priority &gt;= 0.5">
                        <span class="priority priority-medium"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:when>
                      <xsl:otherwise>
                        <span class="priority priority-low"><xsl:value-of select="sitemap:priority"/></span>
                      </xsl:otherwise>
                    </xsl:choose>
                  </td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td>
                    <div class="lang-tags">
                      <xsl:for-each select="xhtml:link[@rel='alternate']">
                        <span class="lang-tag"><xsl:value-of select="@hreflang"/></span>
                      </xsl:for-each>
                    </div>
                  </td>
                  <td>
                    <xsl:value-of select="substring(sitemap:lastmod, 1, 10)"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <footer>
            <p>Generated by MEARROW (K-pop Talent Network) | <a href="https://mearrow.com">mearrow.com</a></p>
          </footer>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
