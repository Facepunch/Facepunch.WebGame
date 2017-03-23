var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Facepunch;
(function (Facepunch) {
    var Loader = (function () {
        function Loader() {
            this.queue = [];
            this.loaded = {};
            this.active = 0;
            this.completed = 0;
        }
        Loader.prototype.load = function (url) {
            var loaded = this.loaded[url];
            if (loaded != null)
                return loaded;
            loaded = this.onCreateItem(url);
            this.loaded[url] = loaded;
            this.enqueueItem(loaded);
            return loaded;
        };
        Loader.prototype.getQueueCount = function () {
            return this.queue.length;
        };
        Loader.prototype.getActiveCount = function () {
            return this.active;
        };
        Loader.prototype.getCompletedCount = function () {
            return this.completed;
        };
        Loader.prototype.getTotalCount = function () {
            return this.queue.length + this.active + this.completed;
        };
        Loader.prototype.enqueueItem = function (item) {
            this.queue.push(item);
        };
        Loader.prototype.onComparePriority = function (a, b) { return 0; };
        Loader.prototype.onFinishedLoadStep = function (item) { };
        Loader.prototype.getNextToLoad = function () {
            if (this.queue.length <= 0)
                return null;
            var bestIndex = 0;
            var bestItem = this.queue[0];
            for (var i = 1, iEnd = this.queue.length; i < iEnd; ++i) {
                var item = this.queue[i];
                if (this.onComparePriority(bestItem, item) < 0)
                    continue;
                bestIndex = i;
                bestItem = item;
            }
            return this.queue.splice(bestIndex, 1)[0];
        };
        Loader.prototype.update = function (requestQuota) {
            var _this = this;
            var next;
            var _loop_1 = function() {
                ++this_1.active;
                var nextCopy = next;
                next.loadNext(function (requeue) {
                    --_this.active;
                    if (requeue)
                        _this.queue.push(nextCopy);
                    else
                        ++_this.completed;
                    _this.onFinishedLoadStep(nextCopy);
                });
            };
            var this_1 = this;
            while (this.active < requestQuota && (next = this.getNextToLoad()) != null) {
                _loop_1();
            }
            return this.active;
        };
        return Loader;
    }());
    Facepunch.Loader = Loader;
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    // Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
    // This work is free. You can redistribute it and/or modify it
    // under the terms of the WTFPL, Version 2
    // For more information see LICENSE.txt or http://www.wtfpl.net/
    //
    // For more information, the home page:
    // http://pieroxy.net/blog/pages/lz-string/testing.html
    //
    // LZ-based compression algorithm, version 1.4.4
    var _LZString = (function () {
        // private property
        var f = String.fromCharCode;
        var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
        var baseReverseDic = {};
        function getBaseValue(alphabet, character) {
            if (!baseReverseDic[alphabet]) {
                baseReverseDic[alphabet] = {};
                for (var i = 0; i < alphabet.length; i++) {
                    baseReverseDic[alphabet][alphabet.charAt(i)] = i;
                }
            }
            return baseReverseDic[alphabet][character];
        }
        var _LZString = {
            compressToBase64: function (input) {
                if (input == null)
                    return "";
                var res = _LZString._compress(input, 6, function (a) { return keyStrBase64.charAt(a); });
                switch (res.length % 4) {
                    default: // When could this happen ?
                    case 0: return res;
                    case 1: return res + "===";
                    case 2: return res + "==";
                    case 3: return res + "=";
                }
            },
            decompressFromBase64: function (input) {
                if (input == null)
                    return "";
                if (input == "")
                    return null;
                return _LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
            },
            compressToUTF16: function (input) {
                if (input == null)
                    return "";
                return _LZString._compress(input, 15, function (a) { return f(a + 32); }) + " ";
            },
            decompressFromUTF16: function (compressed) {
                if (compressed == null)
                    return "";
                if (compressed == "")
                    return null;
                return _LZString._decompress(compressed.length, 16384, function (index) { return compressed.charCodeAt(index) - 32; });
            },
            //compress into uint8array (UCS-2 big endian format)
            compressToUint8Array: function (uncompressed) {
                var compressed = _LZString.compress(uncompressed);
                var buf = new Uint8Array(compressed.length * 2); // 2 bytes per character
                for (var i = 0, TotalLen = compressed.length; i < TotalLen; i++) {
                    var current_value = compressed.charCodeAt(i);
                    buf[i * 2] = current_value >>> 8;
                    buf[i * 2 + 1] = current_value % 256;
                }
                return buf;
            },
            //decompress from uint8array (UCS-2 big endian format)
            decompressFromUint8Array: function (compressed) {
                if (compressed === null || compressed === undefined) {
                    return _LZString.decompress(compressed);
                }
                else {
                    var buf = new Array(compressed.length / 2); // 2 bytes per character
                    for (var i = 0, TotalLen = buf.length; i < TotalLen; i++) {
                        buf[i] = compressed[i * 2] * 256 + compressed[i * 2 + 1];
                    }
                    var result = [];
                    buf.forEach(function (c) {
                        result.push(f(c));
                    });
                    return _LZString.decompress(result.join(''));
                }
            },
            //compress into a string that is already URI encoded
            compressToEncodedURIComponent: function (input) {
                if (input == null)
                    return "";
                return _LZString._compress(input, 6, function (a) { return keyStrUriSafe.charAt(a); });
            },
            //decompress from an output of compressToEncodedURIComponent
            decompressFromEncodedURIComponent: function (input) {
                if (input == null)
                    return "";
                if (input == "")
                    return null;
                input = input.replace(/ /g, "+");
                return _LZString._decompress(input.length, 32, function (index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
            },
            compress: function (uncompressed) {
                return _LZString._compress(uncompressed, 16, function (a) { return f(a); });
            },
            _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
                if (uncompressed == null)
                    return "";
                var i, value, context_dictionary = {}, context_dictionaryToCreate = {}, context_c = "", context_wc = "", context_w = "", context_enlargeIn = 2, // Compensate for the first entry which should not count
                context_dictSize = 3, context_numBits = 2, context_data = [], context_data_val = 0, context_data_position = 0, ii;
                for (ii = 0; ii < uncompressed.length; ii += 1) {
                    context_c = uncompressed.charAt(ii);
                    if (!Object.prototype.hasOwnProperty.call(context_dictionary, context_c)) {
                        context_dictionary[context_c] = context_dictSize++;
                        context_dictionaryToCreate[context_c] = true;
                    }
                    context_wc = context_w + context_c;
                    if (Object.prototype.hasOwnProperty.call(context_dictionary, context_wc)) {
                        context_w = context_wc;
                    }
                    else {
                        if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                            if (context_w.charCodeAt(0) < 256) {
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                }
                                value = context_w.charCodeAt(0);
                                for (i = 0; i < 8; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            }
                            else {
                                value = 1;
                                for (i = 0; i < context_numBits; i++) {
                                    context_data_val = (context_data_val << 1) | value;
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                    value = 0;
                                }
                                value = context_w.charCodeAt(0);
                                for (i = 0; i < 16; i++) {
                                    context_data_val = (context_data_val << 1) | (value & 1);
                                    if (context_data_position == bitsPerChar - 1) {
                                        context_data_position = 0;
                                        context_data.push(getCharFromInt(context_data_val));
                                        context_data_val = 0;
                                    }
                                    else {
                                        context_data_position++;
                                    }
                                    value = value >> 1;
                                }
                            }
                            context_enlargeIn--;
                            if (context_enlargeIn == 0) {
                                context_enlargeIn = Math.pow(2, context_numBits);
                                context_numBits++;
                            }
                            delete context_dictionaryToCreate[context_w];
                        }
                        else {
                            value = context_dictionary[context_w];
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        // Add wc to the dictionary.
                        context_dictionary[context_wc] = context_dictSize++;
                        context_w = String(context_c);
                    }
                }
                // Output the code for w.
                if (context_w !== "") {
                    if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate, context_w)) {
                        if (context_w.charCodeAt(0) < 256) {
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 8; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        else {
                            value = 1;
                            for (i = 0; i < context_numBits; i++) {
                                context_data_val = (context_data_val << 1) | value;
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = 0;
                            }
                            value = context_w.charCodeAt(0);
                            for (i = 0; i < 16; i++) {
                                context_data_val = (context_data_val << 1) | (value & 1);
                                if (context_data_position == bitsPerChar - 1) {
                                    context_data_position = 0;
                                    context_data.push(getCharFromInt(context_data_val));
                                    context_data_val = 0;
                                }
                                else {
                                    context_data_position++;
                                }
                                value = value >> 1;
                            }
                        }
                        context_enlargeIn--;
                        if (context_enlargeIn == 0) {
                            context_enlargeIn = Math.pow(2, context_numBits);
                            context_numBits++;
                        }
                        delete context_dictionaryToCreate[context_w];
                    }
                    else {
                        value = context_dictionary[context_w];
                        for (i = 0; i < context_numBits; i++) {
                            context_data_val = (context_data_val << 1) | (value & 1);
                            if (context_data_position == bitsPerChar - 1) {
                                context_data_position = 0;
                                context_data.push(getCharFromInt(context_data_val));
                                context_data_val = 0;
                            }
                            else {
                                context_data_position++;
                            }
                            value = value >> 1;
                        }
                    }
                    context_enlargeIn--;
                    if (context_enlargeIn == 0) {
                        context_enlargeIn = Math.pow(2, context_numBits);
                        context_numBits++;
                    }
                }
                // Mark the end of the stream
                value = 2;
                for (i = 0; i < context_numBits; i++) {
                    context_data_val = (context_data_val << 1) | (value & 1);
                    if (context_data_position == bitsPerChar - 1) {
                        context_data_position = 0;
                        context_data.push(getCharFromInt(context_data_val));
                        context_data_val = 0;
                    }
                    else {
                        context_data_position++;
                    }
                    value = value >> 1;
                }
                // Flush the last char
                while (true) {
                    context_data_val = (context_data_val << 1);
                    if (context_data_position == bitsPerChar - 1) {
                        context_data.push(getCharFromInt(context_data_val));
                        break;
                    }
                    else
                        context_data_position++;
                }
                return context_data.join('');
            },
            decompress: function (compressed) {
                if (compressed == null)
                    return "";
                if (compressed == "")
                    return null;
                return _LZString._decompress(compressed.length, 32768, function (index) { return compressed.charCodeAt(index); });
            },
            _decompress: function (length, resetValue, getNextValue) {
                var dictionary = [], next, enlargeIn = 4, dictSize = 4, numBits = 3, entry = "", result = [], i, w, bits, resb, maxpower, power, c, data = { val: getNextValue(0), position: resetValue, index: 1 };
                for (i = 0; i < 3; i += 1) {
                    dictionary[i] = i;
                }
                bits = 0;
                maxpower = Math.pow(2, 2);
                power = 1;
                while (power != maxpower) {
                    resb = data.val & data.position;
                    data.position >>= 1;
                    if (data.position == 0) {
                        data.position = resetValue;
                        data.val = getNextValue(data.index++);
                    }
                    bits |= (resb > 0 ? 1 : 0) * power;
                    power <<= 1;
                }
                switch (next = bits) {
                    case 0:
                        bits = 0;
                        maxpower = Math.pow(2, 8);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        c = f(bits);
                        break;
                    case 1:
                        bits = 0;
                        maxpower = Math.pow(2, 16);
                        power = 1;
                        while (power != maxpower) {
                            resb = data.val & data.position;
                            data.position >>= 1;
                            if (data.position == 0) {
                                data.position = resetValue;
                                data.val = getNextValue(data.index++);
                            }
                            bits |= (resb > 0 ? 1 : 0) * power;
                            power <<= 1;
                        }
                        c = f(bits);
                        break;
                    case 2:
                        return "";
                }
                dictionary[3] = c;
                w = c;
                result.push(c);
                while (true) {
                    if (data.index > length) {
                        return "";
                    }
                    bits = 0;
                    maxpower = Math.pow(2, numBits);
                    power = 1;
                    while (power != maxpower) {
                        resb = data.val & data.position;
                        data.position >>= 1;
                        if (data.position == 0) {
                            data.position = resetValue;
                            data.val = getNextValue(data.index++);
                        }
                        bits |= (resb > 0 ? 1 : 0) * power;
                        power <<= 1;
                    }
                    switch (c = bits) {
                        case 0:
                            bits = 0;
                            maxpower = Math.pow(2, 8);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                            dictionary[dictSize++] = f(bits);
                            c = dictSize - 1;
                            enlargeIn--;
                            break;
                        case 1:
                            bits = 0;
                            maxpower = Math.pow(2, 16);
                            power = 1;
                            while (power != maxpower) {
                                resb = data.val & data.position;
                                data.position >>= 1;
                                if (data.position == 0) {
                                    data.position = resetValue;
                                    data.val = getNextValue(data.index++);
                                }
                                bits |= (resb > 0 ? 1 : 0) * power;
                                power <<= 1;
                            }
                            dictionary[dictSize++] = f(bits);
                            c = dictSize - 1;
                            enlargeIn--;
                            break;
                        case 2:
                            return result.join('');
                    }
                    if (enlargeIn == 0) {
                        enlargeIn = Math.pow(2, numBits);
                        numBits++;
                    }
                    if (dictionary[c]) {
                        entry = dictionary[c];
                    }
                    else {
                        if (c === dictSize) {
                            entry = w + w.charAt(0);
                        }
                        else {
                            return null;
                        }
                    }
                    result.push(entry);
                    // Add w+entry[0] to the dictionary.
                    dictionary[dictSize++] = w + entry.charAt(0);
                    enlargeIn--;
                    w = entry;
                    if (enlargeIn == 0) {
                        enlargeIn = Math.pow(2, numBits);
                        numBits++;
                    }
                }
            }
        };
        return _LZString;
    })();
    var LZString = (function () {
        function LZString() {
        }
        LZString.compressToBase64 = _LZString.compressToBase64;
        LZString.decompressFromBase64 = _LZString.decompressFromBase64;
        LZString.compressToUTF16 = _LZString.compressToUTF16;
        LZString.decompressFromUTF16 = _LZString.decompressFromUTF16;
        LZString.compressToUint8Array = _LZString.compressToUint8Array;
        LZString.decompressFromUint8Array = _LZString.decompressFromUint8Array;
        LZString.compressToEncodedURIComponent = _LZString.compressToEncodedURIComponent;
        LZString.decompressFromEncodedURIComponent = _LZString.decompressFromEncodedURIComponent;
        LZString.compress = _LZString.compress;
        LZString.decompress = _LZString.decompress;
        return LZString;
    }());
    Facepunch.LZString = LZString;
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var Vector2 = (function () {
        function Vector2(x, y) {
            this.x = x || 0;
            this.y = y || 0;
        }
        Vector2.prototype.set = function (x, y) {
            this.x = x;
            this.y = y;
            return this;
        };
        Vector2.prototype.sub = function (vec) {
            this.x -= vec.x;
            this.y -= vec.y;
            return this;
        };
        Vector2.prototype.multiplyScalar = function (val) {
            this.x *= val;
            this.y *= val;
            return this;
        };
        Vector2.prototype.copy = function (vec) {
            this.x = vec.x;
            this.y = vec.y;
            return this;
        };
        return Vector2;
    }());
    Facepunch.Vector2 = Vector2;
    var Vector3 = (function () {
        function Vector3(x, y, z) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
        Vector3.prototype.length = function () {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        };
        Vector3.prototype.lengthSq = function () {
            var x = this.x, y = this.y, z = this.z;
            return x * x + y * y + z * z;
        };
        Vector3.prototype.normalize = function () {
            var length = this.length();
            this.x /= length;
            this.y /= length;
            this.z /= length;
            return this;
        };
        Vector3.prototype.set = function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
            return this;
        };
        Vector3.prototype.add = function (vec) {
            this.x += vec.x;
            this.y += vec.y;
            this.z += vec.z;
            return this;
        };
        Vector3.prototype.multiply = function (vec) {
            this.x *= vec.x;
            this.y *= vec.y;
            this.z *= vec.z;
            return this;
        };
        Vector3.prototype.multiplyScalar = function (val) {
            this.x *= val;
            this.y *= val;
            this.z *= val;
            return this;
        };
        Vector3.prototype.dot = function (vec) {
            return this.x * vec.x + this.y * vec.y + this.z * vec.z;
        };
        Vector3.prototype.copy = function (vec) {
            this.x = vec.x;
            this.y = vec.y;
            this.z = vec.z;
            return this;
        };
        Vector3.prototype.applyQuaternion = function (quat) {
            // From https://github.com/mrdoob/three.js
            var x = this.x, y = this.y, z = this.z;
            var qx = quat.x, qy = quat.y, qz = quat.z, qw = quat.w;
            // calculate quat * vector
            var ix = qw * x + qy * z - qz * y;
            var iy = qw * y + qz * x - qx * z;
            var iz = qw * z + qx * y - qy * x;
            var iw = -qx * x - qy * y - qz * z;
            // calculate result * inverse quat
            this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return this;
        };
        Vector3.prototype.setNormal = function (vec) {
            var x = vec.x, y = vec.y, z = vec.z;
            var invLen = 1 / Math.sqrt(x * x + y * y + z * z);
            this.x = x * invLen;
            this.y = y * invLen;
            this.z = z * invLen;
            return this;
        };
        Vector3.zero = new Vector3(0, 0, 0);
        Vector3.one = new Vector3(1, 1, 1);
        Vector3.unitX = new Vector3(1, 0, 0);
        Vector3.unitY = new Vector3(0, 1, 0);
        Vector3.unitZ = new Vector3(0, 0, 1);
        return Vector3;
    }());
    Facepunch.Vector3 = Vector3;
    var Vector4 = (function () {
        function Vector4(x, y, z, w) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 0;
        }
        Vector4.prototype.length = function () {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return Math.sqrt(x * x + y * y + z * z + w * w);
        };
        Vector4.prototype.lengthSq = function () {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            return x * x + y * y + z * z + w * w;
        };
        Vector4.prototype.lengthXyz = function () {
            var x = this.x, y = this.y, z = this.z;
            return Math.sqrt(x * x + y * y + z * z);
        };
        Vector4.prototype.lengthSqXyz = function () {
            var x = this.x, y = this.y, z = this.z;
            return x * x + y * y + z * z;
        };
        Vector4.prototype.normalize = function () {
            var length = this.length();
            this.x /= length;
            this.y /= length;
            this.z /= length;
            this.w /= length;
            return this;
        };
        Vector4.prototype.normalizeXyz = function () {
            var length = this.lengthXyz();
            this.x /= length;
            this.y /= length;
            this.z /= length;
            return this;
        };
        Vector4.prototype.set = function (x, y, z, w) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = w;
            return this;
        };
        Vector4.prototype.applyMatrix4 = function (mat) {
            var x = this.x, y = this.y, z = this.z, w = this.w;
            var m = mat.elements;
            this.x = m[0x0] * x + m[0x4] * y + m[0x8] * z + m[0xc] * w;
            this.y = m[0x1] * x + m[0x5] * y + m[0x9] * z + m[0xd] * w;
            this.z = m[0x2] * x + m[0x6] * y + m[0xa] * z + m[0xe] * w;
            this.w = m[0x3] * x + m[0x7] * y + m[0xb] * z + m[0xf] * w;
            return this;
        };
        return Vector4;
    }());
    Facepunch.Vector4 = Vector4;
    var Quaternion = (function () {
        function Quaternion(x, y, z, w) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.w = w || 0;
        }
        Quaternion.prototype.copy = function (quat) {
            this.x = quat.x;
            this.y = quat.y;
            this.z = quat.z;
            this.w = quat.w;
            return this;
        };
        Quaternion.prototype.setIdentity = function () {
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.w = 1;
            return this;
        };
        Quaternion.prototype.setAxisAngle = function (axis, angle) {
            // From https://github.com/mrdoob/three.js
            var halfAngle = angle * 0.5, s = Math.sin(halfAngle);
            this.x = axis.x * s;
            this.y = axis.y * s;
            this.z = axis.z * s;
            this.w = Math.cos(halfAngle);
            return this;
        };
        Quaternion.prototype.multiply = function (quat) {
            // From https://github.com/mrdoob/three.js
            var qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
            var qbx = quat.x, qby = quat.y, qbz = quat.z, qbw = quat.w;
            this.x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
            this.y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
            this.z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
            this.w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;
            return this;
        };
        Quaternion.prototype.setEuler = function (euler) {
            // From https://github.com/mrdoob/three.js
            var x = euler.x;
            var y = euler.y;
            var z = euler.z;
            var order = euler.order;
            var cos = Math.cos;
            var sin = Math.sin;
            var c1 = cos(x * 0.5);
            var c2 = cos(y * 0.5);
            var c3 = cos(z * 0.5);
            var s1 = sin(x * 0.5);
            var s2 = sin(y * 0.5);
            var s3 = sin(z * 0.5);
            this.x = s1 * c2 * c3 + c1 * s2 * s3 * ((order & 1) !== 0 ? 1 : -1);
            this.y = c1 * s2 * c3 + s1 * c2 * s3 * ((order & 2) !== 0 ? 1 : -1);
            this.z = c1 * c2 * s3 + s1 * s2 * c3 * ((order & 4) !== 0 ? 1 : -1);
            this.w = c1 * c2 * c3 + s1 * s2 * s3 * ((order & 8) !== 0 ? 1 : -1);
            return this;
        };
        return Quaternion;
    }());
    Facepunch.Quaternion = Quaternion;
    (function (AxisOrder) {
        AxisOrder[AxisOrder["Xyz"] = 5] = "Xyz";
        AxisOrder[AxisOrder["Xzy"] = 12] = "Xzy";
        AxisOrder[AxisOrder["Yxz"] = 9] = "Yxz";
        AxisOrder[AxisOrder["Yzx"] = 3] = "Yzx";
        AxisOrder[AxisOrder["Zxy"] = 6] = "Zxy";
        AxisOrder[AxisOrder["Zyx"] = 10] = "Zyx"; // 0101
    })(Facepunch.AxisOrder || (Facepunch.AxisOrder = {}));
    var AxisOrder = Facepunch.AxisOrder;
    var Euler = (function () {
        function Euler(x, y, z, order) {
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
            this.order = order || AxisOrder.Xyz;
        }
        return Euler;
    }());
    Facepunch.Euler = Euler;
    var Plane = (function () {
        function Plane(normal, distance) {
            this.normal = new Vector3();
            this.normal.setNormal(normal);
            this.distance = distance;
        }
        return Plane;
    }());
    Facepunch.Plane = Plane;
    var Box3 = (function () {
        function Box3(min, max) {
            this.min = new Vector3();
            this.max = new Vector3();
            if (min !== undefined)
                this.min.copy(min);
            if (max !== undefined)
                this.max.copy(max);
        }
        Box3.prototype.copy = function (box) {
            this.min.copy(box.min);
            this.max.copy(box.max);
            return this;
        };
        Box3.prototype.distanceToPoint = function (vec) {
            var minX = Math.max(0, this.min.x - vec.x, vec.x - this.max.x);
            var minY = Math.max(0, this.min.y - vec.y, vec.y - this.max.y);
            var minZ = Math.max(0, this.min.z - vec.z, vec.z - this.max.z);
            return Math.sqrt(minX * minX + minY * minY + minZ * minZ);
        };
        return Box3;
    }());
    Facepunch.Box3 = Box3;
    var Matrix4 = (function () {
        function Matrix4() {
            this.id = Matrix4.nextId++;
            this.elements = new Float32Array(4 * 4);
        }
        Matrix4.prototype.setIdentity = function () {
            var m = this.elements;
            m[0x0] = 1;
            m[0x1] = 0;
            m[0x2] = 0;
            m[0x3] = 0;
            m[0x4] = 0;
            m[0x5] = 1;
            m[0x6] = 0;
            m[0x7] = 0;
            m[0x8] = 0;
            m[0x9] = 0;
            m[0xa] = 1;
            m[0xb] = 0;
            m[0xc] = 0;
            m[0xd] = 0;
            m[0xe] = 0;
            m[0xf] = 1;
            return this;
        };
        Matrix4.prototype.compareTo = function (other) {
            var m = this.elements;
            var n = other.elements;
            for (var i = 0xf; i >= 0; --i) {
                if (m[i] !== n[i])
                    return m[i] - n[i];
            }
            return 0;
        };
        Matrix4.prototype.copy = function (mat) {
            var m = this.elements;
            var n = mat.elements;
            for (var i = 0; i < 16; ++i)
                m[i] = n[i];
            return this;
        };
        Matrix4.prototype.setRotation = function (rotation) {
            var m = this.elements;
            // From https://github.com/mrdoob/three.js
            var x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w;
            var x2 = x + x, y2 = y + y, z2 = z + z;
            var xx = x * x2, xy = x * y2, xz = x * z2;
            var yy = y * y2, yz = y * z2, zz = z * z2;
            var wx = w * x2, wy = w * y2, wz = w * z2;
            m[0] = 1 - (yy + zz);
            m[4] = xy - wz;
            m[8] = xz + wy;
            m[1] = xy + wz;
            m[5] = 1 - (xx + zz);
            m[9] = yz - wx;
            m[2] = xz - wy;
            m[6] = yz + wx;
            m[10] = 1 - (xx + yy);
            m[3] = 0;
            m[7] = 0;
            m[11] = 0;
            m[12] = 0;
            m[13] = 0;
            m[14] = 0;
            m[15] = 1;
            return this;
        };
        Matrix4.prototype.scale = function (vec) {
            var m = this.elements;
            var x = vec.x, y = vec.y, z = vec.z;
            m[0x0] *= x;
            m[0x1] *= x;
            m[0x2] *= x;
            m[0x3] *= x;
            m[0x4] *= y;
            m[0x5] *= y;
            m[0x6] *= y;
            m[0x7] *= y;
            m[0x8] *= z;
            m[0x9] *= z;
            m[0xa] *= z;
            m[0xb] *= z;
            return this;
        };
        Matrix4.prototype.translate = function (vec) {
            var m = this.elements;
            m[0xc] += vec.x;
            m[0xd] += vec.y;
            m[0xe] += vec.z;
            return this;
        };
        Matrix4.prototype.setPerspective = function (fov, aspect, near, far) {
            var top = near * Math.tan(0.5 * fov), height = 2 * top, width = aspect * height, left = -0.5 * width, right = left + width, bottom = -top;
            // From https://github.com/mrdoob/three.js
            var m = this.elements;
            var x = 2 * near / width;
            var y = 2 * near / height;
            var a = (right + left) / (right - left);
            var b = (top + bottom) / (top - bottom);
            var c = -(far + near) / (far - near);
            var d = -2 * far * near / (far - near);
            m[0x0] = x;
            m[0x4] = 0;
            m[0x8] = a;
            m[0xc] = 0;
            m[0x1] = 0;
            m[0x5] = y;
            m[0x9] = b;
            m[0xd] = 0;
            m[0x2] = 0;
            m[0x6] = 0;
            m[0xa] = c;
            m[0xe] = d;
            m[0x3] = 0;
            m[0x7] = 0;
            m[0xb] = -1;
            m[0xf] = 0;
            return this;
        };
        Matrix4.prototype.setInverse = function (from) {
            var m = from.elements;
            var inv = this.elements;
            // From http://stackoverflow.com/a/1148405
            inv[0] = m[5] * m[10] * m[15] -
                m[5] * m[11] * m[14] -
                m[9] * m[6] * m[15] +
                m[9] * m[7] * m[14] +
                m[13] * m[6] * m[11] -
                m[13] * m[7] * m[10];
            inv[4] = -m[4] * m[10] * m[15] +
                m[4] * m[11] * m[14] +
                m[8] * m[6] * m[15] -
                m[8] * m[7] * m[14] -
                m[12] * m[6] * m[11] +
                m[12] * m[7] * m[10];
            inv[8] = m[4] * m[9] * m[15] -
                m[4] * m[11] * m[13] -
                m[8] * m[5] * m[15] +
                m[8] * m[7] * m[13] +
                m[12] * m[5] * m[11] -
                m[12] * m[7] * m[9];
            inv[12] = -m[4] * m[9] * m[14] +
                m[4] * m[10] * m[13] +
                m[8] * m[5] * m[14] -
                m[8] * m[6] * m[13] -
                m[12] * m[5] * m[10] +
                m[12] * m[6] * m[9];
            inv[1] = -m[1] * m[10] * m[15] +
                m[1] * m[11] * m[14] +
                m[9] * m[2] * m[15] -
                m[9] * m[3] * m[14] -
                m[13] * m[2] * m[11] +
                m[13] * m[3] * m[10];
            inv[5] = m[0] * m[10] * m[15] -
                m[0] * m[11] * m[14] -
                m[8] * m[2] * m[15] +
                m[8] * m[3] * m[14] +
                m[12] * m[2] * m[11] -
                m[12] * m[3] * m[10];
            inv[9] = -m[0] * m[9] * m[15] +
                m[0] * m[11] * m[13] +
                m[8] * m[1] * m[15] -
                m[8] * m[3] * m[13] -
                m[12] * m[1] * m[11] +
                m[12] * m[3] * m[9];
            inv[13] = m[0] * m[9] * m[14] -
                m[0] * m[10] * m[13] -
                m[8] * m[1] * m[14] +
                m[8] * m[2] * m[13] +
                m[12] * m[1] * m[10] -
                m[12] * m[2] * m[9];
            inv[2] = m[1] * m[6] * m[15] -
                m[1] * m[7] * m[14] -
                m[5] * m[2] * m[15] +
                m[5] * m[3] * m[14] +
                m[13] * m[2] * m[7] -
                m[13] * m[3] * m[6];
            inv[6] = -m[0] * m[6] * m[15] +
                m[0] * m[7] * m[14] +
                m[4] * m[2] * m[15] -
                m[4] * m[3] * m[14] -
                m[12] * m[2] * m[7] +
                m[12] * m[3] * m[6];
            inv[10] = m[0] * m[5] * m[15] -
                m[0] * m[7] * m[13] -
                m[4] * m[1] * m[15] +
                m[4] * m[3] * m[13] +
                m[12] * m[1] * m[7] -
                m[12] * m[3] * m[5];
            inv[14] = -m[0] * m[5] * m[14] +
                m[0] * m[6] * m[13] +
                m[4] * m[1] * m[14] -
                m[4] * m[2] * m[13] -
                m[12] * m[1] * m[6] +
                m[12] * m[2] * m[5];
            inv[3] = -m[1] * m[6] * m[11] +
                m[1] * m[7] * m[10] +
                m[5] * m[2] * m[11] -
                m[5] * m[3] * m[10] -
                m[9] * m[2] * m[7] +
                m[9] * m[3] * m[6];
            inv[7] = m[0] * m[6] * m[11] -
                m[0] * m[7] * m[10] -
                m[4] * m[2] * m[11] +
                m[4] * m[3] * m[10] +
                m[8] * m[2] * m[7] -
                m[8] * m[3] * m[6];
            inv[11] = -m[0] * m[5] * m[11] +
                m[0] * m[7] * m[9] +
                m[4] * m[1] * m[11] -
                m[4] * m[3] * m[9] -
                m[8] * m[1] * m[7] +
                m[8] * m[3] * m[5];
            inv[15] = m[0] * m[5] * m[10] -
                m[0] * m[6] * m[9] -
                m[4] * m[1] * m[10] +
                m[4] * m[2] * m[9] +
                m[8] * m[1] * m[6] -
                m[8] * m[2] * m[5];
            var det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
            if (det === 0)
                throw new Error("Matrix is not invertible.");
            det = 1.0 / det;
            for (var i = 0; i < 16; ++i)
                inv[i] *= det;
            return this;
        };
        Matrix4.nextId = 1;
        return Matrix4;
    }());
    Facepunch.Matrix4 = Matrix4;
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var Http = (function () {
        function Http() {
        }
        Http.getString = function (url, success, failure) {
            var request = new XMLHttpRequest();
            request.addEventListener("load", function (ev) { return success(request.responseText); });
            if (failure != null) {
                request.addEventListener("error", function (ev) { return failure(ev.error); });
                request.addEventListener("abort", function (ev) { return failure(Http.cancelled); });
            }
            request.open("get", url, true);
            request.send();
        };
        Http.getJson = function (url, success, failure) {
            Http.getString(url, function (text) { return success(JSON.parse(text)); }, failure);
        };
        Http.getImage = function (url, success, failure) {
            var image = new Image();
            image.src = url;
            image.addEventListener("load", function (ev) { return success(image); });
            if (failure != null) {
                image.addEventListener("error", function (ev) { return failure(ev.error); });
                image.addEventListener("abort", function (ev) { return failure(Http.cancelled); });
            }
        };
        Http.isAbsUrl = function (url) {
            return /^(http[s]:\/)?\//i.test(url);
        };
        Http.getAbsUrl = function (url, relativeTo) {
            if (Http.isAbsUrl(url))
                return url;
            if (!Http.isAbsUrl(relativeTo)) {
                relativeTo = window.location.pathname;
            }
            if (relativeTo.charAt(relativeTo.length - 1) === "/") {
                return "" + relativeTo + url;
            }
            var lastSep = relativeTo.lastIndexOf("/");
            var prefix = relativeTo.substr(0, lastSep + 1);
            return "" + prefix + url;
        };
        Http.cancelled = { toString: function () { return "Request cancelled by user."; } };
        return Http;
    }());
    Facepunch.Http = Http;
    var Utils = (function () {
        function Utils() {
        }
        Utils.decompress = function (value) {
            if (value == null)
                return null;
            return typeof value === "string"
                ? JSON.parse(Facepunch.LZString.decompressFromBase64(value))
                : value;
        };
        Utils.decompressOrClone = function (value) {
            if (value == null)
                return null;
            return typeof value === "string"
                ? JSON.parse(Facepunch.LZString.decompressFromBase64(value))
                : value.slice(0);
        };
        return Utils;
    }());
    Facepunch.Utils = Utils;
    var WebGl = (function () {
        function WebGl() {
        }
        WebGl.decodeConst = function (valueOrIdent, defaultValue) {
            if (valueOrIdent === undefined)
                return defaultValue;
            return (typeof valueOrIdent === "number" ? valueOrIdent : WebGLRenderingContext[valueOrIdent]);
        };
        WebGl.encodeConst = function (value) {
            if (WebGl.constDict == null) {
                WebGl.constDict = {};
                for (var name_1 in WebGLRenderingContext) {
                    var val = WebGLRenderingContext[name_1];
                    if (typeof val !== "number")
                        continue;
                    WebGl.constDict[val] = name_1;
                }
            }
            return WebGl.constDict[value];
        };
        return WebGl;
    }());
    Facepunch.WebGl = WebGl;
})(Facepunch || (Facepunch = {}));
/// <reference path="../Math.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Entity = (function () {
            function Entity() {
                this.id = Entity.nextId++;
                this.position = new Facepunch.Vector3();
                this.rotation = new Facepunch.Quaternion().setIdentity();
                this.scale = new Facepunch.Vector3(1, 1, 1);
                this.matrix = new Facepunch.Matrix4();
                this.matrixInvalid = true;
                this.inverseMatrix = new Facepunch.Matrix4();
                this.inverseMatrixInvalid = true;
            }
            Entity.prototype.compareTo = function (other) {
                if (other == null)
                    return 1;
                return this.id - other.id;
            };
            Entity.prototype.invalidateMatrices = function () {
                this.matrixInvalid = true;
                this.inverseMatrixInvalid = true;
            };
            Entity.prototype.getMatrix = function (target) {
                if (this.matrixInvalid) {
                    this.matrixInvalid = false;
                    this.matrix.setRotation(this.rotation);
                    this.matrix.scale(this.scale);
                    this.matrix.translate(this.position);
                }
                if (target != null) {
                    return target.copy(this.matrix);
                }
                return this.matrix;
            };
            Entity.prototype.getInverseMatrix = function (target) {
                if (this.inverseMatrixInvalid) {
                    this.inverseMatrixInvalid = false;
                    this.getMatrix();
                    this.inverseMatrix.setInverse(this.matrix);
                }
                if (target != null) {
                    return target.copy(this.inverseMatrix);
                }
                return this.inverseMatrix;
            };
            Entity.prototype.setPosition = function (valueOrX, y, z) {
                if (y !== undefined) {
                    var x = valueOrX;
                    this.position.set(x, y, z);
                }
                else {
                    var value = valueOrX;
                    this.position.set(value.x, value.y, value.z);
                }
                this.invalidateMatrices();
            };
            Entity.prototype.getPosition = function (target) {
                target.x = this.position.x;
                target.y = this.position.y;
                target.z = this.position.z;
                return target;
            };
            Entity.prototype.getPositionValues = function (target) {
                target[0] = this.position.x;
                target[1] = this.position.y;
                target[2] = this.position.z;
                return target;
            };
            Entity.prototype.getDistanceToBounds = function (bounds) {
                return bounds.distanceToPoint(this.position);
            };
            Entity.prototype.translate = function (valueOrX, y, z) {
                if (typeof valueOrX === "number") {
                    this.position.x += valueOrX;
                    this.position.y += y;
                    this.position.z += z;
                }
                else {
                    this.position.add(valueOrX);
                }
                this.invalidateMatrices();
            };
            Entity.prototype.setRotation = function (value) {
                this.rotation.copy(value);
                this.invalidateMatrices();
            };
            Entity.prototype.setAngles = function (valueOrPitch, yaw, roll) {
                var pitch;
                if (typeof valueOrPitch === "number") {
                    pitch = valueOrPitch;
                }
                else {
                    pitch = valueOrPitch.x;
                    yaw = valueOrPitch.y;
                    roll = valueOrPitch.z;
                }
                Entity.tempEuler.x = roll;
                Entity.tempEuler.y = pitch;
                Entity.tempEuler.z = yaw;
                this.rotation.setEuler(Entity.tempEuler);
            };
            Entity.prototype.copyRotation = function (other) {
                this.setRotation(other.rotation);
            };
            Entity.prototype.applyRotationTo = function (vector) {
                vector.applyQuaternion(this.rotation);
            };
            Entity.prototype.setScale = function (value) {
                if (typeof value === "number") {
                    this.scale.set(value, value, value);
                }
                else {
                    this.scale.set(value.x, value.y, value.z);
                }
                this.invalidateMatrices();
            };
            Entity.nextId = 0;
            Entity.tempEuler = new Facepunch.Euler(0, 0, 0, Facepunch.AxisOrder.Zyx);
            return Entity;
        }());
        WebGame.Entity = Entity;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        (function (UniformType) {
            UniformType[UniformType["Float"] = 0] = "Float";
            UniformType[UniformType["Float2"] = 1] = "Float2";
            UniformType[UniformType["Float3"] = 2] = "Float3";
            UniformType[UniformType["Float4"] = 3] = "Float4";
            UniformType[UniformType["Matrix4"] = 4] = "Matrix4";
            UniformType[UniformType["Texture"] = 5] = "Texture";
        })(WebGame.UniformType || (WebGame.UniformType = {}));
        var UniformType = WebGame.UniformType;
        var CommandBufferParameter = (function () {
            function CommandBufferParameter(type) {
                this.id = CommandBufferParameter.nextId++;
                this.type = type;
            }
            CommandBufferParameter.nextId = 1;
            return CommandBufferParameter;
        }());
        WebGame.CommandBufferParameter = CommandBufferParameter;
        var CommandBuffer = (function () {
            function CommandBuffer(context) {
                this.parameters = {};
                this.context = context;
                this.clearCommands();
            }
            CommandBuffer.prototype.getCommandName = function (action) {
                for (var name_2 in this) {
                    if (this[name_2] === action)
                        return name_2;
                }
                return undefined;
            };
            CommandBuffer.prototype.logCommands = function () {
                var commands = [];
                for (var i = 0, iEnd = this.commands.length; i < iEnd; ++i) {
                    var command = this.commands[i];
                    var params = [];
                    for (var name_3 in command) {
                        var value = command[name_3];
                        if (typeof value === "function")
                            continue;
                        switch (name_3) {
                            case "target":
                            case "unit":
                            case "cap":
                            case "mode":
                            case "type":
                                value = "GL_" + Facepunch.WebGl.encodeConst(value);
                                break;
                            case "parameter":
                            case "parameters":
                                value = undefined;
                                break;
                        }
                        if (value !== undefined)
                            params.push(name_3 + ": " + value);
                    }
                    if (command.parameter !== undefined && command.parameters !== undefined) {
                        var value = command.parameters[command.parameter.id];
                        if (value.length !== undefined) {
                            params.push("[" + value + "]");
                        }
                        else {
                            params.push(value.toString());
                        }
                    }
                    var paramsJoined = params.join(", ");
                    commands.push(this.getCommandName(command.action) + "(" + paramsJoined + ");");
                }
                console.log(commands.join("\r\n"));
            };
            CommandBuffer.prototype.clearCommands = function () {
                this.boundTextures = {};
                this.boundBuffers = {};
                this.capStates = {};
                this.commands = [];
                this.lastCommand = null;
            };
            CommandBuffer.prototype.setParameter = function (param, value) {
                this.parameters[param.id] = value;
            };
            CommandBuffer.prototype.getArrayParameter = function (param) {
                return this.parameters[param.id];
            };
            CommandBuffer.prototype.getTextureParameter = function (param) {
                return this.parameters[param.id];
            };
            CommandBuffer.prototype.run = function () {
                var gl = this.context;
                for (var i = 0, iEnd = this.commands.length; i < iEnd; ++i) {
                    var command = this.commands[i];
                    command.action(gl, command);
                }
            };
            CommandBuffer.prototype.push = function (action, args) {
                args.action = action;
                this.commands.push(args);
                this.lastCommand = args;
            };
            CommandBuffer.prototype.clear = function (mask) {
                this.push(this.onClear, { mask: mask });
            };
            CommandBuffer.prototype.onClear = function (gl, args) {
                gl.clear(args.mask);
            };
            CommandBuffer.prototype.setCap = function (cap, enabled) {
                if (this.capStates[cap] === enabled)
                    return;
                this.capStates[cap] = enabled;
                this.push(enabled ? this.onEnable : this.onDisable, { cap: cap });
            };
            CommandBuffer.prototype.enable = function (cap) {
                this.setCap(cap, true);
            };
            CommandBuffer.prototype.onEnable = function (gl, args) {
                gl.enable(args.cap);
            };
            CommandBuffer.prototype.disable = function (cap) {
                this.setCap(cap, false);
            };
            CommandBuffer.prototype.onDisable = function (gl, args) {
                gl.disable(args.cap);
            };
            CommandBuffer.prototype.depthMask = function (flag) {
                this.push(this.onDepthMask, { enabled: flag });
            };
            CommandBuffer.prototype.onDepthMask = function (gl, args) {
                gl.depthMask(args.enabled);
            };
            CommandBuffer.prototype.blendFuncSeparate = function (srcRgb, dstRgb, srcAlpha, dstAlpha) {
                this.push(this.onBlendFuncSeparate, { x: srcRgb, y: dstRgb, z: srcAlpha, w: dstAlpha });
            };
            CommandBuffer.prototype.onBlendFuncSeparate = function (gl, args) {
                gl.blendFuncSeparate(args.x, args.y, args.z, args.w);
            };
            CommandBuffer.prototype.useProgram = function (program) {
                this.push(this.onUseProgram, { program: program });
            };
            CommandBuffer.prototype.onUseProgram = function (gl, args) {
                gl.useProgram(args.program == null ? null : args.program.getProgram());
            };
            CommandBuffer.prototype.setUniformParameter = function (uniform, parameter) {
                if (uniform == null)
                    return;
                var loc = uniform.getLocation();
                if (loc == null)
                    return;
                var args = { uniform: uniform, parameters: this.parameters, parameter: parameter };
                if (uniform.isSampler) {
                    var sampler = uniform;
                    this.setUniform1I(uniform, sampler.getTexUnit());
                    args.unit = sampler.getTexUnit();
                }
                this.push(this.onSetUniformParameter, args);
            };
            CommandBuffer.prototype.onSetUniformParameter = function (gl, args) {
                var param = args.parameter;
                var value = args.parameters[param.id];
                if (value == null)
                    return;
                switch (param.type) {
                    case UniformType.Matrix4:
                        gl.uniformMatrix4fv(args.uniform.getLocation(), false, value);
                        break;
                    case UniformType.Float:
                        gl.uniform1f(args.uniform.getLocation(), value[0]);
                        break;
                    case UniformType.Float2:
                        gl.uniform2f(args.uniform.getLocation(), value[0], value[1]);
                        break;
                    case UniformType.Float3:
                        gl.uniform3f(args.uniform.getLocation(), value[0], value[1], value[2]);
                        break;
                    case UniformType.Float4:
                        gl.uniform4f(args.uniform.getLocation(), value[0], value[1], value[2], value[3]);
                        break;
                    case UniformType.Texture:
                        var tex = value;
                        gl.activeTexture(gl.TEXTURE0 + args.unit);
                        gl.bindTexture(tex.getTarget(), tex.getHandle());
                        break;
                }
            };
            CommandBuffer.prototype.setUniform1F = function (uniform, x) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                this.push(this.onSetUniform1F, { uniform: uniform, x: x });
            };
            CommandBuffer.prototype.onSetUniform1F = function (gl, args) {
                gl.uniform1f(args.uniform.getLocation(), args.x);
            };
            CommandBuffer.prototype.setUniform1I = function (uniform, x) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                this.push(this.onSetUniform1I, { uniform: uniform, x: x });
            };
            CommandBuffer.prototype.onSetUniform1I = function (gl, args) {
                gl.uniform1i(args.uniform.getLocation(), args.x);
            };
            CommandBuffer.prototype.setUniform2F = function (uniform, x, y) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                this.push(this.onSetUniform2F, { uniform: uniform, x: x, y: y });
            };
            CommandBuffer.prototype.onSetUniform2F = function (gl, args) {
                gl.uniform2f(args.uniform.getLocation(), args.x, args.y);
            };
            CommandBuffer.prototype.setUniform3F = function (uniform, x, y, z) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                this.push(this.onSetUniform3F, { uniform: uniform, x: x, y: y, z: z });
            };
            CommandBuffer.prototype.onSetUniform3F = function (gl, args) {
                gl.uniform3f(args.uniform.getLocation(), args.x, args.y, args.z);
            };
            CommandBuffer.prototype.setUniform4F = function (uniform, x, y, z, w) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                this.push(this.onSetUniform4F, { uniform: uniform, x: x, y: y, z: z, w: w });
            };
            CommandBuffer.prototype.onSetUniform4F = function (gl, args) {
                gl.uniform4f(args.uniform.getLocation(), args.x, args.y, args.z, args.w);
            };
            CommandBuffer.prototype.setUniformMatrix4 = function (uniform, transpose, values) {
                if (uniform == null || uniform.getLocation() == null)
                    return;
                this.push(this.onSetUniformMatrix4, { uniform: uniform, transpose: transpose, values: values });
            };
            CommandBuffer.prototype.onSetUniformMatrix4 = function (gl, args) {
                gl.uniformMatrix4fv(args.uniform.getLocation(), args.transpose, args.values);
            };
            CommandBuffer.prototype.bindTexture = function (unit, value) {
                if (this.boundTextures[unit] === value)
                    return;
                this.boundTextures[unit] = value;
                this.push(this.onBindTexture, { unit: unit + this.context.TEXTURE0, target: value.getTarget(), texture: value });
            };
            CommandBuffer.prototype.onBindTexture = function (gl, args) {
                gl.activeTexture(args.unit);
                gl.bindTexture(args.target, args.texture.getHandle());
            };
            CommandBuffer.prototype.bindBuffer = function (target, buffer) {
                if (this.boundBuffers[target] === buffer)
                    return;
                this.boundBuffers[target] = buffer;
                this.push(this.onBindBuffer, { target: target, buffer: buffer });
            };
            CommandBuffer.prototype.onBindBuffer = function (gl, args) {
                gl.bindBuffer(args.target, args.buffer);
            };
            CommandBuffer.prototype.enableVertexAttribArray = function (index) {
                this.push(this.onEnableVertexAttribArray, { index: index });
            };
            CommandBuffer.prototype.onEnableVertexAttribArray = function (gl, args) {
                gl.enableVertexAttribArray(args.index);
            };
            CommandBuffer.prototype.disableVertexAttribArray = function (index) {
                this.push(this.onDisableVertexAttribArray, { index: index });
            };
            CommandBuffer.prototype.onDisableVertexAttribArray = function (gl, args) {
                gl.disableVertexAttribArray(args.index);
            };
            CommandBuffer.prototype.vertexAttribPointer = function (index, size, type, normalized, stride, offset) {
                this.push(this.onVertexAttribPointer, { index: index, size: size, type: type, normalized: normalized, stride: stride, offset: offset });
            };
            CommandBuffer.prototype.onVertexAttribPointer = function (gl, args) {
                gl.vertexAttribPointer(args.index, args.size, args.type, args.normalized, args.stride, args.offset);
            };
            CommandBuffer.prototype.drawElements = function (mode, count, type, offset, elemSize) {
                if (this.lastCommand.action === this.onDrawElements &&
                    this.lastCommand.type === type &&
                    this.lastCommand.offset + this.lastCommand.count * elemSize === offset) {
                    this.lastCommand.count += count;
                    return;
                }
                this.push(this.onDrawElements, { mode: mode, count: count, type: type, offset: offset });
            };
            CommandBuffer.prototype.onDrawElements = function (gl, args) {
                gl.drawElements(args.mode, args.count, args.type, args.offset);
            };
            CommandBuffer.prototype.bindFramebuffer = function (buffer, fitView) {
                this.push(this.onBindFramebuffer, { framebuffer: buffer, fitView: fitView });
            };
            CommandBuffer.prototype.onBindFramebuffer = function (gl, args) {
                var buffer = args.framebuffer;
                if (buffer == null) {
                    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                    return;
                }
                if (args.fitView) {
                    buffer.resize(gl.drawingBufferWidth, gl.drawingBufferHeight);
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.getHandle());
            };
            return CommandBuffer;
        }());
        WebGame.CommandBuffer = CommandBuffer;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="Entity.ts"/>
/// <reference path="CommandBuffer.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Camera = (function (_super) {
            __extends(Camera, _super);
            function Camera() {
                _super.apply(this, arguments);
                this.projectionInvalid = true;
                this.projectionMatrix = new Facepunch.Matrix4();
                this.inverseProjectionInvalid = true;
                this.inverseProjectionMatrix = new Facepunch.Matrix4();
                this.cameraPosParams = new Float32Array(3);
                this.clipParams = new Float32Array(4);
            }
            Camera.prototype.getProjectionMatrix = function (target) {
                if (this.projectionInvalid) {
                    this.projectionInvalid = false;
                    this.onUpdateProjectionMatrix(this.projectionMatrix);
                }
                if (target != null) {
                    target.copy(this.projectionMatrix);
                    return target;
                }
                return this.projectionMatrix;
            };
            Camera.prototype.getInverseProjectionMatrix = function (target) {
                if (this.inverseProjectionInvalid) {
                    this.inverseProjectionInvalid = false;
                    this.inverseProjectionMatrix.setInverse(this.getProjectionMatrix());
                }
                if (target != null) {
                    target.copy(this.inverseProjectionMatrix);
                    return target;
                }
                return this.inverseProjectionMatrix;
            };
            Camera.prototype.invalidateProjectionMatrix = function () {
                this.projectionInvalid = true;
                this.inverseProjectionInvalid = true;
            };
            Camera.prototype.populateCommandBufferParameters = function (buf) {
                this.getPositionValues(this.cameraPosParams);
                this.clipParams[0] = this.getNear();
                this.clipParams[1] = this.getFar();
                this.clipParams[2] = 1 / (this.clipParams[1] - this.clipParams[0]);
                buf.setParameter(Camera.cameraPosParam, this.cameraPosParams);
                buf.setParameter(Camera.clipInfoParam, this.clipParams);
                buf.setParameter(Camera.projectionMatrixParam, this.getProjectionMatrix().elements);
                buf.setParameter(Camera.inverseProjectionMatrixParam, this.getInverseProjectionMatrix().elements);
                buf.setParameter(Camera.viewMatrixParam, this.getInverseMatrix().elements);
                buf.setParameter(Camera.inverseViewMatrixParam, this.getMatrix().elements);
            };
            Camera.cameraPosParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float3);
            Camera.clipInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
            Camera.projectionMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
            Camera.inverseProjectionMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
            Camera.viewMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
            Camera.inverseViewMatrixParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Matrix4);
            return Camera;
        }(WebGame.Entity));
        WebGame.Camera = Camera;
        var PerspectiveCamera = (function (_super) {
            __extends(PerspectiveCamera, _super);
            function PerspectiveCamera(fov, aspect, near, far) {
                _super.call(this);
                this.fov = fov;
                this.aspect = aspect;
                this.near = near;
                this.far = far;
            }
            PerspectiveCamera.prototype.setFov = function (value) { this.fov = value; this.invalidateProjectionMatrix(); };
            PerspectiveCamera.prototype.getFov = function () { return this.fov; };
            PerspectiveCamera.prototype.setAspect = function (value) { this.aspect = value; this.invalidateProjectionMatrix(); };
            PerspectiveCamera.prototype.getAspect = function () { return this.aspect; };
            PerspectiveCamera.prototype.setNear = function (value) { this.near = value; this.invalidateProjectionMatrix(); };
            PerspectiveCamera.prototype.getNear = function () { return this.near; };
            PerspectiveCamera.prototype.setFar = function (value) { this.far = value; this.invalidateProjectionMatrix(); };
            PerspectiveCamera.prototype.getFar = function () { return this.far; };
            PerspectiveCamera.prototype.onUpdateProjectionMatrix = function (matrix) {
                var deg2Rad = Math.PI / 180;
                matrix.setPerspective(deg2Rad * this.fov, this.aspect, this.near, this.far);
            };
            return PerspectiveCamera;
        }(Camera));
        WebGame.PerspectiveCamera = PerspectiveCamera;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DrawList = (function () {
            function DrawList(context) {
                this.items = [];
                this.opaque = [];
                this.translucent = [];
                this.isBuildingList = false;
                this.context = context;
                this.game = context.game;
            }
            DrawList.prototype.isInvalid = function () {
                return this.invalid;
            };
            DrawList.prototype.clear = function () {
                for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    this.items[i].onRemoveFromDrawList(this);
                }
                this.items = [];
                this.opaque = [];
                this.translucent = [];
            };
            DrawList.prototype.getDrawCalls = function () {
                return this.opaque.length + this.translucent.length;
            };
            DrawList.prototype.addItem = function (item) {
                this.items.push(item);
                item.onAddToDrawList(this);
                this.invalidate();
            };
            DrawList.prototype.addItems = function (items) {
                if (items.length === 0)
                    return;
                for (var i = 0, iEnd = items.length; i < iEnd; ++i) {
                    this.items.push(items[i]);
                    items[i].onAddToDrawList(this);
                }
                this.invalidate();
            };
            DrawList.prototype.invalidate = function () {
                if (this.isBuildingList)
                    return;
                this.invalid = true;
            };
            DrawList.prototype.bufferHandle = function (buf, handle, context) {
                var changedMaterial = false;
                var changedProgram = false;
                var changedTransform = false;
                var program = handle.material.program;
                if (this.lastHandle.transform !== handle.transform) {
                    changedTransform = true;
                }
                if (this.lastHandle.material !== handle.material) {
                    changedMaterial = true;
                    changedProgram = this.lastHandle.material === undefined || this.lastHandle.material.program !== program;
                    changedTransform = changedTransform || changedProgram;
                }
                if (changedProgram) {
                    if (this.lastHandle.material !== undefined) {
                        this.lastHandle.material.program.bufferDisableAttributes(buf);
                    }
                    program.bufferSetup(buf, context);
                }
                if (changedMaterial) {
                    program.bufferMaterial(buf, handle.material);
                }
                if (changedTransform) {
                    program.bufferModelMatrix(buf, handle.transform == null
                        ? DrawList.identityMatrix.elements : handle.transform.elements);
                }
                if (this.lastHandle.group !== handle.group || changedProgram) {
                    handle.group.bufferBindBuffers(buf, program);
                }
                if (this.lastHandle.vertexOffset !== handle.vertexOffset) {
                    handle.group.bufferAttribPointers(buf, program, handle.vertexOffset);
                }
                handle.group.bufferRenderElements(buf, handle.drawMode, handle.indexOffset, handle.indexCount);
                this.lastHandle = handle;
            };
            DrawList.compareHandles = function (a, b) {
                return a.compareTo(b);
            };
            DrawList.prototype.buildHandleList = function () {
                this.opaque = [];
                this.translucent = [];
                this.hasRefraction = false;
                this.isBuildingList = true;
                for (var i = 0, iEnd = this.items.length; i < iEnd; ++i) {
                    var handles = this.items[i].getMeshHandles();
                    if (handles == null)
                        continue;
                    for (var j = 0, jEnd = handles.length; j < jEnd; ++j) {
                        var handle = handles[j];
                        if (handle.indexCount === 0)
                            continue;
                        if (handle.material == null)
                            continue;
                        if (!handle.material.enabled)
                            continue;
                        if (handle.material.program == null)
                            continue;
                        if (!handle.material.program.isCompiled())
                            continue;
                        if (handle.material.properties.translucent || handle.material.properties.refract) {
                            if (handle.material.properties.refract)
                                this.hasRefraction = true;
                            this.translucent.push(handle);
                        }
                        else
                            this.opaque.push(handle);
                    }
                }
                this.isBuildingList = false;
                this.opaque.sort(DrawList.compareHandles);
                this.translucent.sort(DrawList.compareHandles);
            };
            DrawList.prototype.appendToBuffer = function (buf, context) {
                this.lastHandle = WebGame.MeshHandle.undefinedHandle;
                if (this.invalid)
                    this.buildHandleList();
                this.game.shaders.resetUniformCache();
                if (this.hasRefraction)
                    context.bufferOpaqueTargetBegin(buf);
                for (var i = 0, iEnd = this.opaque.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.opaque[i], context);
                }
                if (this.hasRefraction) {
                    context.bufferRenderTargetEnd(buf);
                    this.bufferHandle(buf, this.game.meshes.getComposeFrameMeshHandle(), context);
                }
                for (var i = 0, iEnd = this.translucent.length; i < iEnd; ++i) {
                    this.bufferHandle(buf, this.translucent[i], context);
                }
                if (this.lastHandle.material !== undefined) {
                    this.lastHandle.material.program.bufferDisableAttributes(buf);
                    buf.useProgram(null);
                }
            };
            DrawList.identityMatrix = new Facepunch.Matrix4().setIdentity();
            return DrawList;
        }());
        WebGame.DrawList = DrawList;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var DrawListItem = (function () {
            function DrawListItem() {
                this.isStatic = false;
                this.entity = null;
                this.drawLists = [];
            }
            DrawListItem.prototype.clearMeshHandles = function () {
                this.meshHandles = null;
                this.invalidateDrawLists();
            };
            DrawListItem.prototype.addMeshHandles = function (handles) {
                if (this.meshHandles == null)
                    this.meshHandles = [];
                for (var i = 0, iEnd = handles.length; i < iEnd; ++i) {
                    this.meshHandles.push(handles[i].clone(!this.isStatic && this.entity != null ? this.entity.getMatrix() : null));
                }
                this.invalidateDrawLists();
            };
            DrawListItem.prototype.invalidateDrawLists = function () {
                if (!this.getIsVisible())
                    return;
                for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    this.drawLists[i].invalidate();
                }
            };
            DrawListItem.prototype.getIsVisible = function () {
                return this.drawLists.length > 0;
            };
            DrawListItem.prototype.getIsInDrawList = function (drawList) {
                for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === drawList) {
                        return true;
                    }
                }
                return false;
            };
            DrawListItem.prototype.onAddToDrawList = function (list) {
                if (this.getIsInDrawList(list))
                    throw "Item added to a draw list twice.";
                this.drawLists.push(list);
            };
            DrawListItem.prototype.onRemoveFromDrawList = function (list) {
                for (var i = 0, iEnd = this.drawLists.length; i < iEnd; ++i) {
                    if (this.drawLists[i] === list) {
                        this.drawLists.splice(i, 1);
                        return;
                    }
                }
                throw "Item removed from a draw list it isn't a member of.";
            };
            DrawListItem.prototype.getMeshHandles = function () {
                return this.meshHandles;
            };
            return DrawListItem;
        }());
        WebGame.DrawListItem = DrawListItem;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Fog = (function () {
            function Fog(context) {
                this.start = 0;
                this.end = 8192;
                this.maxDensity = 0;
                this.color = new Facepunch.Vector3();
                this.colorValues = new Float32Array(3);
                this.paramsValues = new Float32Array(4);
                this.renderContext = context;
            }
            Fog.prototype.populateCommandBufferParameters = function (buf) {
                this.colorValues[0] = this.color.x;
                this.colorValues[1] = this.color.y;
                this.colorValues[2] = this.color.z;
                buf.setParameter(Fog.fogColorParam, this.colorValues);
                var clipParams = buf.getArrayParameter(WebGame.Camera.clipInfoParam);
                var near = clipParams[0];
                var far = clipParams[1];
                var densMul = this.maxDensity / ((this.end - this.start) * (far - near));
                var densNear = (near - this.start) * densMul;
                var densFar = (far - this.start) * densMul;
                this.paramsValues[0] = densNear;
                this.paramsValues[1] = densFar;
                this.paramsValues[2] = 0;
                this.paramsValues[3] = this.maxDensity;
                buf.setParameter(Fog.fogInfoParam, this.paramsValues);
            };
            Fog.fogColorParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float3);
            Fog.fogInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
            return Fog;
        }());
        WebGame.Fog = Fog;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var FrameBuffer = (function () {
            function FrameBuffer(gl, width, height) {
                this.context = gl;
                this.width = width;
                this.height = height;
                this.frameTexture = new WebGame.RenderTexture(gl, WebGame.TextureTarget.Texture2D, WebGame.TextureFormat.Rgba, WebGame.TextureDataType.Uint8, width, height);
                this.frameBuffer = gl.createFramebuffer();
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.frameTexture.getHandle(), 0);
                this.unbindAndCheckState();
            }
            FrameBuffer.prototype.unbindAndCheckState = function () {
                var gl = this.context;
                var state = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                if (state !== gl.FRAMEBUFFER_COMPLETE) {
                    throw new Error("Unexpected framebuffer state: " + state + ".");
                }
            };
            FrameBuffer.prototype.addDepthAttachment = function (existing) {
                var gl = this.context;
                if (existing == null) {
                    this.depthTexture = new WebGame.RenderTexture(gl, WebGame.TextureTarget.Texture2D, WebGame.TextureFormat.DepthComponent, WebGame.TextureDataType.Uint32, this.width, this.height);
                }
                else {
                    this.depthTexture = existing;
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture.getHandle(), 0);
                this.unbindAndCheckState();
            };
            FrameBuffer.prototype.getColorTexture = function () { return this.frameTexture; };
            FrameBuffer.prototype.getDepthTexture = function () { return this.depthTexture; };
            FrameBuffer.prototype.dispose = function () {
                if (this.frameBuffer !== undefined) {
                    this.context.deleteFramebuffer(this.frameBuffer);
                    this.frameBuffer = undefined;
                }
                if (this.frameTexture !== undefined) {
                    this.frameTexture.dispose();
                    this.frameTexture = undefined;
                }
                if (this.depthTexture !== undefined) {
                    this.depthTexture.dispose();
                    this.depthTexture = undefined;
                }
            };
            FrameBuffer.prototype.resize = function (width, height) {
                if (this.width === width && this.height === height)
                    return;
                this.width = width;
                this.height = height;
                this.frameTexture.resize(width, height);
                if (this.depthTexture !== undefined) {
                    this.depthTexture.resize(width, height);
                }
            };
            FrameBuffer.prototype.getHandle = function () {
                return this.frameBuffer;
            };
            FrameBuffer.prototype.begin = function () {
                var gl = this.context;
                gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
            };
            FrameBuffer.prototype.end = function () {
                var gl = this.context;
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            };
            return FrameBuffer;
        }());
        WebGame.FrameBuffer = FrameBuffer;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        (function (MouseButton) {
            MouseButton[MouseButton["Left"] = 1] = "Left";
            MouseButton[MouseButton["Middle"] = 2] = "Middle";
            MouseButton[MouseButton["Right"] = 3] = "Right";
        })(WebGame.MouseButton || (WebGame.MouseButton = {}));
        var MouseButton = WebGame.MouseButton;
        (function (Key) {
            Key[Key["Backspace"] = 8] = "Backspace";
            Key[Key["Tab"] = 9] = "Tab";
            Key[Key["Enter"] = 13] = "Enter";
            Key[Key["Shift"] = 16] = "Shift";
            Key[Key["Ctrl"] = 17] = "Ctrl";
            Key[Key["Alt"] = 18] = "Alt";
            Key[Key["PauseBreak"] = 19] = "PauseBreak";
            Key[Key["CapsLock"] = 20] = "CapsLock";
            Key[Key["Escape"] = 27] = "Escape";
            Key[Key["PageUp"] = 33] = "PageUp";
            Key[Key["PageDown"] = 34] = "PageDown";
            Key[Key["End"] = 35] = "End";
            Key[Key["Home"] = 36] = "Home";
            Key[Key["LeftArrow"] = 37] = "LeftArrow";
            Key[Key["UpArrow"] = 38] = "UpArrow";
            Key[Key["RightArrow"] = 39] = "RightArrow";
            Key[Key["DownArrow"] = 40] = "DownArrow";
            Key[Key["Insert"] = 45] = "Insert";
            Key[Key["Delete"] = 46] = "Delete";
            Key[Key["D0"] = 48] = "D0";
            Key[Key["D1"] = 49] = "D1";
            Key[Key["D2"] = 50] = "D2";
            Key[Key["D3"] = 51] = "D3";
            Key[Key["D4"] = 52] = "D4";
            Key[Key["D5"] = 53] = "D5";
            Key[Key["D6"] = 54] = "D6";
            Key[Key["D7"] = 55] = "D7";
            Key[Key["D8"] = 56] = "D8";
            Key[Key["D9"] = 57] = "D9";
            Key[Key["A"] = 65] = "A";
            Key[Key["B"] = 66] = "B";
            Key[Key["C"] = 67] = "C";
            Key[Key["D"] = 68] = "D";
            Key[Key["E"] = 69] = "E";
            Key[Key["F"] = 70] = "F";
            Key[Key["G"] = 71] = "G";
            Key[Key["H"] = 72] = "H";
            Key[Key["I"] = 73] = "I";
            Key[Key["J"] = 74] = "J";
            Key[Key["K"] = 75] = "K";
            Key[Key["L"] = 76] = "L";
            Key[Key["M"] = 77] = "M";
            Key[Key["N"] = 78] = "N";
            Key[Key["O"] = 79] = "O";
            Key[Key["P"] = 80] = "P";
            Key[Key["Q"] = 81] = "Q";
            Key[Key["R"] = 82] = "R";
            Key[Key["S"] = 83] = "S";
            Key[Key["T"] = 84] = "T";
            Key[Key["U"] = 85] = "U";
            Key[Key["V"] = 86] = "V";
            Key[Key["W"] = 87] = "W";
            Key[Key["X"] = 88] = "X";
            Key[Key["Y"] = 89] = "Y";
            Key[Key["Z"] = 90] = "Z";
            Key[Key["LeftWindowKey"] = 91] = "LeftWindowKey";
            Key[Key["RightWindowKey"] = 92] = "RightWindowKey";
            Key[Key["Select"] = 93] = "Select";
            Key[Key["Numpad0"] = 96] = "Numpad0";
            Key[Key["Numpad1"] = 97] = "Numpad1";
            Key[Key["Numpad2"] = 98] = "Numpad2";
            Key[Key["Numpad3"] = 99] = "Numpad3";
            Key[Key["Numpad4"] = 100] = "Numpad4";
            Key[Key["Numpad5"] = 101] = "Numpad5";
            Key[Key["Numpad6"] = 102] = "Numpad6";
            Key[Key["Numpad7"] = 103] = "Numpad7";
            Key[Key["Numpad8"] = 104] = "Numpad8";
            Key[Key["Numpad9"] = 105] = "Numpad9";
            Key[Key["Multiply"] = 106] = "Multiply";
            Key[Key["Add"] = 107] = "Add";
            Key[Key["Subtract"] = 109] = "Subtract";
            Key[Key["DecimalPoint"] = 110] = "DecimalPoint";
            Key[Key["Divide"] = 111] = "Divide";
            Key[Key["F1"] = 112] = "F1";
            Key[Key["F2"] = 113] = "F2";
            Key[Key["F3"] = 114] = "F3";
            Key[Key["F4"] = 115] = "F4";
            Key[Key["F5"] = 116] = "F5";
            Key[Key["F6"] = 117] = "F6";
            Key[Key["F7"] = 118] = "F7";
            Key[Key["F8"] = 119] = "F8";
            Key[Key["F9"] = 120] = "F9";
            Key[Key["F10"] = 121] = "F10";
            Key[Key["F11"] = 122] = "F11";
            Key[Key["F12"] = 123] = "F12";
            Key[Key["NumLock"] = 144] = "NumLock";
            Key[Key["ScrollLock"] = 145] = "ScrollLock";
            Key[Key["SemiColon"] = 186] = "SemiColon";
            Key[Key["EqualSign"] = 187] = "EqualSign";
            Key[Key["Comma"] = 188] = "Comma";
            Key[Key["Dash"] = 189] = "Dash";
            Key[Key["Period"] = 190] = "Period";
            Key[Key["ForwardSlash"] = 191] = "ForwardSlash";
            Key[Key["GraveAccent"] = 192] = "GraveAccent";
            Key[Key["OpenBracket"] = 219] = "OpenBracket";
            Key[Key["BackSlash"] = 220] = "BackSlash";
            Key[Key["CloseBraket"] = 221] = "CloseBraket";
            Key[Key["SingleQuote"] = 222] = "SingleQuote";
        })(WebGame.Key || (WebGame.Key = {}));
        var Key = WebGame.Key;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
/// <reference path="Input.ts"/>
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Game = (function () {
            function Game(container) {
                var _this = this;
                this.canLockPointer = false;
                this.loaders = [];
                this.lastAnimateCallback = 0;
                this.drawListInvalidationHandlers = [];
                this.heldKeys = new Array(128);
                this.heldMouseButtons = new Array(8);
                this.mouseScreenPos = new Facepunch.Vector2();
                this.mouseLookDelta = new Facepunch.Vector2();
                this.timeParams = new Float32Array(4);
                this.screenParams = new Float32Array(4);
                this.container = container;
                this.canvas = document.createElement("canvas");
                this.container.appendChild(this.canvas);
                this.context = this.canvas.getContext("webgl");
                this.shaders = new WebGame.ShaderManager(this.context);
                this.meshes = new WebGame.MeshManager(this);
                this.materialLoader = this.addLoader(new WebGame.MaterialLoader(this));
                this.textureLoader = this.addLoader(new WebGame.TextureLoader(this.context));
                this.modelLoader = this.addLoader(new WebGame.ModelLoader(this));
                container.addEventListener("mousedown", function (evnt) {
                    _this.heldMouseButtons[evnt.which] = true;
                    _this.onMouseDown(evnt.which, _this.getScreenPos(evnt.pageX, evnt.pageY, _this.mouseScreenPos));
                    if (_this.canLockPointer)
                        _this.container.requestPointerLock();
                    return false;
                });
                window.addEventListener("mouseup", function (evnt) {
                    _this.heldMouseButtons[evnt.which] = false;
                    _this.onMouseUp(evnt.which, _this.getScreenPos(evnt.pageX, evnt.pageY, _this.mouseScreenPos));
                });
                window.addEventListener("mousemove", function (evnt) {
                    _this.onMouseMove(_this.getScreenPos(evnt.pageX, evnt.pageY, _this.mouseScreenPos));
                    if (_this.isPointerLocked()) {
                        var e = evnt;
                        _this.mouseLookDelta.set(e.movementX, e.movementY);
                        _this.onMouseLook(_this.mouseLookDelta);
                    }
                });
                window.addEventListener("keydown", function (evnt) {
                    if (evnt.which < 0 || evnt.which >= 128)
                        return true;
                    _this.heldKeys[evnt.which] = true;
                    _this.onKeyDown(evnt.which);
                    if (_this.isPointerLocked() && evnt.which === WebGame.Key.Escape) {
                        document.exitPointerLock();
                    }
                    return evnt.which !== WebGame.Key.Tab;
                });
                window.addEventListener("keyup", function (evnt) {
                    if (evnt.which < 0 || evnt.which >= 128)
                        return true;
                    _this.heldKeys[evnt.which] = false;
                    _this.onKeyUp(evnt.which);
                });
                this.animateCallback = function (time) {
                    var deltaTime = time - _this.lastAnimateCallback;
                    _this.lastAnimateCallback = time;
                    _this.animate(deltaTime * 0.001);
                };
                this.onInitialize();
                this.onResize();
            }
            Game.prototype.getLastUpdateTime = function () {
                return this.lastAnimateCallback;
            };
            Game.prototype.getWidth = function () {
                return this.container.clientWidth;
            };
            Game.prototype.getHeight = function () {
                return this.container.clientHeight;
            };
            Game.prototype.getMouseScreenPos = function (out) {
                if (out == null)
                    out = new Facepunch.Vector2();
                out.copy(this.mouseScreenPos);
                return out;
            };
            Game.prototype.getMouseViewPos = function (out) {
                if (out == null)
                    out = new Facepunch.Vector2();
                this.getMouseScreenPos(out);
                out.x = out.x / this.getWidth() - 0.5;
                out.y = out.y / this.getHeight() - 0.5;
                return out;
            };
            Game.prototype.getScreenPos = function (pageX, pageY, out) {
                if (out == null)
                    out = new Facepunch.Vector2();
                out.x = pageX - this.container.offsetLeft;
                out.y = pageY - this.container.offsetTop;
                return out;
            };
            Game.prototype.isPointerLocked = function () {
                return document.pointerLockElement === this.container;
            };
            Game.prototype.populateDrawList = function (drawList, camera) { };
            Game.prototype.addDrawListInvalidationHandler = function (action) {
                this.drawListInvalidationHandlers.push(action);
            };
            Game.prototype.forceDrawListInvalidation = function (geom) {
                for (var i = 0; i < this.drawListInvalidationHandlers.length; ++i) {
                    this.drawListInvalidationHandlers[i](geom);
                }
            };
            Game.prototype.animate = function (dt) {
                dt = dt || 0.01666667;
                for (var i = 0, iEnd = this.loaders.length; i < iEnd; ++i) {
                    this.loaders[i].update(4);
                }
                this.onUpdateFrame(dt);
                this.onRenderFrame(dt);
                requestAnimationFrame(this.animateCallback);
            };
            Game.prototype.isKeyDown = function (key) {
                return key >= 0 && key < 128 && this.heldKeys[key] === true;
            };
            Game.prototype.isMouseButtonDown = function (button) {
                return button >= 0 && button < this.heldMouseButtons.length && this.heldMouseButtons[button] === true;
            };
            Game.prototype.onInitialize = function () { };
            Game.prototype.onResize = function () {
                this.canvas.width = this.container.clientWidth;
                this.canvas.height = this.container.clientHeight;
                this.context.viewport(0, 0, this.canvas.width, this.canvas.height);
            };
            Game.prototype.addLoader = function (loader) {
                this.loaders.push(loader);
                return loader;
            };
            Game.prototype.onMouseDown = function (button, screenPos) { };
            Game.prototype.onMouseUp = function (button, screenPos) { };
            Game.prototype.onMouseMove = function (screenPos) { };
            Game.prototype.onMouseLook = function (delta) { };
            Game.prototype.onKeyDown = function (key) { };
            Game.prototype.onKeyUp = function (key) { };
            Game.prototype.onUpdateFrame = function (dt) { };
            Game.prototype.onRenderFrame = function (dt) { };
            Game.prototype.populateCommandBufferParameters = function (buf) {
                this.timeParams[0] = this.getLastUpdateTime();
                this.screenParams[0] = this.getWidth();
                this.screenParams[1] = this.getHeight();
                this.screenParams[2] = 1 / this.getWidth();
                this.screenParams[3] = 1 / this.getHeight();
                buf.setParameter(Game.timeInfoParam, this.timeParams);
                buf.setParameter(Game.screenInfoParam, this.screenParams);
            };
            Game.timeInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
            Game.screenInfoParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Float4);
            return Game;
        }());
        WebGame.Game = Game;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        (function (MaterialPropertyType) {
            MaterialPropertyType[MaterialPropertyType["Boolean"] = 1] = "Boolean";
            MaterialPropertyType[MaterialPropertyType["Number"] = 2] = "Number";
            MaterialPropertyType[MaterialPropertyType["TextureUrl"] = 3] = "TextureUrl";
        })(WebGame.MaterialPropertyType || (WebGame.MaterialPropertyType = {}));
        var MaterialPropertyType = WebGame.MaterialPropertyType;
        var Material = (function () {
            function Material(program) {
                this.id = Material.nextId++;
                this.enabled = true;
                this.program = program;
                if (program != null) {
                    this.properties = program.createMaterialProperties();
                }
                else {
                    this.properties = {};
                }
            }
            Material.nextId = 0;
            return Material;
        }());
        WebGame.Material = Material;
        var MaterialLoadable = (function (_super) {
            __extends(MaterialLoadable, _super);
            function MaterialLoadable(game, url) {
                _super.call(this);
                this.game = game;
                this.url = url;
            }
            MaterialLoadable.prototype.addPropertyFromInfo = function (info) {
                switch (info.type) {
                    case MaterialPropertyType.Boolean:
                    case MaterialPropertyType.Number:
                        this.properties[info.name] = info.value;
                        break;
                    case MaterialPropertyType.TextureUrl:
                        var texUrl = Facepunch.Http.getAbsUrl(info.value, this.url);
                        this.properties[info.name] = this.game.textureLoader.load(texUrl);
                        break;
                }
            };
            MaterialLoadable.prototype.loadNext = function (callback) {
                var _this = this;
                if (this.program != null) {
                    callback(false);
                    return;
                }
                Facepunch.Http.getJson(this.url, function (info) {
                    _this.program = _this.game.shaders.get(info.shader);
                    _this.properties = _this.program.createMaterialProperties();
                    for (var i = 0; i < info.properties.length; ++i) {
                        _this.addPropertyFromInfo(info.properties[i]);
                    }
                    callback(false);
                }, function (error) {
                    console.error("Failed to load material " + _this.url + ": " + error);
                    callback(false);
                });
            };
            return MaterialLoadable;
        }(Material));
        WebGame.MaterialLoadable = MaterialLoadable;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MaterialLoader = (function (_super) {
            __extends(MaterialLoader, _super);
            function MaterialLoader(game) {
                _super.call(this);
                this.game = game;
            }
            MaterialLoader.prototype.onCreateItem = function (url) {
                return new WebGame.MaterialLoadable(this.game, url);
            };
            return MaterialLoader;
        }(Facepunch.Loader));
        WebGame.MaterialLoader = MaterialLoader;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MeshGroup = (function () {
            function MeshGroup(context, attribs) {
                this.id = MeshGroup.nextId++;
                this.vertexDataLength = 0;
                this.indexDataLength = 0;
                this.subBufferOffset = 0;
                this.context = context;
                this.indexSize = context.getExtension("OES_element_index_uint") != null ? 4 : 2;
                this.vertexLength = 0;
                this.attribs = [];
                this.attribOffsets = [];
                for (var i = 0; i < attribs.length; ++i) {
                    this.attribs.push(attribs[i]);
                    this.attribOffsets.push(this.vertexLength * MeshGroup.vertexComponentSize);
                    this.vertexLength += attribs[i].size;
                }
                var maxVertsPerSubBuffer = this.indexSize === 4 ? 2147483648 : 65536;
                this.maxVertexDataLength = MeshGroup.maxIndexDataLength;
                this.maxSubBufferLength = this.vertexLength * maxVertsPerSubBuffer;
                this.vertexBuffer = context.createBuffer();
                this.indexBuffer = context.createBuffer();
            }
            MeshGroup.prototype.compareTo = function (other) {
                return this.id - other.id;
            };
            MeshGroup.prototype.canAddMeshData = function (data) {
                if (this.attribs.length !== data.attributes.length)
                    return false;
                for (var i = 0; i < this.attribs.length; ++i) {
                    if (WebGame.VertexAttribute.compare(this.attribs[i], data.attributes[i]) !== 0)
                        return false;
                }
                return this.vertexDataLength + data.vertices.length <= this.maxVertexDataLength
                    && this.indexDataLength + data.indices.length <= MeshGroup.maxIndexDataLength;
            };
            MeshGroup.prototype.ensureCapacity = function (array, length, ctor) {
                if (array != null && array.length >= length)
                    return array;
                var newLength = 2048;
                while (newLength < length)
                    newLength *= 2;
                var newArray = ctor(newLength);
                if (array != null)
                    newArray.set(array, 0);
                return newArray;
            };
            MeshGroup.prototype.updateBuffer = function (target, buffer, data, newData, oldData, offset) {
                var gl = this.context;
                gl.bindBuffer(target, buffer);
                if (data !== oldData) {
                    gl.bufferData(target, data.byteLength, gl.STATIC_DRAW);
                    gl.bufferSubData(target, 0, data);
                }
                else {
                    gl.bufferSubData(target, offset * data.BYTES_PER_ELEMENT, newData);
                }
            };
            MeshGroup.prototype.addMeshData = function (data, getMaterial, target) {
                if (!this.canAddMeshData(data)) {
                    throw new Error("Target MeshGroup is incompatible with the given IMeshData.");
                }
                var gl = this.context;
                var newVertices = new Float32Array(data.vertices);
                var newIndices = this.indexSize === 4 ? new Uint32Array(data.indices) : new Uint16Array(data.indices);
                var vertexOffset = this.vertexDataLength;
                var oldVertexData = this.vertexData;
                this.vertexData = this.ensureCapacity(this.vertexData, this.vertexDataLength + newVertices.length, function (size) { return new Float32Array(size); });
                var indexOffset = this.indexDataLength;
                var oldIndexData = this.indexData;
                this.indexData = this.ensureCapacity(this.indexData, this.indexDataLength + newIndices.length, this.indexSize === 4 ? function (size) { return new Uint32Array(size); } : function (size) { return new Uint16Array(size); });
                this.vertexData.set(newVertices, vertexOffset);
                this.vertexDataLength += newVertices.length;
                if (this.vertexDataLength - this.subBufferOffset > this.maxSubBufferLength) {
                    this.subBufferOffset = vertexOffset;
                }
                var elementOffset = Math.round(vertexOffset / this.vertexLength) - this.subBufferOffset;
                if (elementOffset !== 0) {
                    for (var i = 0, iEnd = newIndices.length; i < iEnd; ++i) {
                        newIndices[i] += elementOffset;
                    }
                }
                this.indexData.set(newIndices, indexOffset);
                this.indexDataLength += newIndices.length;
                this.updateBuffer(gl.ARRAY_BUFFER, this.vertexBuffer, this.vertexData, newVertices, oldVertexData, vertexOffset);
                this.updateBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer, this.indexData, newIndices, oldIndexData, indexOffset);
                for (var i = 0; i < data.elements.length; ++i) {
                    var element = data.elements[i];
                    var material = typeof element.material === "number"
                        ? getMaterial != null ? getMaterial(element.material) : null
                        : element.material;
                    target.push(new WebGame.MeshHandle(this, this.subBufferOffset, Facepunch.WebGl.decodeConst(element.mode), element.indexOffset + indexOffset, element.indexCount, material));
                }
            };
            MeshGroup.prototype.bufferBindBuffers = function (buf, program) {
                var gl = this.context;
                buf.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
                buf.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
                program.bufferEnableAttributes(buf, this.attribs);
            };
            MeshGroup.prototype.bufferAttribPointers = function (buf, program, vertexOffset) {
                var gl = this.context;
                var compSize = MeshGroup.vertexComponentSize;
                var stride = this.vertexLength * compSize;
                for (var i = 0, iEnd = this.attribs.length; i < iEnd; ++i) {
                    program.bufferAttribPointer(buf, this.attribs[i], stride, vertexOffset + this.attribOffsets[i]);
                }
            };
            MeshGroup.prototype.bufferRenderElements = function (buf, mode, offset, count) {
                var gl = this.context;
                buf.drawElements(mode, count, this.indexSize === 4 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, offset * this.indexSize, this.indexSize);
            };
            MeshGroup.prototype.dispose = function () {
                if (this.vertexBuffer !== undefined) {
                    this.context.deleteBuffer(this.vertexBuffer);
                    this.vertexBuffer = undefined;
                }
                if (this.indexBuffer !== undefined) {
                    this.context.deleteBuffer(this.indexBuffer);
                    this.indexBuffer = undefined;
                }
            };
            MeshGroup.maxIndexDataLength = 2147483648;
            MeshGroup.vertexComponentSize = 4;
            MeshGroup.nextId = 1;
            return MeshGroup;
        }());
        WebGame.MeshGroup = MeshGroup;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        (function (DrawMode) {
            DrawMode[DrawMode["Triangles"] = WebGLRenderingContext.TRIANGLES] = "Triangles";
            DrawMode[DrawMode["TriangleStrip"] = WebGLRenderingContext.TRIANGLE_STRIP] = "TriangleStrip";
            DrawMode[DrawMode["TriangleFan"] = WebGLRenderingContext.TRIANGLE_FAN] = "TriangleFan";
        })(WebGame.DrawMode || (WebGame.DrawMode = {}));
        var DrawMode = WebGame.DrawMode;
        var MeshHandle = (function () {
            function MeshHandle(group, vertexOffset, drawMode, indexOffset, indexCount, material, transform) {
                this.group = group;
                this.vertexOffset = vertexOffset;
                this.drawMode = drawMode;
                this.indexOffset = indexOffset;
                this.indexCount = indexCount;
                this.material = material;
                this.transform = transform;
            }
            MeshHandle.prototype.clone = function (newTransform, newMaterial) {
                return new MeshHandle(this.group, this.vertexOffset, this.drawMode, this.indexOffset, this.indexCount, newMaterial || this.material, newTransform);
            };
            MeshHandle.prototype.compareTo = function (other) {
                var thisProg = this.material.program;
                var otherProg = other.material.program;
                var progComp = thisProg.compareTo(otherProg);
                if (progComp !== 0)
                    return progComp;
                if (this.transform !== other.transform) {
                    if (this.transform == null)
                        return -1;
                    if (other.transform == null)
                        return 1;
                    return this.transform.id - other.transform.id;
                }
                var matComp = thisProg.compareMaterials(this.material, other.material);
                if (matComp !== 0)
                    return matComp;
                var groupComp = this.group.compareTo(other.group);
                if (groupComp !== 0)
                    return groupComp;
                return this.indexOffset - other.indexOffset;
            };
            MeshHandle.undefinedHandle = new MeshHandle(undefined, undefined, undefined, undefined, undefined, undefined, undefined);
            return MeshHandle;
        }());
        WebGame.MeshHandle = MeshHandle;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var MeshManager = (function () {
            function MeshManager(game) {
                this.groups = [];
                this.context = game.context;
                this.game = game;
            }
            MeshManager.decompress = function (compressed) {
                var attribs = [];
                for (var i = 0, iEnd = compressed.attributes.length; i < iEnd; ++i) {
                    var attrib = compressed.attributes[i];
                    attribs.push(typeof attrib === "string" ? WebGame.VertexAttribute[attrib] : attrib);
                }
                return {
                    attributes: attribs,
                    elements: compressed.elements,
                    vertices: Facepunch.Utils.decompress(compressed.vertices),
                    indices: Facepunch.Utils.decompress(compressed.indices)
                };
            };
            MeshManager.clone = function (data) {
                return {
                    attributes: data.attributes,
                    elements: data.elements,
                    vertices: data.vertices.slice(),
                    indices: data.indices
                };
            };
            MeshManager.getAttributeOffset = function (attribs, attrib) {
                var length = 0;
                for (var i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    if (attrib.id === attribs[i].id)
                        return length;
                    length += attribs[i].size;
                }
                return undefined;
            };
            MeshManager.getVertexLength = function (attribs) {
                var length = 0;
                for (var i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    length += attribs[i].size;
                }
                return length;
            };
            MeshManager.transform3F = function (data, attrib, action) {
                if (attrib.size !== 3)
                    throw new Error("Expected the given attribute to be of size 3.");
                var attribOffset = MeshManager.getAttributeOffset(data.attributes, attrib);
                if (attribOffset === undefined)
                    return;
                var verts = data.vertices;
                var length = data.vertices.length;
                var vertLength = MeshManager.getVertexLength(data.attributes);
                var normalized = attrib.normalized;
                var vec = new Facepunch.Vector3();
                for (var i = attribOffset; i < length; i += vertLength) {
                    vec.set(verts[i], verts[i + 1], verts[i + 2]);
                    action(vec);
                    if (normalized)
                        vec.normalize();
                    verts[i] = vec.x;
                    verts[i + 1] = vec.y;
                    verts[i + 2] = vec.z;
                }
            };
            MeshManager.transform4F = function (data, attrib, action, defaultW) {
                if (defaultW === void 0) { defaultW = 1; }
                if (attrib.size !== 3 && attrib.size !== 4)
                    throw new Error("Expected the given attribute to be of size 3 or 4.");
                var attribOffset = MeshManager.getAttributeOffset(data.attributes, attrib);
                if (attribOffset === undefined)
                    return;
                var verts = data.vertices;
                var length = data.vertices.length;
                var vertLength = MeshManager.getVertexLength(data.attributes);
                var normalized = attrib.normalized;
                var vec = new Facepunch.Vector4();
                if (attrib.size === 3) {
                    for (var i = attribOffset; i < length; i += vertLength) {
                        vec.set(verts[i], verts[i + 1], verts[i + 2], defaultW);
                        action(vec);
                        if (normalized)
                            vec.normalizeXyz();
                        verts[i] = vec.x;
                        verts[i + 1] = vec.y;
                        verts[i + 2] = vec.z;
                    }
                }
                else if (attrib.size === 4) {
                    for (var i = attribOffset; i < length; i += vertLength) {
                        vec.set(verts[i], verts[i + 1], verts[i + 2], verts[i + 3]);
                        action(vec);
                        if (normalized)
                            vec.normalize();
                        verts[i] = vec.x;
                        verts[i + 1] = vec.y;
                        verts[i + 2] = vec.z;
                        verts[i + 3] = vec.w;
                    }
                }
            };
            MeshManager.prototype.addMeshData = function (data, getMaterial, target) {
                if (target == null) {
                    target = [];
                }
                for (var i = 0, iEnd = this.groups.length; i < iEnd; ++i) {
                    var group = this.groups[i];
                    if (group.canAddMeshData(data)) {
                        group.addMeshData(data, getMaterial, target);
                        return target;
                    }
                }
                var newGroup = new WebGame.MeshGroup(this.context, data.attributes);
                this.groups.push(newGroup);
                newGroup.addMeshData(data, getMaterial, target);
                return target;
            };
            MeshManager.prototype.getComposeFrameMeshHandle = function () {
                if (this.composeFrameHandle != null)
                    return this.composeFrameHandle;
                var meshData = {
                    attributes: [WebGame.VertexAttribute.uv],
                    vertices: [-1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0],
                    indices: [0, 1, 2, 0, 2, 3],
                    elements: [
                        {
                            mode: WebGame.DrawMode.Triangles,
                            material: this.game.shaders.createMaterial(Facepunch.WebGame.Shaders.ComposeFrame),
                            indexOffset: 0,
                            indexCount: 6
                        }
                    ]
                };
                this.composeFrameHandle = this.addMeshData(meshData)[0];
                return this.composeFrameHandle;
            };
            MeshManager.prototype.dispose = function () {
                for (var i = 0; i < this.groups.length; ++i) {
                    this.groups[i].dispose();
                }
                this.groups.splice(0, this.groups.length);
            };
            return MeshManager;
        }());
        WebGame.MeshManager = MeshManager;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Model = (function () {
            function Model(meshManager, materialLoader) {
                this.onLoadCallbacks = [];
                this.meshManager = meshManager;
                this.materialLoader = materialLoader;
            }
            Model.prototype.addOnLoadCallback = function (callback) {
                if (this.isLoaded()) {
                    callback(this);
                }
                else {
                    this.onLoadCallbacks.push(callback);
                }
            };
            Model.prototype.dispatchOnLoadCallbacks = function () {
                if (!this.isLoaded()) {
                    throw new Error("Model attempted to dispatch onLoad callbacks without any mesh data.");
                }
                for (var i = 0, iEnd = this.onLoadCallbacks.length; i < iEnd; ++i) {
                    this.onLoadCallbacks[i](this);
                }
                this.onLoadCallbacks.splice(0, this.onLoadCallbacks.length);
            };
            return Model;
        }());
        WebGame.Model = Model;
        var ModelLoadable = (function (_super) {
            __extends(ModelLoadable, _super);
            function ModelLoadable(game, url) {
                _super.call(this, game.meshes, game.materialLoader);
                this.url = url;
            }
            ModelLoadable.prototype.isLoaded = function () {
                return this.meshData != null;
            };
            ModelLoadable.prototype.getMaterial = function (index) {
                return this.materials[index];
            };
            ModelLoadable.prototype.getMeshData = function () {
                return this.meshData;
            };
            ModelLoadable.prototype.getMeshHandles = function () {
                var _this = this;
                if (this.handles != null)
                    return this.handles;
                return this.handles = this.meshManager.addMeshData(this.meshData, function (i) { return _this.getMaterial(i); });
            };
            ModelLoadable.prototype.loadNext = function (callback) {
                var _this = this;
                if (this.isLoaded()) {
                    callback(false);
                    return;
                }
                Facepunch.Http.getJson(this.url, function (info) {
                    var materials = [];
                    for (var i = 0, iEnd = info.materials.length; i < iEnd; ++i) {
                        var matUrl = Facepunch.Http.getAbsUrl(info.materials[i], _this.url);
                        materials[i] = _this.materialLoader.load(matUrl);
                    }
                    _this.materials = materials;
                    _this.meshData = WebGame.MeshManager.decompress(info.meshData);
                    _this.dispatchOnLoadCallbacks();
                    callback(false);
                }, function (error) {
                    console.error("Failed to load material " + _this.url + ": " + error);
                    callback(false);
                });
            };
            return ModelLoadable;
        }(Model));
        WebGame.ModelLoadable = ModelLoadable;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ModelLoader = (function (_super) {
            __extends(ModelLoader, _super);
            function ModelLoader(game) {
                _super.call(this);
                this.game = game;
            }
            ModelLoader.prototype.onCreateItem = function (url) {
                return new WebGame.ModelLoadable(this.game, url);
            };
            return ModelLoader;
        }(Facepunch.Loader));
        WebGame.ModelLoader = ModelLoader;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var RenderContext = (function () {
            function RenderContext(game) {
                var _this = this;
                this.drawListInvalid = true;
                this.commandBufferInvalid = true;
                this.game = game;
                this.fog = new WebGame.Fog(this);
                this.drawList = new WebGame.DrawList(this);
                this.commandBuffer = new WebGame.CommandBuffer(game.context);
                this.game.addDrawListInvalidationHandler(function (geom) { return _this.invalidate(); });
            }
            RenderContext.prototype.getOpaqueColorTexture = function () {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getColorTexture();
            };
            RenderContext.prototype.getOpaqueDepthTexture = function () {
                return this.opaqueFrameBuffer == null ? null : this.opaqueFrameBuffer.getDepthTexture();
            };
            RenderContext.prototype.invalidate = function () {
                this.drawListInvalid = true;
                this.commandBufferInvalid = true;
            };
            RenderContext.prototype.render = function (camera) {
                if (this.drawListInvalid) {
                    this.commandBufferInvalid = true;
                    this.drawList.clear();
                    this.game.populateDrawList(this.drawList, camera);
                }
                if (this.commandBufferInvalid) {
                    this.commandBuffer.clearCommands();
                    this.drawList.appendToBuffer(this.commandBuffer, this);
                }
                camera.populateCommandBufferParameters(this.commandBuffer);
                this.populateCommandBufferParameters(this.commandBuffer);
                this.commandBuffer.run();
            };
            RenderContext.prototype.populateCommandBufferParameters = function (buf) {
                this.game.populateCommandBufferParameters(buf);
                this.fog.populateCommandBufferParameters(buf);
                buf.setParameter(RenderContext.opaqueColorParam, this.getOpaqueColorTexture());
                buf.setParameter(RenderContext.opaqueDepthParam, this.getOpaqueDepthTexture());
            };
            RenderContext.prototype.setupFrameBuffers = function () {
                if (this.opaqueFrameBuffer !== undefined)
                    return;
                var gl = this.game.context;
                var width = this.game.getWidth();
                var height = this.game.getHeight();
                this.opaqueFrameBuffer = new WebGame.FrameBuffer(gl, width, height);
                this.opaqueFrameBuffer.addDepthAttachment();
            };
            RenderContext.prototype.bufferOpaqueTargetBegin = function (buf) {
                this.setupFrameBuffers();
                var gl = WebGLRenderingContext;
                buf.bindFramebuffer(this.opaqueFrameBuffer, true);
                buf.depthMask(true);
                buf.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
            };
            RenderContext.prototype.bufferRenderTargetEnd = function (buf) {
                buf.bindFramebuffer(null);
            };
            RenderContext.prototype.getDrawCallCount = function () {
                return this.drawList.getDrawCalls();
            };
            RenderContext.opaqueColorParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
            RenderContext.opaqueDepthParam = new WebGame.CommandBufferParameter(WebGame.UniformType.Texture);
            return RenderContext;
        }());
        WebGame.RenderContext = RenderContext;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ShaderManager = (function () {
            function ShaderManager(context) {
                this.namedPrograms = {};
                this.ctorPrograms = [];
                this.context = context;
            }
            ShaderManager.prototype.resetUniformCache = function () {
                for (var name_4 in this.namedPrograms) {
                    if (this.namedPrograms.hasOwnProperty(name_4)) {
                        this.namedPrograms[name_4].resetUniformCache();
                    }
                }
            };
            ShaderManager.prototype.getFromName = function (name) {
                var program = this.namedPrograms[name];
                if (program !== undefined)
                    return program;
                var nameParts = name.split(".");
                var target = window;
                for (var i = 0; i < nameParts.length; ++i) {
                    target = target[nameParts[i]];
                }
                var Type = target;
                if (Type === undefined)
                    throw "Unknown shader name '" + name + "'.";
                return this.namedPrograms[name] = this.getFromCtor(Type);
            };
            ShaderManager.prototype.getFromCtor = function (ctor) {
                for (var i = 0, iEnd = this.ctorPrograms.length; i < iEnd; ++i) {
                    var ctorProgram = this.ctorPrograms[i];
                    if (ctorProgram.ctor === ctor)
                        return ctorProgram.program;
                }
                var program = new ctor(this.context);
                this.ctorPrograms.push({ ctor: ctor, program: program });
                return program;
            };
            ShaderManager.prototype.get = function (nameOrCtor) {
                if (typeof name === "string") {
                    return this.getFromName(nameOrCtor);
                }
                else {
                    return this.getFromCtor(nameOrCtor);
                }
            };
            ShaderManager.prototype.createMaterial = function (ctor) {
                return new WebGame.Material(this.getFromCtor(ctor));
            };
            ShaderManager.prototype.dispose = function () {
                for (var name_5 in this.namedPrograms) {
                    if (this.namedPrograms.hasOwnProperty(name_5)) {
                        this.namedPrograms[name_5].dispose();
                    }
                }
                this.namedPrograms = {};
            };
            return ShaderManager;
        }());
        WebGame.ShaderManager = ShaderManager;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var ShaderProgram = (function () {
            function ShaderProgram(context) {
                var _this = this;
                this.id = ShaderProgram.nextId++;
                this.compiled = false;
                this.vertIncludes = [];
                this.fragIncludes = [];
                this.nextTextureUnit = 0;
                this.attribNames = {};
                this.attribIds = [];
                this.attribLocations = {};
                this.attribStates = {};
                this.uniforms = [];
                this.sortOrder = 0;
                this.context = context;
                this.toString = function () { return _this.constructor.name; };
            }
            ShaderProgram.prototype.createMaterialProperties = function () {
                return {};
            };
            ShaderProgram.prototype.reserveNextTextureUnit = function () {
                return this.nextTextureUnit++;
            };
            ShaderProgram.prototype.resetUniformCache = function () {
                for (var i = 0; i < this.uniforms.length; ++i) {
                    this.uniforms[i].reset();
                }
            };
            ShaderProgram.prototype.dispose = function () {
                if (this.program !== undefined) {
                    this.context.deleteProgram(this.program);
                    this.program = undefined;
                }
            };
            ShaderProgram.prototype.compareTo = function (other) {
                if (other === this)
                    return 0;
                var orderCompare = this.sortOrder - other.sortOrder;
                if (orderCompare !== 0)
                    return orderCompare;
                return this.id - other.id;
            };
            ShaderProgram.prototype.compareMaterials = function (a, b) {
                return a.id - b.id;
            };
            ShaderProgram.prototype.getProgram = function () {
                if (this.program === undefined) {
                    return this.program = this.context.createProgram();
                }
                return this.program;
            };
            ShaderProgram.prototype.bufferAttribPointer = function (buf, attrib, stride, offset) {
                var loc = this.attribLocations[attrib.id];
                if (loc === undefined)
                    return;
                buf.vertexAttribPointer(loc, attrib.size, attrib.type, attrib.normalized, stride, offset);
            };
            ShaderProgram.prototype.isCompiled = function () {
                return this.compiled;
            };
            ShaderProgram.prototype.addAttribute = function (name, attrib) {
                this.attribNames[name] = attrib;
            };
            ShaderProgram.prototype.addUniform = function (name, ctor) {
                var uniform = new ctor(this, name);
                this.uniforms.push(uniform);
                return uniform;
            };
            ShaderProgram.formatSource = function (source) {
                var lines = source.replace(/\r\n/g, "\n").split("\n");
                while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
                    lines.splice(lines.length - 1, 1);
                }
                while (lines.length > 0 && lines[0].trim().length === 0) {
                    lines.splice(0, 1);
                }
                if (lines.length === 0)
                    return "";
                var indentLength = 0;
                var firstLine = lines[0];
                for (var i = 0, iEnd = firstLine.length; i < iEnd; ++i) {
                    if (firstLine.charAt(i) === " ") {
                        ++indentLength;
                    }
                    else
                        break;
                }
                for (var i = 0, iEnd = lines.length; i < iEnd; ++i) {
                    var line = lines[i];
                    if (line.substr(0, indentLength).trim().length === 0) {
                        lines[i] = line.substr(indentLength);
                    }
                }
                return lines.join("\r\n");
            };
            ShaderProgram.prototype.includeShaderSource = function (type, source) {
                source = ShaderProgram.formatSource(source);
                switch (type) {
                    case WebGLRenderingContext.VERTEX_SHADER:
                        this.vertIncludes.push(source);
                        break;
                    case WebGLRenderingContext.FRAGMENT_SHADER:
                        this.fragIncludes.push(source);
                        break;
                }
            };
            ShaderProgram.prototype.compileShader = function (type, source) {
                var gl = this.context;
                var shader = gl.createShader(type);
                gl.shaderSource(shader, source);
                gl.compileShader(shader);
                if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                    var error = "Shader compilation error:\n" + gl.getShaderInfoLog(shader);
                    gl.deleteShader(shader);
                    console.log(source);
                    throw error;
                }
                return shader;
            };
            ShaderProgram.prototype.findAttribLocation = function (name, attrib) {
                var gl = this.context;
                var loc = gl.getAttribLocation(this.program, name);
                if (loc === -1) {
                    console.warn("Unable to find attribute with name '" + name + "'.");
                    return;
                }
                this.attribIds.push(attrib.id);
                this.attribLocations[attrib.id] = loc;
                this.attribStates[attrib.id] = false;
            };
            ShaderProgram.prototype.compile = function () {
                if (this.isCompiled()) {
                    throw new Error("ShaderProgram is already compiled.");
                }
                var gl = this.context;
                var vertSource = this.vertIncludes.join("\r\n\r\n");
                var fragSource = this.fragIncludes.join("\r\n\r\n");
                var vert = this.compileShader(gl.VERTEX_SHADER, vertSource);
                var frag = this.compileShader(gl.FRAGMENT_SHADER, fragSource);
                var prog = this.getProgram();
                gl.attachShader(prog, vert);
                gl.attachShader(prog, frag);
                gl.linkProgram(prog);
                gl.deleteShader(vert);
                gl.deleteShader(frag);
                if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
                    throw "Program linking error: " + gl.getProgramInfoLog(prog);
                }
                for (var name_6 in this.attribNames) {
                    if (this.attribNames.hasOwnProperty(name_6)) {
                        this.findAttribLocation(name_6, this.attribNames[name_6]);
                    }
                }
                this.compiled = true;
            };
            ShaderProgram.prototype.bufferEnableAttributes = function (buf, attribs) {
                for (var i = this.attribIds.length - 1; i >= 0; --i) {
                    var id = this.attribIds[i];
                    if (!this.attribStates[id])
                        continue;
                    var found = false;
                    if (attribs != null) {
                        for (var j = 0, jEnd = attribs.length; j < jEnd; ++j) {
                            if (attribs[j].id == id) {
                                found = true;
                                break;
                            }
                        }
                    }
                    if (!found) {
                        this.attribStates[id] = false;
                        buf.disableVertexAttribArray(this.attribLocations[id]);
                    }
                }
                if (attribs == null)
                    return;
                for (var i = 0, iEnd = attribs.length; i < iEnd; ++i) {
                    var attrib = attribs[i];
                    if (this.attribStates[attrib.id] === false) {
                        this.attribStates[attrib.id] = true;
                        buf.enableVertexAttribArray(this.attribLocations[attrib.id]);
                    }
                }
            };
            ShaderProgram.prototype.bufferDisableAttributes = function (buf) {
                this.bufferEnableAttributes(buf, null);
            };
            ShaderProgram.prototype.bufferSetup = function (buf, context) {
                buf.useProgram(this);
            };
            ShaderProgram.prototype.bufferModelMatrix = function (buf, value) { };
            ShaderProgram.prototype.bufferMaterial = function (buf, material) { };
            ShaderProgram.nextId = 0;
            return ShaderProgram;
        }());
        WebGame.ShaderProgram = ShaderProgram;
        var BaseMaterialProps = (function () {
            function BaseMaterialProps() {
                this.noCull = false;
            }
            return BaseMaterialProps;
        }());
        WebGame.BaseMaterialProps = BaseMaterialProps;
        var BaseShaderProgram = (function (_super) {
            __extends(BaseShaderProgram, _super);
            function BaseShaderProgram(context, ctor) {
                _super.call(this, context);
                this.materialPropsCtor = ctor;
            }
            BaseShaderProgram.prototype.createMaterialProperties = function () {
                return new this.materialPropsCtor();
            };
            BaseShaderProgram.prototype.bufferMaterial = function (buf, material) {
                this.bufferMaterialProps(buf, material.properties);
            };
            BaseShaderProgram.prototype.bufferMaterialProps = function (buf, props) {
                var gl = this.context;
                if (props.noCull) {
                    buf.disable(gl.CULL_FACE);
                }
                else {
                    buf.enable(gl.CULL_FACE);
                }
            };
            return BaseShaderProgram;
        }(ShaderProgram));
        WebGame.BaseShaderProgram = BaseShaderProgram;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var ComposeFrame = (function (_super) {
                __extends(ComposeFrame, _super);
                function ComposeFrame(context) {
                    _super.call(this, context);
                    var gl = context;
                    this.includeShaderSource(gl.VERTEX_SHADER, ComposeFrame.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, ComposeFrame.fragSource);
                    this.addAttribute("aScreenPos", WebGame.VertexAttribute.uv);
                    this.frameColor = this.addUniform("uFrameColor", WebGame.UniformSampler);
                    this.frameDepth = this.addUniform("uFrameDepth", WebGame.UniformSampler);
                    this.compile();
                }
                ComposeFrame.prototype.bufferSetup = function (buf, context) {
                    _super.prototype.bufferSetup.call(this, buf, context);
                    this.frameColor.bufferValue(buf, context.getOpaqueColorTexture());
                    this.frameDepth.bufferValue(buf, context.getOpaqueDepthTexture());
                };
                ComposeFrame.vertSource = "\n                    attribute vec2 aScreenPos;\n\n                    varying vec2 vScreenPos;\n\n                    void main()\n                    {\n                        vScreenPos = aScreenPos * 0.5 + vec2(0.5, 0.5);\n                        gl_Position = vec4(aScreenPos, 0, 1);\n                    }";
                ComposeFrame.fragSource = "\n                    #extension GL_EXT_frag_depth : enable\n\n                    precision mediump float;\n\n                    varying vec2 vScreenPos;\n\n                    uniform sampler2D uFrameColor;\n                    uniform sampler2D uFrameDepth;\n\n                    void main()\n                    {\n                        gl_FragColor = texture2D(uFrameColor, vScreenPos);\n                        gl_FragDepthEXT = texture2D(uFrameDepth, vScreenPos).r;\n                    }";
                return ComposeFrame;
            }(WebGame.ShaderProgram));
            Shaders.ComposeFrame = ComposeFrame;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var ModelBaseMaterialProps = (function (_super) {
                __extends(ModelBaseMaterialProps, _super);
                function ModelBaseMaterialProps() {
                    _super.apply(this, arguments);
                    this.baseTexture = null;
                    this.noFog = false;
                    this.translucent = false;
                }
                return ModelBaseMaterialProps;
            }(WebGame.BaseMaterialProps));
            Shaders.ModelBaseMaterialProps = ModelBaseMaterialProps;
            var ModelBase = (function (_super) {
                __extends(ModelBase, _super);
                function ModelBase(context, ctor) {
                    _super.call(this, context, ctor);
                    var gl = context;
                    this.includeShaderSource(gl.VERTEX_SHADER, ModelBase.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, ModelBase.fragSource);
                    this.addAttribute("aPosition", WebGame.VertexAttribute.position);
                    this.addAttribute("aTextureCoord", WebGame.VertexAttribute.uv);
                    this.projectionMatrix = this.addUniform("uProjection", WebGame.UniformMatrix4);
                    this.viewMatrix = this.addUniform("uView", WebGame.UniformMatrix4);
                    this.modelMatrix = this.addUniform("uModel", WebGame.UniformMatrix4);
                    this.baseTexture = this.addUniform("uBaseTexture", WebGame.UniformSampler);
                    this.baseTexture.setDefault(WebGame.TextureUtils.getErrorTexture(context));
                    this.time = this.addUniform("uTime", WebGame.Uniform4F);
                    this.fogParams = this.addUniform("uFogParams", WebGame.Uniform4F);
                    this.fogColor = this.addUniform("uFogColor", WebGame.Uniform3F);
                    this.noFog = this.addUniform("uNoFog", WebGame.Uniform1F);
                }
                ModelBase.prototype.bufferSetup = function (buf, context) {
                    _super.prototype.bufferSetup.call(this, buf, context);
                    this.projectionMatrix.bufferParameter(buf, WebGame.Camera.projectionMatrixParam);
                    this.viewMatrix.bufferParameter(buf, WebGame.Camera.viewMatrixParam);
                    this.time.bufferParameter(buf, WebGame.Game.timeInfoParam);
                    this.fogParams.bufferParameter(buf, WebGame.Fog.fogInfoParam);
                    this.fogColor.bufferParameter(buf, WebGame.Fog.fogColorParam);
                };
                ModelBase.prototype.bufferModelMatrix = function (buf, value) {
                    _super.prototype.bufferModelMatrix.call(this, buf, value);
                    this.modelMatrix.bufferValue(buf, false, value);
                };
                ModelBase.prototype.bufferMaterialProps = function (buf, props) {
                    _super.prototype.bufferMaterialProps.call(this, buf, props);
                    this.baseTexture.bufferValue(buf, props.baseTexture);
                    this.noFog.bufferValue(buf, props.noFog ? 1 : 0);
                    var gl = this.context;
                    buf.enable(gl.DEPTH_TEST);
                    if (props.translucent) {
                        buf.depthMask(false);
                        buf.enable(gl.BLEND);
                        buf.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                    }
                    else {
                        buf.depthMask(true);
                        buf.disable(gl.BLEND);
                    }
                };
                ModelBase.vertSource = "\n                    attribute vec3 aPosition;\n                    attribute vec2 aTextureCoord;\n\n                    varying float vDepth;\n                    varying vec2 vTextureCoord;\n\n                    uniform mat4 uProjection;\n                    uniform mat4 uView;\n                    uniform mat4 uModel;\n\n                    void Base_main()\n                    {\n                        vec4 viewPos = uView * uModel * vec4(aPosition, 1.0);\n\n                        gl_Position = uProjection * viewPos;\n                        \n                        vDepth = -viewPos.z;\n                        vTextureCoord = aTextureCoord;\n                    }";
                ModelBase.fragSource = "\n                    precision mediump float;\n\n                    varying float vDepth;\n                    varying vec2 vTextureCoord;\n\n                    uniform sampler2D uBaseTexture;\n\n                    // x: time in seconds, y, z, w: unused\n                    uniform vec4 uTime;\n\n                    // x: near fog density, y: far plane fog density, z: min density, w: max density\n                    uniform vec4 uFogParams;\n                    uniform vec3 uFogColor;\n                    uniform float uNoFog;\n\n                    vec3 ApplyFog(vec3 inColor)\n                    {\n                        if (uNoFog > 0.5) return inColor;\n\n                        float fogDensity = uFogParams.x + uFogParams.y * vDepth;\n\n                        fogDensity = min(max(fogDensity, uFogParams.z), uFogParams.w);\n\n                        return mix(inColor, uFogColor, fogDensity);\n                    }";
                return ModelBase;
            }(WebGame.BaseShaderProgram));
            Shaders.ModelBase = ModelBase;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Shaders;
        (function (Shaders) {
            var VertexLitGenericMaterialProps = (function (_super) {
                __extends(VertexLitGenericMaterialProps, _super);
                function VertexLitGenericMaterialProps() {
                    _super.apply(this, arguments);
                    this.alpha = 1.0;
                    this.alphaTest = false;
                }
                return VertexLitGenericMaterialProps;
            }(Shaders.ModelBaseMaterialProps));
            Shaders.VertexLitGenericMaterialProps = VertexLitGenericMaterialProps;
            var VertexLitGeneric = (function (_super) {
                __extends(VertexLitGeneric, _super);
                function VertexLitGeneric(context) {
                    _super.call(this, context, VertexLitGenericMaterialProps);
                    var gl = context;
                    this.addAttribute("aColor", WebGame.VertexAttribute.rgb);
                    this.includeShaderSource(gl.VERTEX_SHADER, VertexLitGeneric.vertSource);
                    this.includeShaderSource(gl.FRAGMENT_SHADER, VertexLitGeneric.fragSource);
                    this.alpha = this.addUniform("uAlpha", WebGame.Uniform1F);
                    this.alphaTest = this.addUniform("uAlphaTest", WebGame.Uniform1F);
                    this.translucent = this.addUniform("uTranslucent", WebGame.Uniform1F);
                    this.compile();
                }
                VertexLitGeneric.prototype.bufferMaterialProps = function (buf, props) {
                    _super.prototype.bufferMaterialProps.call(this, buf, props);
                    this.alpha.bufferValue(buf, props.alpha);
                    this.alphaTest.bufferValue(buf, props.alphaTest ? 1 : 0);
                    this.translucent.bufferValue(buf, props.translucent ? 1 : 0);
                };
                VertexLitGeneric.vertSource = "\n                    attribute vec3 aColor;\n\n                    varying vec3 vColor;\n\n                    void main()\n                    {\n                        Base_main();\n                        vColor = aColor * (1.0 / 255.0);\n                    }";
                VertexLitGeneric.fragSource = "\n                    varying vec3 vColor;\n\n                    uniform float uAlpha;\n\n                    uniform float uAlphaTest;\n                    uniform float uTranslucent;\n\n                    void main()\n                    {\n                        vec4 texSample = texture2D(uBaseTexture, vTextureCoord);\n                        if (texSample.a < uAlphaTest - 0.5) discard;\n\n                        vec3 color = ApplyFog(texSample.rgb * vColor);\n\n                        gl_FragColor = vec4(color, mix(1.0, texSample.a, uTranslucent) * uAlpha);\n                    }";
                return VertexLitGeneric;
            }(Shaders.ModelBase));
            Shaders.VertexLitGeneric = VertexLitGeneric;
        })(Shaders = WebGame.Shaders || (WebGame.Shaders = {}));
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var StaticProp = (function (_super) {
            __extends(StaticProp, _super);
            function StaticProp() {
                _super.call(this);
                this.drawable = new WebGame.DrawListItem();
                this.drawable.entity = this;
                this.drawable.isStatic = true;
            }
            StaticProp.prototype.setColorTint = function (color) {
                if (this.tint != null)
                    this.tint.copy(color);
                else
                    this.tint = new Facepunch.Vector3().copy(color);
            };
            StaticProp.prototype.setModel = function (model) {
                var _this = this;
                if (this.model === model)
                    return;
                this.model = model;
                if (model == null) {
                    this.drawable.clearMeshHandles();
                    return;
                }
                model.addOnLoadCallback(function (mdl) { return _this.onModelLoaded(mdl); });
            };
            StaticProp.prototype.onModelLoaded = function (model) {
                var _this = this;
                if (model !== this.model)
                    return;
                this.drawable.clearMeshHandles();
                var meshData = WebGame.MeshManager.clone(model.getMeshData());
                var transform = this.getMatrix();
                WebGame.MeshManager.transform4F(meshData, WebGame.VertexAttribute.position, function (pos) { return pos.applyMatrix4(transform); }, 1);
                WebGame.MeshManager.transform4F(meshData, WebGame.VertexAttribute.normal, function (norm) { return norm.applyMatrix4(transform); }, 0);
                if (this.tint != null) {
                    WebGame.MeshManager.transform3F(meshData, WebGame.VertexAttribute.rgb, function (rgb) { return rgb.multiply(_this.tint); });
                }
                this.drawable.addMeshHandles(model.meshManager.addMeshData(meshData, function (index) { return model.getMaterial(index); }));
            };
            StaticProp.prototype.getModel = function () {
                return this.model;
            };
            StaticProp.prototype.getIsVisible = function () {
                return this.drawable.getIsVisible();
            };
            StaticProp.prototype.getIsInDrawList = function (drawList) {
                return this.drawable.getIsInDrawList(drawList);
            };
            StaticProp.prototype.onAddToDrawList = function (list) {
                this.drawable.onAddToDrawList(list);
            };
            StaticProp.prototype.onRemoveFromDrawList = function (list) {
                this.drawable.onRemoveFromDrawList(list);
            };
            StaticProp.prototype.getMeshHandles = function () {
                return this.drawable.getMeshHandles();
            };
            return StaticProp;
        }(WebGame.Entity));
        WebGame.StaticProp = StaticProp;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Texture = (function () {
            function Texture() {
                this.id = Texture.nextId++;
            }
            Texture.prototype.isLoaded = function () {
                return this.getHandle() !== undefined;
            };
            Texture.prototype.dispose = function () { };
            Texture.nextId = 1;
            return Texture;
        }());
        WebGame.Texture = Texture;
        (function (TextureFormat) {
            TextureFormat[TextureFormat["Rgb"] = WebGLRenderingContext.RGB] = "Rgb";
            TextureFormat[TextureFormat["Rgba"] = WebGLRenderingContext.RGBA] = "Rgba";
            TextureFormat[TextureFormat["DepthComponent"] = WebGLRenderingContext.DEPTH_COMPONENT] = "DepthComponent";
        })(WebGame.TextureFormat || (WebGame.TextureFormat = {}));
        var TextureFormat = WebGame.TextureFormat;
        (function (TextureDataType) {
            TextureDataType[TextureDataType["Uint8"] = WebGLRenderingContext.UNSIGNED_BYTE] = "Uint8";
            TextureDataType[TextureDataType["Uint16"] = WebGLRenderingContext.UNSIGNED_SHORT] = "Uint16";
            TextureDataType[TextureDataType["Uint32"] = WebGLRenderingContext.UNSIGNED_INT] = "Uint32";
            TextureDataType[TextureDataType["Float"] = WebGLRenderingContext.FLOAT] = "Float";
        })(WebGame.TextureDataType || (WebGame.TextureDataType = {}));
        var TextureDataType = WebGame.TextureDataType;
        (function (TextureTarget) {
            TextureTarget[TextureTarget["Texture2D"] = WebGLRenderingContext.TEXTURE_2D] = "Texture2D";
            TextureTarget[TextureTarget["TextureCubeMap"] = WebGLRenderingContext.TEXTURE_CUBE_MAP] = "TextureCubeMap";
        })(WebGame.TextureTarget || (WebGame.TextureTarget = {}));
        var TextureTarget = WebGame.TextureTarget;
        (function (TextureWrapMode) {
            TextureWrapMode[TextureWrapMode["ClampToEdge"] = WebGLRenderingContext.CLAMP_TO_EDGE] = "ClampToEdge";
            TextureWrapMode[TextureWrapMode["Repeat"] = WebGLRenderingContext.REPEAT] = "Repeat";
            TextureWrapMode[TextureWrapMode["MirroredRepeat"] = WebGLRenderingContext.MIRRORED_REPEAT] = "MirroredRepeat";
        })(WebGame.TextureWrapMode || (WebGame.TextureWrapMode = {}));
        var TextureWrapMode = WebGame.TextureWrapMode;
        (function (TextureMinFilter) {
            TextureMinFilter[TextureMinFilter["Nearest"] = WebGLRenderingContext.NEAREST] = "Nearest";
            TextureMinFilter[TextureMinFilter["Linear"] = WebGLRenderingContext.LINEAR] = "Linear";
            TextureMinFilter[TextureMinFilter["NearestMipmapNearest"] = WebGLRenderingContext.NEAREST_MIPMAP_NEAREST] = "NearestMipmapNearest";
            TextureMinFilter[TextureMinFilter["LinearMipmapNearest"] = WebGLRenderingContext.LINEAR_MIPMAP_NEAREST] = "LinearMipmapNearest";
            TextureMinFilter[TextureMinFilter["NearestMipmapLinear"] = WebGLRenderingContext.NEAREST_MIPMAP_LINEAR] = "NearestMipmapLinear";
            TextureMinFilter[TextureMinFilter["LinearMipmapLinear"] = WebGLRenderingContext.LINEAR_MIPMAP_LINEAR] = "LinearMipmapLinear";
        })(WebGame.TextureMinFilter || (WebGame.TextureMinFilter = {}));
        var TextureMinFilter = WebGame.TextureMinFilter;
        (function (TextureMagFilter) {
            TextureMagFilter[TextureMagFilter["Nearest"] = TextureMinFilter.Nearest] = "Nearest";
            TextureMagFilter[TextureMagFilter["Linear"] = TextureMinFilter.Linear] = "Linear";
        })(WebGame.TextureMagFilter || (WebGame.TextureMagFilter = {}));
        var TextureMagFilter = WebGame.TextureMagFilter;
        (function (TextureParameterType) {
            TextureParameterType[TextureParameterType["Integer"] = WebGLRenderingContext.INT] = "Integer";
            TextureParameterType[TextureParameterType["Float"] = WebGLRenderingContext.FLOAT] = "Float";
        })(WebGame.TextureParameterType || (WebGame.TextureParameterType = {}));
        var TextureParameterType = WebGame.TextureParameterType;
        (function (TextureParameter) {
            TextureParameter[TextureParameter["WrapS"] = WebGLRenderingContext.TEXTURE_WRAP_S] = "WrapS";
            TextureParameter[TextureParameter["WrapT"] = WebGLRenderingContext.TEXTURE_WRAP_T] = "WrapT";
            TextureParameter[TextureParameter["MinFilter"] = WebGLRenderingContext.TEXTURE_MIN_FILTER] = "MinFilter";
            TextureParameter[TextureParameter["MagFilter"] = WebGLRenderingContext.TEXTURE_MAG_FILTER] = "MagFilter";
        })(WebGame.TextureParameter || (WebGame.TextureParameter = {}));
        var TextureParameter = WebGame.TextureParameter;
        var RenderTexture = (function (_super) {
            __extends(RenderTexture, _super);
            function RenderTexture(context, target, format, type, width, height) {
                _super.call(this);
                this.context = context;
                this.target = target;
                this.format = format;
                this.type = type;
                this.handle = context.createTexture();
                this.setWrapMode(TextureWrapMode.ClampToEdge);
                this.setFilter(TextureMinFilter.Linear, TextureMagFilter.Nearest);
                this.resize(width, height);
            }
            RenderTexture.prototype.setWrapMode = function (wrapS, wrapT) {
                if (wrapT === undefined)
                    wrapT = wrapS;
                var gl = this.context;
                gl.bindTexture(this.target, this.handle);
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, wrapS);
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, wrapT);
                gl.bindTexture(this.target, null);
            };
            RenderTexture.prototype.setFilter = function (minFilter, magFilter) {
                var gl = this.context;
                gl.bindTexture(this.target, this.handle);
                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, magFilter);
                gl.bindTexture(this.target, null);
            };
            RenderTexture.prototype.getTarget = function () {
                return this.target;
            };
            RenderTexture.prototype.getHandle = function () {
                return this.handle;
            };
            RenderTexture.prototype.resize = function (width, height) {
                if (this.width === width && this.height === height)
                    return;
                var gl = this.context;
                this.width = width;
                this.height = height;
                gl.bindTexture(this.target, this.handle);
                gl.texImage2D(this.target, 0, this.format, width, height, 0, this.format, this.type, null);
                gl.bindTexture(this.target, null);
                this.onResize(width, height);
            };
            RenderTexture.prototype.onResize = function (width, height) { };
            RenderTexture.prototype.dispose = function () {
                if (this.handle === undefined)
                    return;
                this.context.deleteTexture(this.handle);
                this.handle = undefined;
            };
            return RenderTexture;
        }(Texture));
        WebGame.RenderTexture = RenderTexture;
        var Uint8PixelData = (function () {
            function Uint8PixelData(format, width, height) {
                this.width = width;
                this.height = height;
                switch (format) {
                    case TextureFormat.DepthComponent:
                        this.channels = 1;
                        break;
                    case TextureFormat.Rgb:
                        this.channels = 3;
                        break;
                    case TextureFormat.Rgba:
                        this.channels = 4;
                        break;
                    default:
                        throw new Error("Texture format not implemented.");
                }
                this.values = new Uint8Array(this.channels * width * height);
            }
            return Uint8PixelData;
        }());
        WebGame.Uint8PixelData = Uint8PixelData;
        var ProceduralTexture2D = (function (_super) {
            __extends(ProceduralTexture2D, _super);
            function ProceduralTexture2D(context, width, height) {
                _super.call(this, context, TextureTarget.Texture2D, TextureFormat.Rgba, TextureDataType.Uint8, width, height);
                this.setWrapMode(TextureWrapMode.Repeat);
            }
            ProceduralTexture2D.prototype.setPixelRgb = function (x, y, rgb) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = (rgb >> 16) & 0xff;
                buffer[1] = (rgb >> 8) & 0xff;
                buffer[2] = rgb & 0xff;
                buffer[3] = 0xff;
                this.setPixel(x, y, buffer);
            };
            ProceduralTexture2D.prototype.setPixelRgba = function (x, y, rgba) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = (rgba >> 24) & 0xff;
                buffer[1] = (rgba >> 16) & 0xff;
                buffer[2] = (rgba >> 8) & 0xff;
                buffer[3] = rgba & 0xff;
                this.setPixel(x, y, buffer);
            };
            ProceduralTexture2D.prototype.setPixelColor = function (x, y, color) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = color.r;
                buffer[1] = color.g;
                buffer[2] = color.b;
                buffer[3] = color.a === undefined ? 0xff : color.a;
                this.setPixel(x, y, buffer);
            };
            ProceduralTexture2D.prototype.setPixel = function (x, y, channels) {
                var pixels = this.pixels;
                var index = (x + y * pixels.width) * pixels.channels;
                var channelCount = pixels.channels < channels.length
                    ? pixels.channels : channels.length;
                for (var i = 0; i < channelCount; ++i) {
                    pixels.values[index + i] = channels[i];
                }
            };
            ProceduralTexture2D.prototype.getPixelColor = function (x, y, target) {
                var buffer = ProceduralTexture2D.channelBuffer;
                buffer[0] = buffer[1] = buffer[2] = 0;
                buffer[3] = 0xff;
                this.getPixel(x, y, buffer, 0);
                if (target == null)
                    return { r: buffer[0], g: buffer[1], b: buffer[2], a: buffer[3] };
                target.r = buffer[0];
                target.g = buffer[1];
                target.b = buffer[2];
                target.a = buffer[3];
                return target;
            };
            ProceduralTexture2D.prototype.getPixel = function (x, y, target, dstIndex) {
                var pixels = this.pixels;
                if (target == null)
                    target = new Array(pixels.channels);
                if (dstIndex === undefined)
                    dstIndex = 0;
                var index = (x + y * pixels.width) * pixels.channels;
                var channelCount = pixels.channels < target.length
                    ? pixels.channels : target.length;
                for (var i = 0; i < channelCount; ++i) {
                    target[dstIndex + i] = pixels.values[index + i];
                }
                return target;
            };
            ProceduralTexture2D.prototype.setPixels = function (x, y, width, height, values) {
                var pixels = this.pixels;
                if (x < 0 || x + width > pixels.width || y < 0 || y + height > pixels.height) {
                    throw new Error("Image region out of bounds.");
                }
                var imageValues = pixels.values;
                var channels = pixels.channels;
                if (values.length < width * height * channels) {
                    throw new Error("Expected at least " + width * height * channels + " values.");
                }
                var rowLength = pixels.width * channels;
                var scanLength = width * channels;
                var startIndex = (x + y * pixels.width) * channels;
                var i = 0;
                for (var row = y, rowEnd = y + height; row < rowEnd; ++row, startIndex += rowLength) {
                    for (var index = startIndex, indexEnd = index + scanLength; index < indexEnd; index += channels) {
                        imageValues[index] = values[i];
                    }
                }
            };
            ProceduralTexture2D.prototype.apply = function () {
                var gl = this.context;
                gl.bindTexture(this.target, this.getHandle());
                gl.texImage2D(this.target, 0, this.format, this.pixels.width, this.pixels.height, 0, this.format, this.type, this.pixels.values);
                gl.bindTexture(this.target, null);
            };
            ProceduralTexture2D.prototype.applyRegion = function (x, y, width, height) {
                var gl = this.context;
                gl.bindTexture(this.target, this.getHandle());
                gl.texSubImage2D(this.target, 0, x, y, this.pixels.width, this.pixels.height, this.format, this.type, this.pixels.values);
                gl.bindTexture(this.target, null);
            };
            ProceduralTexture2D.prototype.onResize = function (width, height) {
                switch (this.type) {
                    case TextureDataType.Uint8:
                        this.pixels = new Uint8PixelData(this.format, width, height);
                        break;
                    default:
                        throw new Error("Texture data type not implemented.");
                }
            };
            ProceduralTexture2D.channelBuffer = [0, 0, 0, 0];
            return ProceduralTexture2D;
        }(RenderTexture));
        WebGame.ProceduralTexture2D = ProceduralTexture2D;
        var TextureUtils = (function () {
            function TextureUtils() {
            }
            TextureUtils.getWhiteTexture = function (context) {
                if (this.whiteTexture != null)
                    return this.whiteTexture;
                this.whiteTexture = new ProceduralTexture2D(context, 1, 1);
                this.whiteTexture.setPixelRgb(0, 0, 0xffffff);
                this.whiteTexture.apply();
                return this.whiteTexture;
            };
            TextureUtils.getBlackTexture = function (context) {
                if (this.blackTexture != null)
                    return this.blackTexture;
                this.blackTexture = new ProceduralTexture2D(context, 1, 1);
                this.blackTexture.setPixelRgb(0, 0, 0x000000);
                this.blackTexture.apply();
                return this.blackTexture;
            };
            TextureUtils.getTranslucentTexture = function (context) {
                if (this.translucentTexture != null)
                    return this.translucentTexture;
                this.translucentTexture = new ProceduralTexture2D(context, 1, 1);
                this.translucentTexture.setPixelRgba(0, 0, 0x00000000);
                this.translucentTexture.apply();
                return this.translucentTexture;
            };
            TextureUtils.getErrorTexture = function (context) {
                if (this.errorTexture != null)
                    return this.errorTexture;
                var size = 64;
                this.errorTexture = new ProceduralTexture2D(context, size, size);
                for (var y = 0; y < size; ++y) {
                    for (var x = 0; x < size; ++x) {
                        var magenta = ((x >> 4) & 1) === ((y >> 4) & 1);
                        this.errorTexture.setPixelRgb(x, y, magenta ? 0xff00ff : 0x000000);
                    }
                }
                this.errorTexture.apply();
                return this.errorTexture;
            };
            return TextureUtils;
        }());
        WebGame.TextureUtils = TextureUtils;
        (function (TextureFilter) {
            TextureFilter[TextureFilter["Nearest"] = WebGLRenderingContext.NEAREST] = "Nearest";
            TextureFilter[TextureFilter["Linear"] = WebGLRenderingContext.LINEAR] = "Linear";
        })(WebGame.TextureFilter || (WebGame.TextureFilter = {}));
        var TextureFilter = WebGame.TextureFilter;
        var TextureLoadable = (function (_super) {
            __extends(TextureLoadable, _super);
            function TextureLoadable(context, url) {
                _super.call(this);
                this.nextElement = 0;
                this.context = context;
                this.url = url;
                this.toString = function () { return ("url(" + url + ")"); };
            }
            TextureLoadable.prototype.getTarget = function () {
                if (this.info == null)
                    throw new Error("Attempted to get target of an unloaded texture.");
                return this.target;
            };
            TextureLoadable.prototype.getHandle = function () {
                return this.handle;
            };
            TextureLoadable.prototype.getLoadPriority = function () {
                if (this.info == null || this.nextElement >= this.info.elements.length)
                    return 0;
                return 16 - this.info.elements[this.nextElement].level;
            };
            TextureLoadable.prototype.canLoadImmediately = function (index) {
                return this.info.elements != null && index < this.info.elements.length && this.info.elements[index].url == null;
            };
            TextureLoadable.prototype.applyTexParameters = function () {
                var gl = this.context;
                var params = this.info.params;
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, Facepunch.WebGl.decodeConst(params.wrapS, TextureWrapMode.Repeat));
                gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, Facepunch.WebGl.decodeConst(params.wrapT, TextureWrapMode.Repeat));
                this.filter = Facepunch.WebGl.decodeConst(params.filter, TextureFilter.Linear);
                this.mipmap = params.mipmap === undefined ? false : params.mipmap;
                gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.filter);
                gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, this.filter);
            };
            TextureLoadable.prototype.getOrCreateHandle = function () {
                if (this.handle !== undefined)
                    return this.handle;
                var gl = this.context;
                this.handle = gl.createTexture();
                if (this.info.params != null) {
                    gl.bindTexture(this.target, this.handle);
                    this.applyTexParameters();
                    gl.bindTexture(this.target, null);
                }
                return this.handle;
            };
            TextureLoadable.prototype.loadColorElement = function (target, level, color) {
                var width = this.info.width >> level;
                var height = this.info.height >> level;
                var pixelCount = width * height;
                var valuesSize = pixelCount * 4;
                var values = TextureLoadable.pixelBuffer;
                if (values == null || values.length < valuesSize) {
                    values = TextureLoadable.pixelBuffer = new Uint8Array(valuesSize);
                }
                var r = color.r;
                var g = color.g;
                var b = color.b;
                var a = color.a == undefined ? 255 : color.a;
                for (var i = 0; i < pixelCount; ++i) {
                    var index = i * 4;
                    values[index + 0] = r;
                    values[index + 1] = g;
                    values[index + 2] = b;
                    values[index + 3] = a;
                }
                var gl = this.context;
                gl.texImage2D(target, level, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
                if (level > 0) {
                    gl.texImage2D(target, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, values);
                }
                return true;
            };
            TextureLoadable.prototype.loadImageElement = function (target, level, image) {
                var gl = this.context;
                gl.texImage2D(target, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                if (level > 0) {
                    gl.texImage2D(target, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                }
                return true;
            };
            TextureLoadable.prototype.loadElement = function (element, value) {
                var target = Facepunch.WebGl.decodeConst(element.target != undefined ? element.target : this.info.target);
                var handle = this.getOrCreateHandle();
                var gl = this.context;
                gl.bindTexture(this.target, handle);
                var success = false;
                if (element.color != null) {
                    success = this.loadColorElement(target, element.level, element.color);
                }
                else if (value != null) {
                    success = this.loadImageElement(target, element.level, value);
                }
                else {
                    console.error("Attempted to load a null texture element.");
                    success = false;
                }
                if (this.nextElement >= this.info.elements.length && this.mipmap) {
                    var minFilter = this.filter === TextureFilter.Nearest
                        ? TextureMinFilter.NearestMipmapLinear
                        : TextureMinFilter.LinearMipmapLinear;
                    gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, minFilter);
                    gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                }
                gl.bindTexture(this.target, null);
                return success;
            };
            TextureLoadable.prototype.loadNext = function (callback) {
                var _this = this;
                if (this.info == null) {
                    Facepunch.Http.getJson(this.url, function (info) {
                        _this.info = info;
                        _this.target = Facepunch.WebGl.decodeConst(info.target);
                        var handle = _this.getOrCreateHandle();
                        while (_this.canLoadImmediately(_this.nextElement)) {
                            _this.loadElement(info.elements[_this.nextElement++]);
                        }
                        callback(info.elements != null && _this.nextElement < info.elements.length);
                    }, function (error) {
                        console.error("Failed to load texture " + _this.url + ": " + error);
                        callback(false);
                    });
                    return;
                }
                if (this.info.elements == null || this.nextElement >= this.info.elements.length) {
                    callback(false);
                    return;
                }
                var info = this.info;
                var element = info.elements[this.nextElement++];
                var url = Facepunch.Http.getAbsUrl(element.url, this.url);
                Facepunch.Http.getImage(url, function (image) {
                    _this.loadElement(element, image);
                    while (_this.canLoadImmediately(_this.nextElement)) {
                        _this.loadElement(info.elements[_this.nextElement++]);
                    }
                    callback(info.elements != null && _this.nextElement < info.elements.length);
                }, function (error) {
                    callback(false);
                });
            };
            return TextureLoadable;
        }(Texture));
        WebGame.TextureLoadable = TextureLoadable;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var TextureLoader = (function (_super) {
            __extends(TextureLoader, _super);
            function TextureLoader(context) {
                _super.call(this);
                this.context = context;
            }
            TextureLoader.prototype.onComparePriority = function (a, b) {
                return a.getLoadPriority() - b.getLoadPriority();
            };
            TextureLoader.prototype.onCreateItem = function (url) {
                return new WebGame.TextureLoadable(this.context, url);
            };
            return TextureLoader;
        }(Facepunch.Loader));
        WebGame.TextureLoader = TextureLoader;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        var Uniform = (function () {
            function Uniform(program, name) {
                this.isSampler = false;
                this.program = program;
                this.name = name;
                this.context = program.context;
                this.toString = function () { return name; };
            }
            Uniform.prototype.getLocation = function () {
                if (this.location !== undefined)
                    return this.location;
                if (!this.program.isCompiled())
                    return undefined;
                return this.location = this.context.getUniformLocation(this.program.getProgram(), this.name);
            };
            Uniform.prototype.reset = function () {
                this.parameter = undefined;
            };
            Uniform.prototype.bufferParameter = function (buf, param) {
                if (this.parameter === param)
                    return;
                this.parameter = param;
                buf.setUniformParameter(this, param);
            };
            return Uniform;
        }());
        WebGame.Uniform = Uniform;
        var Uniform1F = (function (_super) {
            __extends(Uniform1F, _super);
            function Uniform1F() {
                _super.apply(this, arguments);
            }
            Uniform1F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
            };
            Uniform1F.prototype.bufferValue = function (buf, x) {
                if (this.x === x)
                    return;
                this.x = x;
                buf.setUniform1F(this, x);
            };
            Uniform1F.prototype.set = function (x) {
                this.context.uniform1f(this.getLocation(), x);
            };
            return Uniform1F;
        }(Uniform));
        WebGame.Uniform1F = Uniform1F;
        var Uniform1I = (function (_super) {
            __extends(Uniform1I, _super);
            function Uniform1I() {
                _super.apply(this, arguments);
            }
            Uniform1I.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
            };
            Uniform1I.prototype.bufferValue = function (buf, x) {
                if (this.x === x)
                    return;
                this.x = x;
                buf.setUniform1I(this, x);
            };
            Uniform1I.prototype.set = function (x) {
                this.context.uniform1i(this.getLocation(), x);
            };
            return Uniform1I;
        }(Uniform));
        WebGame.Uniform1I = Uniform1I;
        var Uniform2F = (function (_super) {
            __extends(Uniform2F, _super);
            function Uniform2F() {
                _super.apply(this, arguments);
            }
            Uniform2F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
                this.y = undefined;
            };
            Uniform2F.prototype.bufferValue = function (buf, x, y) {
                if (this.x === x && this.y === y)
                    return;
                this.x = x;
                this.y = y;
                buf.setUniform2F(this, x, y);
            };
            Uniform2F.prototype.set = function (x, y) {
                this.context.uniform2f(this.getLocation(), x, y);
            };
            return Uniform2F;
        }(Uniform));
        WebGame.Uniform2F = Uniform2F;
        var Uniform3F = (function (_super) {
            __extends(Uniform3F, _super);
            function Uniform3F() {
                _super.apply(this, arguments);
            }
            Uniform3F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
                this.y = undefined;
                this.z = undefined;
            };
            Uniform3F.prototype.bufferValue = function (buf, x, y, z) {
                if (this.x === x && this.y === y && this.z === z)
                    return;
                this.x = x;
                this.y = y;
                this.z = z;
                buf.setUniform3F(this, x, y, z);
            };
            Uniform3F.prototype.set = function (x, y, z) {
                this.context.uniform3f(this.getLocation(), x, y, z);
            };
            return Uniform3F;
        }(Uniform));
        WebGame.Uniform3F = Uniform3F;
        var Uniform4F = (function (_super) {
            __extends(Uniform4F, _super);
            function Uniform4F() {
                _super.apply(this, arguments);
            }
            Uniform4F.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.x = undefined;
                this.y = undefined;
                this.z = undefined;
                this.w = undefined;
            };
            Uniform4F.prototype.bufferValue = function (buf, x, y, z, w) {
                if (this.x === x && this.y === y && this.z === z && this.w === w)
                    return;
                this.x = x;
                this.y = y;
                this.z = z;
                this.w = w;
                buf.setUniform4F(this, x, y, z, w);
            };
            Uniform4F.prototype.set = function (x, y, z, w) {
                this.context.uniform4f(this.getLocation(), x, y, z, w);
            };
            return Uniform4F;
        }(Uniform));
        WebGame.Uniform4F = Uniform4F;
        var UniformSampler = (function (_super) {
            __extends(UniformSampler, _super);
            function UniformSampler(program, name) {
                _super.call(this, program, name);
                this.isSampler = true;
                this.texUnit = program.reserveNextTextureUnit();
            }
            UniformSampler.prototype.getTexUnit = function () {
                return this.texUnit;
            };
            UniformSampler.prototype.setDefault = function (tex) {
                this.default = tex;
            };
            UniformSampler.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.value = undefined;
            };
            UniformSampler.prototype.bufferValue = function (buf, tex) {
                if (tex == null || !tex.isLoaded()) {
                    tex = this.default;
                }
                buf.bindTexture(this.texUnit, tex);
                if (this.value !== this.texUnit) {
                    this.value = this.texUnit;
                    buf.setUniform1I(this, this.texUnit);
                }
            };
            UniformSampler.prototype.set = function (tex) {
                if (tex == null || !tex.isLoaded()) {
                    tex = this.default;
                }
                this.context.activeTexture(this.context.TEXTURE0 + this.texUnit);
                this.context.bindTexture(tex.getTarget(), tex.getHandle());
                this.context.uniform1i(this.getLocation(), this.texUnit);
            };
            return UniformSampler;
        }(Uniform));
        WebGame.UniformSampler = UniformSampler;
        var UniformMatrix4 = (function (_super) {
            __extends(UniformMatrix4, _super);
            function UniformMatrix4() {
                _super.apply(this, arguments);
            }
            UniformMatrix4.prototype.reset = function () {
                _super.prototype.reset.call(this);
                this.transpose = undefined;
                this.values = undefined;
            };
            UniformMatrix4.prototype.bufferValue = function (buf, transpose, values) {
                if (this.transpose === transpose && this.values === values)
                    return;
                this.transpose = transpose;
                this.values = values;
                buf.setUniformMatrix4(this, transpose, values);
            };
            UniformMatrix4.prototype.set = function (transpose, values) {
                this.context.uniformMatrix4fv(this.getLocation(), transpose, values);
            };
            return UniformMatrix4;
        }(Uniform));
        WebGame.UniformMatrix4 = UniformMatrix4;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
var Facepunch;
(function (Facepunch) {
    var WebGame;
    (function (WebGame) {
        (function (AttributeType) {
            AttributeType[AttributeType["Float"] = WebGLRenderingContext.FLOAT] = "Float";
        })(WebGame.AttributeType || (WebGame.AttributeType = {}));
        var AttributeType = WebGame.AttributeType;
        var VertexAttribute = (function () {
            function VertexAttribute(size, type, normalized) {
                this.id = VertexAttribute.nextId++;
                this.size = size;
                this.type = Facepunch.WebGl.decodeConst(type);
                this.normalized = normalized === true;
            }
            VertexAttribute.compare = function (a, b) {
                return a.id - b.id;
            };
            VertexAttribute.nextId = 1;
            VertexAttribute.position = new VertexAttribute(3, AttributeType.Float, false);
            VertexAttribute.normal = new VertexAttribute(3, AttributeType.Float, true);
            VertexAttribute.uv = new VertexAttribute(2, AttributeType.Float, false);
            VertexAttribute.uv2 = new VertexAttribute(2, AttributeType.Float, false);
            VertexAttribute.rgb = new VertexAttribute(3, AttributeType.Float, false);
            VertexAttribute.rgba = new VertexAttribute(4, AttributeType.Float, false);
            return VertexAttribute;
        }());
        WebGame.VertexAttribute = VertexAttribute;
    })(WebGame = Facepunch.WebGame || (Facepunch.WebGame = {}));
})(Facepunch || (Facepunch = {}));
