(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TrackingMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/styled-jsx/style.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$MapContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/react-leaflet/lib/MapContainer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$TileLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/react-leaflet/lib/TileLayer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Marker$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/react-leaflet/lib/Marker.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Popup$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/react-leaflet/lib/Popup.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/react-leaflet/lib/hooks.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/leaflet/dist/leaflet-src.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/COURSES/hopla/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
;
// Custom Destination Icon (Enhanced Minimalist Apple-style)
const DestinationIcon = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].divIcon({
    className: 'custom-dest-icon',
    html: `
    <div style="display: flex; flex-direction: column; align-items: center;">
      <div style="
        background: #34C759; 
        width: 24px; height: 24px; 
        border: 3px solid white;
        border-radius: 50%; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        display: flex; align-items: center; justify-content: center;
      ">
         <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
      </div>
      <div style="
        width: 4px; height: 6px; 
        background: white; 
        margin-top: -2px;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      "></div>
    </div>
  `,
    iconSize: [
        30,
        30
    ],
    iconAnchor: [
        15,
        28
    ]
});
// Custom Driver Icon
const DriverIcon = __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$leaflet$2f$dist$2f$leaflet$2d$src$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].divIcon({
    className: 'custom-driver-icon',
    html: `
    <div style="
      background: #007AFF; 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      border: 3px solid white; 
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    ">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    </div>
  `,
    iconSize: [
        40,
        40
    ],
    iconAnchor: [
        20,
        20
    ]
});
// Component to handle map center updates
function ChangeView({ center }) {
    _s();
    const map = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMap"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ChangeView.useEffect": ()=>{
            if (map && center && !isNaN(center[0])) {
                map.setView(center, map.getZoom());
            }
        }
    }["ChangeView.useEffect"], [
        center,
        map
    ]);
    return null;
}
_s(ChangeView, "IoceErwr5KVGS9kN4RQ1bOkYMAg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$hooks$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMap"]
    ];
});
_c = ChangeView;
function TrackingMap({ status, clientCoords }) {
    _s1();
    // Strasbourg default fallback
    const strasbourgCenter = [
        48.5734,
        7.7521
    ];
    const [driverPos, setDriverPos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(strasbourgCenter);
    const [clientPos, setClientPos] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(clientCoords ? [
        clientCoords.lat,
        clientCoords.lng
    ] : strasbourgCenter);
    // Update center when clientCoords change
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TrackingMap.useEffect": ()=>{
            if (clientCoords && !isNaN(clientCoords.lat)) {
                setClientPos([
                    clientCoords.lat,
                    clientCoords.lng
                ]);
            }
        }
    }["TrackingMap.useEffect"], [
        clientCoords
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TrackingMap.useEffect": ()=>{
            if (status === 'taken' || status === 'delivering') {
                const interval = setInterval({
                    "TrackingMap.useEffect.interval": ()=>{
                        setDriverPos({
                            "TrackingMap.useEffect.interval": (prev)=>[
                                    prev[0] + (Math.random() - 0.5) * 0.001,
                                    prev[1] + (Math.random() - 0.5) * 0.001
                                ]
                        }["TrackingMap.useEffect.interval"]);
                    }
                }["TrackingMap.useEffect.interval"], 5000);
                return ({
                    "TrackingMap.useEffect": ()=>clearInterval(interval)
                })["TrackingMap.useEffect"];
            }
        }
    }["TrackingMap.useEffect"], [
        status
    ]);
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: '100%',
            width: '100%',
            position: 'relative'
        },
        className: "jsx-47f6c0641e61b22b",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$MapContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MapContainer"], {
                id: "hopla-map-container",
                center: clientPos,
                zoom: 14,
                scrollWheelZoom: false,
                style: {
                    height: '100%',
                    width: '100%',
                    background: '#f5f5f7'
                },
                zoomControl: false,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$TileLayer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TileLayer"], {
                        attribution: '© <a href="https://carto.com/">CARTO</a>',
                        url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
                        className: "map-tiles"
                    }, void 0, false, {
                        fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                        lineNumber: 110,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(ChangeView, {
                        center: status === 'open' ? clientPos : driverPos
                    }, void 0, false, {
                        fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Marker$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Marker"], {
                        position: clientPos,
                        icon: DestinationIcon,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Popup$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Popup"], {
                            children: "Votre destination"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                            lineNumber: 120,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                        lineNumber: 119,
                        columnNumber: 9
                    }, this),
                    status !== 'open' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Marker$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Marker"], {
                        position: driverPos,
                        icon: DriverIcon,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$react$2d$leaflet$2f$lib$2f$Popup$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Popup"], {
                            children: "Votre livreur est ici"
                        }, void 0, false, {
                            fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                            lineNumber: 126,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                        lineNumber: 125,
                        columnNumber: 11
                    }, this)
                ]
            }, "stable-hopla-map-v2", true, {
                fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$COURSES$2f$hopla$2f$node_modules$2f$styled$2d$jsx$2f$style$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "47f6c0641e61b22b",
                children: ".map-tiles{filter:saturate(1.1)brightness(1.02)}.leaflet-container{background:#f5f5f7!important}.custom-driver-icon{transition:all 5s linear!important}"
            }, void 0, false, void 0, this)
        ]
    }, void 0, true, {
        fileName: "[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx",
        lineNumber: 100,
        columnNumber: 5
    }, this);
}
_s1(TrackingMap, "AmeV4jCiwVcTOFsJ9SKfbpFs3e0=");
_c1 = TrackingMap;
var _c, _c1;
__turbopack_context__.k.register(_c, "ChangeView");
__turbopack_context__.k.register(_c1, "TrackingMap");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx [app-client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/Desktop/COURSES/hopla/app/components/TrackingMap.tsx [app-client] (ecmascript)"));
}),
]);

//# sourceMappingURL=Desktop_COURSES_hopla_app_components_TrackingMap_tsx_56295e82._.js.map