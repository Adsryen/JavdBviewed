// vite.config.ts
import { defineConfig } from "file:///E:/JavdBviewed/javdb-extension/node_modules/.pnpm/vite@5.4.19_@types+node@24.1.0/node_modules/vite/dist/node/index.js";
import { crx } from "file:///E:/JavdBviewed/javdb-extension/node_modules/.pnpm/@crxjs+vite-plugin@2.0.3/node_modules/@crxjs/vite-plugin/dist/index.mjs";

// src/manifest.json
var manifest_default = {
  manifest_version: 3,
  name: "Jav \u52A9\u624B",
  version: "1.7.0",
  description: "Jav\u89C6\u9891\u6D4F\u89C8\u52A9\u624B\uFF0C\u63D0\u4F9B\u89C2\u770B\u6807\u8BB0\u3001\u9AD8\u7EA7\u7B5B\u9009\u548C\u6570\u636E\u7BA1\u7406\u529F\u80FD\u3002",
  permissions: [
    "storage",
    "tabs",
    "alarms",
    "scripting",
    "notifications"
  ],
  host_permissions: [
    "*://*.javdb.com/*",
    "https://dav.jianguoyun.com/*",
    "https://*.teracloud.jp/*",
    "https://*.webdav.yandex.com/*",
    "https://*.nextcloud.com/*",
    "*://*.sukebei.nyaa.si/*",
    "*://*.btdig.com/*",
    "*://*.btsow.com/*",
    "*://*.torrentz2.eu/*",
    "https://*.owncloud.com/*",
    "https://115.com/*",
    "https://*.115.com/*",
    "https://webapi.115.com/*",
    "https://captchaapi.115.com/*",
    "https://uplb.115.com/*",
    "https://v.anxia.com/*",
    "https://*/*",
    "http://*/*"
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https: http:;"
  },
  background: {
    service_worker: "background/background.ts",
    type: "module"
  },
  content_scripts: [
    {
      matches: [
        "*://*.javdb.com/*"
      ],
      js: [
        "content/index.ts"
      ],
      run_at: "document_end"
    },
    {
      matches: [
        "*://115.com/*",
        "*://*.115.com/*"
      ],
      js: [
        "content/drive115-content.ts"
      ],
      run_at: "document_end"
    },
    {
      matches: [
        "*://captchaapi.115.com/*"
      ],
      js: [
        "content/drive115-verify.ts"
      ],
      run_at: "document_end"
    }
  ],
  action: {
    default_popup: "popup/popup.html",
    default_icon: {
      "16": "assets/favicon-16x16.png",
      "32": "assets/favicon-32x32.png",
      "48": "assets/favicon-48x48.png",
      "128": "assets/favicon-128x128.png"
    }
  },
  icons: {
    "16": "assets/favicon-16x16.png",
    "32": "assets/favicon-32x32.png",
    "48": "assets/favicon-48x48.png",
    "128": "assets/favicon-128x128.png"
  },
  options_ui: {
    page: "dashboard/dashboard.html",
    open_in_tab: true
  },
  web_accessible_resources: [
    {
      resources: [
        "assets/switch.png",
        "assets/favicon-32x32.png",
        "assets/javbus.ico",
        "assets/javdb.ico",
        "assets/alternate-search.png",
        "assets/115-logo.svg"
      ],
      matches: ["*://*.javdb.com/*"]
    }
  ]
};

// vite.config.ts
import path from "path";
import fs from "fs";
var __vite_injected_original_dirname = "E:\\JavdBviewed\\javdb-extension";
function getUpdatedManifest() {
  const manifestCopy = { ...manifest_default };
  try {
    const versionJsonPath = path.resolve(__vite_injected_original_dirname, "version.json");
    if (fs.existsSync(versionJsonPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionJsonPath, "utf8"));
      if (versionData.version) {
        manifestCopy.version = versionData.version;
        console.log(`\u{1F4E6} Manifest version synced to: ${versionData.version}`);
      }
    }
  } catch (error) {
    console.warn("\u26A0\uFE0F  Could not sync manifest version from version.json:", error.message);
  }
  return manifestCopy;
}
var vite_config_default = defineConfig({
  root: "src",
  envDir: "..",
  plugins: [
    crx({ manifest: getUpdatedManifest() })
  ],
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist"),
    emptyOutDir: true
    /*
    rollupOptions: {
      onwarn(warning, warn) {
        // 抑制动态导入和静态导入冲突的警告
        if (warning.code === 'DYNAMIC_IMPORT_STATIC_IMPORT_CONFLICT') {
          return;
        }
        // 其他警告正常显示
        warn(warning);
      }
    }*/
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAic3JjL21hbmlmZXN0Lmpzb24iXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxKYXZkQnZpZXdlZFxcXFxqYXZkYi1leHRlbnNpb25cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkU6XFxcXEphdmRCdmlld2VkXFxcXGphdmRiLWV4dGVuc2lvblxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRTovSmF2ZEJ2aWV3ZWQvamF2ZGItZXh0ZW5zaW9uL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcbmltcG9ydCB7IGNyeCB9IGZyb20gJ0Bjcnhqcy92aXRlLXBsdWdpbic7XHJcbmltcG9ydCBtYW5pZmVzdCBmcm9tICcuL3NyYy9tYW5pZmVzdC5qc29uJztcclxuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcblxyXG4vLyBcdTUyQThcdTYwMDFcdTU0MENcdTZCNjUgbWFuaWZlc3QudmVyc2lvbiBcdTRFQ0UgdmVyc2lvbi5qc29uXHVGRjA4XHU0RUM1XHU1NzI4XHU2Nzg0XHU1RUZBXHU2NUY2XHVGRjA5XHJcbmZ1bmN0aW9uIGdldFVwZGF0ZWRNYW5pZmVzdCgpIHtcclxuICBjb25zdCBtYW5pZmVzdENvcHkgPSB7IC4uLm1hbmlmZXN0IH07XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB2ZXJzaW9uSnNvblBhdGggPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAndmVyc2lvbi5qc29uJyk7XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyh2ZXJzaW9uSnNvblBhdGgpKSB7XHJcbiAgICAgIGNvbnN0IHZlcnNpb25EYXRhID0gSlNPTi5wYXJzZShmcy5yZWFkRmlsZVN5bmModmVyc2lvbkpzb25QYXRoLCAndXRmOCcpKTtcclxuICAgICAgaWYgKHZlcnNpb25EYXRhLnZlcnNpb24pIHtcclxuICAgICAgICBtYW5pZmVzdENvcHkudmVyc2lvbiA9IHZlcnNpb25EYXRhLnZlcnNpb247XHJcbiAgICAgICAgY29uc29sZS5sb2coYFx1RDgzRFx1RENFNiBNYW5pZmVzdCB2ZXJzaW9uIHN5bmNlZCB0bzogJHt2ZXJzaW9uRGF0YS52ZXJzaW9ufWApO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUud2FybignXHUyNkEwXHVGRTBGICBDb3VsZCBub3Qgc3luYyBtYW5pZmVzdCB2ZXJzaW9uIGZyb20gdmVyc2lvbi5qc29uOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIG1hbmlmZXN0Q29weTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICByb290OiAnc3JjJyxcclxuICBlbnZEaXI6ICcuLicsXHJcbiAgcGx1Z2luczogW1xyXG4gICAgY3J4KHsgbWFuaWZlc3Q6IGdldFVwZGF0ZWRNYW5pZmVzdCgpIH0pLFxyXG4gIF0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIG91dERpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2Rpc3QnKSxcclxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxyXG4gICAgLypcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb253YXJuKHdhcm5pbmcsIHdhcm4pIHtcclxuICAgICAgICAvLyBcdTYyOTFcdTUyMzZcdTUyQThcdTYwMDFcdTVCRkNcdTUxNjVcdTU0OENcdTk3NTlcdTYwMDFcdTVCRkNcdTUxNjVcdTUxQjJcdTdBODFcdTc2ODRcdThCNjZcdTU0NEFcclxuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnRFlOQU1JQ19JTVBPUlRfU1RBVElDX0lNUE9SVF9DT05GTElDVCcpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gXHU1MTc2XHU0RUQ2XHU4QjY2XHU1NDRBXHU2QjYzXHU1RTM4XHU2NjNFXHU3OTNBXHJcbiAgICAgICAgd2Fybih3YXJuaW5nKTtcclxuICAgICAgfVxyXG4gICAgfSovXHJcbiAgfSxcclxufSk7IiwgIntcclxuICAgIFwibWFuaWZlc3RfdmVyc2lvblwiOiAzLFxyXG4gICAgXCJuYW1lXCI6IFwiSmF2IFx1NTJBOVx1NjI0QlwiLFxyXG4gICAgXCJ2ZXJzaW9uXCI6IFwiMS43LjBcIixcclxuICAgIFwiZGVzY3JpcHRpb25cIjogXCJKYXZcdTg5QzZcdTk4OTFcdTZENEZcdTg5QzhcdTUyQTlcdTYyNEJcdUZGMENcdTYzRDBcdTRGOUJcdTg5QzJcdTc3MEJcdTY4MDdcdThCQjBcdTMwMDFcdTlBRDhcdTdFQTdcdTdCNUJcdTkwMDlcdTU0OENcdTY1NzBcdTYzNkVcdTdCQTFcdTc0MDZcdTUyOUZcdTgwRkRcdTMwMDJcIixcclxuICAgIFwicGVybWlzc2lvbnNcIjogW1xyXG4gICAgICAgIFwic3RvcmFnZVwiLFxyXG4gICAgICAgIFwidGFic1wiLFxyXG4gICAgICAgIFwiYWxhcm1zXCIsXHJcbiAgICAgICAgXCJzY3JpcHRpbmdcIixcclxuICAgICAgICBcIm5vdGlmaWNhdGlvbnNcIlxyXG4gICAgXSxcclxuICAgIFwiaG9zdF9wZXJtaXNzaW9uc1wiOiBbXHJcbiAgICAgICAgXCIqOi8vKi5qYXZkYi5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly9kYXYuamlhbmd1b3l1bi5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly8qLnRlcmFjbG91ZC5qcC8qXCIsXHJcbiAgICAgICAgXCJodHRwczovLyoud2ViZGF2LnlhbmRleC5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly8qLm5leHRjbG91ZC5jb20vKlwiLFxyXG4gICAgICAgIFwiKjovLyouc3VrZWJlaS5ueWFhLnNpLypcIixcclxuICAgICAgICBcIio6Ly8qLmJ0ZGlnLmNvbS8qXCIsXHJcbiAgICAgICAgXCIqOi8vKi5idHNvdy5jb20vKlwiLFxyXG4gICAgICAgIFwiKjovLyoudG9ycmVudHoyLmV1LypcIixcclxuICAgICAgICBcImh0dHBzOi8vKi5vd25jbG91ZC5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly8xMTUuY29tLypcIixcclxuICAgICAgICBcImh0dHBzOi8vKi4xMTUuY29tLypcIixcclxuICAgICAgICBcImh0dHBzOi8vd2ViYXBpLjExNS5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly9jYXB0Y2hhYXBpLjExNS5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly91cGxiLjExNS5jb20vKlwiLFxyXG4gICAgICAgIFwiaHR0cHM6Ly92LmFueGlhLmNvbS8qXCIsXHJcbiAgICAgICAgXCJodHRwczovLyovKlwiLFxyXG4gICAgICAgIFwiaHR0cDovLyovKlwiXHJcbiAgICBdLFxyXG4gICAgXCJjb250ZW50X3NlY3VyaXR5X3BvbGljeVwiOiB7XHJcbiAgICAgICAgXCJleHRlbnNpb25fcGFnZXNcIjogXCJzY3JpcHQtc3JjICdzZWxmJzsgb2JqZWN0LXNyYyAnc2VsZic7IGltZy1zcmMgJ3NlbGYnIGRhdGE6IGh0dHBzOjsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbTsgZm9udC1zcmMgJ3NlbGYnIGh0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb207IGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczogaHR0cDo7XCJcclxuICAgIH0sXHJcbiAgICBcImJhY2tncm91bmRcIjoge1xyXG4gICAgICAgIFwic2VydmljZV93b3JrZXJcIjogXCJiYWNrZ3JvdW5kL2JhY2tncm91bmQudHNcIixcclxuICAgICAgICBcInR5cGVcIjogXCJtb2R1bGVcIlxyXG4gICAgfSxcclxuICAgIFwiY29udGVudF9zY3JpcHRzXCI6IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFwibWF0Y2hlc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcIio6Ly8qLmphdmRiLmNvbS8qXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJqc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQvaW5kZXgudHNcIlxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBcInJ1bl9hdFwiOiBcImRvY3VtZW50X2VuZFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFwibWF0Y2hlc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcIio6Ly8xMTUuY29tLypcIixcclxuICAgICAgICAgICAgICAgIFwiKjovLyouMTE1LmNvbS8qXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJqc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQvZHJpdmUxMTUtY29udGVudC50c1wiXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFwicnVuX2F0XCI6IFwiZG9jdW1lbnRfZW5kXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXCJtYXRjaGVzXCI6IFtcclxuICAgICAgICAgICAgICAgIFwiKjovL2NhcHRjaGFhcGkuMTE1LmNvbS8qXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJqc1wiOiBbXHJcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQvZHJpdmUxMTUtdmVyaWZ5LnRzXCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJydW5fYXRcIjogXCJkb2N1bWVudF9lbmRcIlxyXG4gICAgICAgIH1cclxuICAgIF0sXHJcbiAgICBcImFjdGlvblwiOiB7XHJcbiAgICAgICAgXCJkZWZhdWx0X3BvcHVwXCI6IFwicG9wdXAvcG9wdXAuaHRtbFwiLFxyXG4gICAgICAgIFwiZGVmYXVsdF9pY29uXCI6IHtcclxuICAgICAgICAgICAgXCIxNlwiOiBcImFzc2V0cy9mYXZpY29uLTE2eDE2LnBuZ1wiLFxyXG4gICAgICAgICAgICBcIjMyXCI6IFwiYXNzZXRzL2Zhdmljb24tMzJ4MzIucG5nXCIsXHJcbiAgICAgICAgICAgIFwiNDhcIjogXCJhc3NldHMvZmF2aWNvbi00OHg0OC5wbmdcIixcclxuICAgICAgICAgICAgXCIxMjhcIjogXCJhc3NldHMvZmF2aWNvbi0xMjh4MTI4LnBuZ1wiXHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiaWNvbnNcIjoge1xyXG4gICAgICAgIFwiMTZcIjogXCJhc3NldHMvZmF2aWNvbi0xNngxNi5wbmdcIixcclxuICAgICAgICBcIjMyXCI6IFwiYXNzZXRzL2Zhdmljb24tMzJ4MzIucG5nXCIsXHJcbiAgICAgICAgXCI0OFwiOiBcImFzc2V0cy9mYXZpY29uLTQ4eDQ4LnBuZ1wiLFxyXG4gICAgICAgIFwiMTI4XCI6IFwiYXNzZXRzL2Zhdmljb24tMTI4eDEyOC5wbmdcIlxyXG4gICAgfSxcclxuICAgIFwib3B0aW9uc191aVwiOiB7XHJcbiAgICAgICAgXCJwYWdlXCI6IFwiZGFzaGJvYXJkL2Rhc2hib2FyZC5odG1sXCIsXHJcbiAgICAgICAgXCJvcGVuX2luX3RhYlwiOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgXCJ3ZWJfYWNjZXNzaWJsZV9yZXNvdXJjZXNcIjogW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgXCJyZXNvdXJjZXNcIjogW1xyXG4gICAgICAgICAgICAgICAgXCJhc3NldHMvc3dpdGNoLnBuZ1wiLFxyXG4gICAgICAgICAgICAgICAgXCJhc3NldHMvZmF2aWNvbi0zMngzMi5wbmdcIixcclxuICAgICAgICAgICAgICAgIFwiYXNzZXRzL2phdmJ1cy5pY29cIixcclxuICAgICAgICAgICAgICAgIFwiYXNzZXRzL2phdmRiLmljb1wiLFxyXG4gICAgICAgICAgICAgICAgXCJhc3NldHMvYWx0ZXJuYXRlLXNlYXJjaC5wbmdcIixcclxuICAgICAgICAgICAgICAgIFwiYXNzZXRzLzExNS1sb2dvLnN2Z1wiXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFwibWF0Y2hlc1wiOiBbXCIqOi8vKi5qYXZkYi5jb20vKlwiXVxyXG4gICAgICAgIH1cclxuICAgIF1cclxufSAiXSwKICAibWFwcGluZ3MiOiAiO0FBQWtSLFNBQVMsb0JBQW9CO0FBQy9TLFNBQVMsV0FBVzs7O0FDRHBCO0FBQUEsRUFDSSxrQkFBb0I7QUFBQSxFQUNwQixNQUFRO0FBQUEsRUFDUixTQUFXO0FBQUEsRUFDWCxhQUFlO0FBQUEsRUFDZixhQUFlO0FBQUEsSUFDWDtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNKO0FBQUEsRUFDQSxrQkFBb0I7QUFBQSxJQUNoQjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDSjtBQUFBLEVBQ0EseUJBQTJCO0FBQUEsSUFDdkIsaUJBQW1CO0FBQUEsRUFDdkI7QUFBQSxFQUNBLFlBQWM7QUFBQSxJQUNWLGdCQUFrQjtBQUFBLElBQ2xCLE1BQVE7QUFBQSxFQUNaO0FBQUEsRUFDQSxpQkFBbUI7QUFBQSxJQUNmO0FBQUEsTUFDSSxTQUFXO0FBQUEsUUFDUDtBQUFBLE1BQ0o7QUFBQSxNQUNBLElBQU07QUFBQSxRQUNGO0FBQUEsTUFDSjtBQUFBLE1BQ0EsUUFBVTtBQUFBLElBQ2Q7QUFBQSxJQUNBO0FBQUEsTUFDSSxTQUFXO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBQUEsTUFDQSxJQUFNO0FBQUEsUUFDRjtBQUFBLE1BQ0o7QUFBQSxNQUNBLFFBQVU7QUFBQSxJQUNkO0FBQUEsSUFDQTtBQUFBLE1BQ0ksU0FBVztBQUFBLFFBQ1A7QUFBQSxNQUNKO0FBQUEsTUFDQSxJQUFNO0FBQUEsUUFDRjtBQUFBLE1BQ0o7QUFBQSxNQUNBLFFBQVU7QUFBQSxJQUNkO0FBQUEsRUFDSjtBQUFBLEVBQ0EsUUFBVTtBQUFBLElBQ04sZUFBaUI7QUFBQSxJQUNqQixjQUFnQjtBQUFBLE1BQ1osTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLElBQ1g7QUFBQSxFQUNKO0FBQUEsRUFDQSxPQUFTO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsRUFDWDtBQUFBLEVBQ0EsWUFBYztBQUFBLElBQ1YsTUFBUTtBQUFBLElBQ1IsYUFBZTtBQUFBLEVBQ25CO0FBQUEsRUFDQSwwQkFBNEI7QUFBQSxJQUN4QjtBQUFBLE1BQ0ksV0FBYTtBQUFBLFFBQ1Q7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0o7QUFBQSxNQUNBLFNBQVcsQ0FBQyxtQkFBbUI7QUFBQSxJQUNuQztBQUFBLEVBQ0o7QUFDSjs7O0FEbEdBLE9BQU8sVUFBVTtBQUNqQixPQUFPLFFBQVE7QUFKZixJQUFNLG1DQUFtQztBQU96QyxTQUFTLHFCQUFxQjtBQUM1QixRQUFNLGVBQWUsRUFBRSxHQUFHLGlCQUFTO0FBRW5DLE1BQUk7QUFDRixVQUFNLGtCQUFrQixLQUFLLFFBQVEsa0NBQVcsY0FBYztBQUM5RCxRQUFJLEdBQUcsV0FBVyxlQUFlLEdBQUc7QUFDbEMsWUFBTSxjQUFjLEtBQUssTUFBTSxHQUFHLGFBQWEsaUJBQWlCLE1BQU0sQ0FBQztBQUN2RSxVQUFJLFlBQVksU0FBUztBQUN2QixxQkFBYSxVQUFVLFlBQVk7QUFDbkMsZ0JBQVEsSUFBSSx5Q0FBa0MsWUFBWSxPQUFPLEVBQUU7QUFBQSxNQUNyRTtBQUFBLElBQ0Y7QUFBQSxFQUNGLFNBQVMsT0FBTztBQUNkLFlBQVEsS0FBSyxvRUFBMEQsTUFBTSxPQUFPO0FBQUEsRUFDdEY7QUFFQSxTQUFPO0FBQ1Q7QUFFQSxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsRUFDUixTQUFTO0FBQUEsSUFDUCxJQUFJLEVBQUUsVUFBVSxtQkFBbUIsRUFBRSxDQUFDO0FBQUEsRUFDeEM7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVEsS0FBSyxRQUFRLGtDQUFXLE1BQU07QUFBQSxJQUN0QyxhQUFhO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBWWY7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
