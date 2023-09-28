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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var utils_1 = require("./utils");
var initBrowser_1 = require("./initBrowser");
var getBilibiliVideoEmbedUrl_1 = require("./getBilibiliVideoEmbedUrl");
var getSpecialDetail_1 = require("./getSpecialDetail");
function getSpecials(props) {
    return __awaiter(this, void 0, void 0, function () {
        var imdbURL, profilePage, comedianName, flag, isThereATag, allSpecials;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    imdbURL = props.imdbURL;
                    return [4 /*yield*/, initBrowser_1.browser.newPage()];
                case 1:
                    profilePage = _a.sent();
                    return [4 /*yield*/, profilePage.goto(imdbURL)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, profilePage.waitForSelector('[data-testid="hero__pageTitle"] span')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, profilePage.evaluate(function () {
                            var _a;
                            return (_a = document.querySelector('[data-testid="hero__pageTitle"] span')) === null || _a === void 0 ? void 0 : _a.innerHTML;
                        })];
                case 4:
                    comedianName = (_a.sent()) || '';
                    flag = true;
                    console.log(comedianName, 'comedianName');
                    _a.label = 5;
                case 5:
                    if (!flag) return [3 /*break*/, 11];
                    return [4 /*yield*/, (0, utils_1.exists)(profilePage, '.ipc-chip--active')];
                case 6:
                    isThereATag = _a.sent();
                    console.log(isThereATag, 'isThereATag');
                    if (!isThereATag) return [3 /*break*/, 9];
                    return [4 /*yield*/, profilePage.click('.ipc-chip--active')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, profilePage.waitForTimeout(1000 * (0, utils_1.getRandom1to5)())];
                case 8:
                    _a.sent();
                    return [3 /*break*/, 10];
                case 9:
                    flag = false;
                    _a.label = 10;
                case 10: return [3 /*break*/, 5];
                case 11: return [4 /*yield*/, profilePage.click('#name-filmography-filter-writer')];
                case 12:
                    _a.sent();
                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var errorExist;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, utils_1.exists)(profilePage, '[data-testid="retry-error"]')];
                                case 1:
                                    errorExist = _a.sent();
                                    if (!errorExist) return [3 /*break*/, 3];
                                    return [4 /*yield*/, profilePage.click('[data-testid="retry"]')];
                                case 2:
                                    _a.sent();
                                    _a.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }, 5000);
                    return [4 /*yield*/, profilePage.waitForSelector('.filmo-section-writer')];
                case 13:
                    _a.sent();
                    return [4 /*yield*/, profilePage.evaluate(function () {
                            var specialElements = document.querySelectorAll('.ipc-metadata-list-summary-item__t');
                            if (specialElements) {
                                var specialElementsArray = Array.from(specialElements);
                                return specialElementsArray.map(function (e) {
                                    return {
                                        href: e === null || e === void 0 ? void 0 : e.href,
                                        name: e === null || e === void 0 ? void 0 : e.innerText
                                    };
                                });
                            }
                        })];
                case 14:
                    allSpecials = _a.sent();
                    return [2 /*return*/, {
                            allSpecials: allSpecials,
                            comedianName: comedianName
                        }];
            }
        });
    });
}
// TODO: get cover image from netflix: https://www.netflix.com/sg/title/81625055
function startCrawlWithProfile(props) {
    return __awaiter(this, void 0, void 0, function () {
        var imdbURL, _a, allSpecials, comedianName, crawelTasks, specialDetails;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    imdbURL = props.imdbURL;
                    return [4 /*yield*/, getSpecials({
                            imdbURL: imdbURL,
                        })];
                case 1:
                    _a = _b.sent(), allSpecials = _a.allSpecials, comedianName = _a.comedianName;
                    console.log(allSpecials, comedianName);
                    if (!allSpecials) return [3 /*break*/, 3];
                    crawelTasks = allSpecials
                        .slice(0, 1)
                        .map(function (s) {
                        return new Promise(function (resolve) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, bilibiliEmbedUrl, specialDetail;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, getOneSpecialInfo({
                                            specialName: s.name,
                                            specialUrl: s.href,
                                            comedianName: comedianName
                                        })];
                                    case 1:
                                        _a = _b.sent(), bilibiliEmbedUrl = _a.bilibiliEmbedUrl, specialDetail = _a.specialDetail;
                                        resolve({
                                            bilibiliEmbedUrl: bilibiliEmbedUrl,
                                            specialDetail: specialDetail
                                        });
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [4 /*yield*/, Promise.all(crawelTasks)];
                case 2:
                    specialDetails = _b.sent();
                    return [2 /*return*/, {
                            name: comedianName,
                            specialDetails: specialDetails,
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function getOneSpecialInfo(_a) {
    var specialName = _a.specialName, specialUrl = _a.specialUrl, comedianName = _a.comedianName;
    return __awaiter(this, void 0, void 0, function () {
        var _b, bilibiliEmbedUrl, specialDetail, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            (0, getBilibiliVideoEmbedUrl_1.getBilibiliVideoEmbedUrl)(specialName, comedianName),
                            (0, getSpecialDetail_1.getSpecialDetail)(specialUrl)
                        ])];
                case 1:
                    _b = _c.sent(), bilibiliEmbedUrl = _b[0], specialDetail = _b[1];
                    return [2 /*return*/, {
                            bilibiliEmbedUrl: bilibiliEmbedUrl,
                            specialDetail: specialDetail
                        }];
                case 2:
                    error_1 = _c.sent();
                    console.log('error getOneSpecialInfo', error_1);
                    return [2 /*return*/, {
                            bilibiliEmbedUrl: '',
                            specialDetail: ''
                        }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function main(imdbURL) {
    if (imdbURL === void 0) { imdbURL = 'https://www.imdb.com/name/nm0152638/?ref_=nmls_hd'; }
    return __awaiter(this, void 0, void 0, function () {
        var infos;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, initBrowser_1.initBrowser)()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, startCrawlWithProfile({
                            imdbURL: imdbURL,
                        })];
                case 2:
                    infos = _a.sent();
                    fs_1.default.writeFile(path_1.default.resolve(__dirname, 'settings.json'), JSON.stringify(infos), function (error) {
                        if (error) {
                            console.log(error);
                        }
                    });
                    return [4 /*yield*/, initBrowser_1.browser.close()];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.default = main;
