"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBilibiliVideoEmbedUrl = void 0;
var initBrowser_1 = require("./initBrowser");
function getBilibiliVideoEmbedUrl(specialName, comedianName) {
    return __awaiter(this, void 0, void 0, function () {
        var bilibiliPage, videoUrl, videoInfo, aid, bvid, cid, iframeUrl;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initBrowser_1.browser.newPage()];
                case 1:
                    bilibiliPage = _a.sent();
                    return [4 /*yield*/, bilibiliPage
                            .goto('https://search.bilibili.com/', {
                            timeout: 60 * 1000
                        })
                        // await bilibiliPage.waitForTimeout(getRandom(10) * 1000)
                    ];
                case 2:
                    _a.sent();
                    // await bilibiliPage.waitForTimeout(getRandom(10) * 1000)
                    return [4 /*yield*/, bilibiliPage.waitForSelector('.search-input-el')];
                case 3:
                    // await bilibiliPage.waitForTimeout(getRandom(10) * 1000)
                    _a.sent();
                    return [4 /*yield*/, bilibiliPage.type('.search-input-el', "".concat(specialName, " ").concat(comedianName))];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, bilibiliPage.evaluate(function () {
                            var button = document.querySelector('.search-button');
                            button && button.click();
                        })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, bilibiliPage.waitForSelector('.video-list div a[href]')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, bilibiliPage.evaluate(function () {
                            var element = document.querySelector('.video-list div a[href]');
                            return element === null || element === void 0 ? void 0 : element.href;
                        })];
                case 7:
                    videoUrl = _a.sent();
                    if (!videoUrl) return [3 /*break*/, 11];
                    return [4 /*yield*/, bilibiliPage.goto(videoUrl, {
                            timeout: 60 * 1000
                        })];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, bilibiliPage.waitForSelector('#share-btn-iframe')];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, bilibiliPage.evaluate(function () {
                            var state = window.__INITIAL_STATE__;
                            var cidMap = state.cidMap;
                            var keys = Object.keys(cidMap);
                            var key = keys[0];
                            var videoInfo = cidMap[key];
                            var aid = videoInfo.aid, bvid = videoInfo.bvid;
                            var cid = key;
                            return {
                                cid: cid,
                                aid: aid,
                                bvid: bvid
                            };
                        })];
                case 10:
                    videoInfo = _a.sent();
                    aid = videoInfo.aid, bvid = videoInfo.bvid, cid = videoInfo.cid;
                    iframeUrl = "//player.bilibili.com/player.html?aid=".concat(aid, "&bvid=").concat(bvid, "&cid=").concat(cid, "&high_quality=1&autoplay=false");
                    return [2 /*return*/, iframeUrl];
                case 11: return [2 /*return*/];
            }
        });
    });
}
exports.getBilibiliVideoEmbedUrl = getBilibiliVideoEmbedUrl;
