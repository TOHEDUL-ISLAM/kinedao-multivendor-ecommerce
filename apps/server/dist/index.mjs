import { createRequire } from "node:module";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { z } from "zod";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, arrayContains, asc, count, desc, eq, gte, ilike, inArray, isNotNull, isNull, lt, lte, ne, notInArray, or, relations, sql } from "drizzle-orm";
import { alias, boolean, check, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { Scalar } from "@scalar/hono-api-reference";
import { describeRoute, openAPIRouteHandler, resolver } from "hono-openapi";
import { zValidator } from "@hono/zod-validator";
import { v2 } from "cloudinary";
import webPush from "web-push";
import { createMiddleware } from "hono/factory";
import { createHash, randomBytes } from "node:crypto";
import { streamSSE } from "hono/streaming";

//#region rolldown:runtime
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __export = (all, symbols) => {
	let target = {};
	for (var name in all) {
		__defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	}
	if (symbols) {
		__defProp(target, Symbol.toStringTag, { value: "Module" });
	}
	return target;
};
var __copyProps = (to, from, except, desc$1) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc$1 = __getOwnPropDesc(from, key)) || desc$1.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
var __require = /* @__PURE__ */ createRequire(import.meta.url);

//#endregion
//#region ../../node_modules/.bun/postgres-array@2.0.0/node_modules/postgres-array/index.js
var require_postgres_array = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.parse = function(source, transform$1) {
		return new ArrayParser(source, transform$1).parse();
	};
	var ArrayParser = class ArrayParser {
		constructor(source, transform$1) {
			this.source = source;
			this.transform = transform$1 || identity;
			this.position = 0;
			this.entries = [];
			this.recorded = [];
			this.dimension = 0;
		}
		isEof() {
			return this.position >= this.source.length;
		}
		nextCharacter() {
			var character = this.source[this.position++];
			if (character === "\\") return {
				value: this.source[this.position++],
				escaped: true
			};
			return {
				value: character,
				escaped: false
			};
		}
		record(character) {
			this.recorded.push(character);
		}
		newEntry(includeEmpty) {
			var entry;
			if (this.recorded.length > 0 || includeEmpty) {
				entry = this.recorded.join("");
				if (entry === "NULL" && !includeEmpty) entry = null;
				if (entry !== null) entry = this.transform(entry);
				this.entries.push(entry);
				this.recorded = [];
			}
		}
		consumeDimensions() {
			if (this.source[0] === "[") {
				while (!this.isEof()) if (this.nextCharacter().value === "=") break;
			}
		}
		parse(nested) {
			var character, parser, quote;
			this.consumeDimensions();
			while (!this.isEof()) {
				character = this.nextCharacter();
				if (character.value === "{" && !quote) {
					this.dimension++;
					if (this.dimension > 1) {
						parser = new ArrayParser(this.source.substr(this.position - 1), this.transform);
						this.entries.push(parser.parse(true));
						this.position += parser.position - 2;
					}
				} else if (character.value === "}" && !quote) {
					this.dimension--;
					if (!this.dimension) {
						this.newEntry();
						if (nested) return this.entries;
					}
				} else if (character.value === "\"" && !character.escaped) {
					if (quote) this.newEntry(true);
					quote = !quote;
				} else if (character.value === "," && !quote) this.newEntry();
				else this.record(character.value);
			}
			if (this.dimension !== 0) throw new Error("array dimension not balanced");
			return this.entries;
		}
	};
	function identity(value) {
		return value;
	}
}));

//#endregion
//#region ../../node_modules/.bun/pg-types@2.2.0/node_modules/pg-types/lib/arrayParser.js
var require_arrayParser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var array$1 = require_postgres_array();
	module.exports = { create: function(source, transform$1) {
		return { parse: function() {
			return array$1.parse(source, transform$1);
		} };
	} };
}));

//#endregion
//#region ../../node_modules/.bun/postgres-date@1.0.7/node_modules/postgres-date/index.js
var require_postgres_date = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var DATE_TIME = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/;
	var DATE = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/;
	var TIME_ZONE = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/;
	var INFINITY = /^-?infinity$/;
	module.exports = function parseDate$2(isoDate) {
		if (INFINITY.test(isoDate)) return Number(isoDate.replace("i", "I"));
		var matches = DATE_TIME.exec(isoDate);
		if (!matches) return getDate(isoDate) || null;
		var isBC = !!matches[8];
		var year = parseInt(matches[1], 10);
		if (isBC) year = bcYearToNegativeYear(year);
		var month = parseInt(matches[2], 10) - 1;
		var day = matches[3];
		var hour = parseInt(matches[4], 10);
		var minute = parseInt(matches[5], 10);
		var second = parseInt(matches[6], 10);
		var ms = matches[7];
		ms = ms ? 1e3 * parseFloat(ms) : 0;
		var date;
		var offset = timeZoneOffset(isoDate);
		if (offset != null) {
			date = new Date(Date.UTC(year, month, day, hour, minute, second, ms));
			if (is0To99(year)) date.setUTCFullYear(year);
			if (offset !== 0) date.setTime(date.getTime() - offset);
		} else {
			date = new Date(year, month, day, hour, minute, second, ms);
			if (is0To99(year)) date.setFullYear(year);
		}
		return date;
	};
	function getDate(isoDate) {
		var matches = DATE.exec(isoDate);
		if (!matches) return;
		var year = parseInt(matches[1], 10);
		if (!!matches[4]) year = bcYearToNegativeYear(year);
		var month = parseInt(matches[2], 10) - 1;
		var day = matches[3];
		var date = new Date(year, month, day);
		if (is0To99(year)) date.setFullYear(year);
		return date;
	}
	function timeZoneOffset(isoDate) {
		if (isoDate.endsWith("+00")) return 0;
		var zone = TIME_ZONE.exec(isoDate.split(" ")[1]);
		if (!zone) return;
		var type = zone[1];
		if (type === "Z") return 0;
		var sign$1 = type === "-" ? -1 : 1;
		return (parseInt(zone[2], 10) * 3600 + parseInt(zone[3] || 0, 10) * 60 + parseInt(zone[4] || 0, 10)) * sign$1 * 1e3;
	}
	function bcYearToNegativeYear(year) {
		return -(year - 1);
	}
	function is0To99(num) {
		return num >= 0 && num < 100;
	}
}));

//#endregion
//#region ../../node_modules/.bun/xtend@4.0.2/node_modules/xtend/mutable.js
var require_mutable = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = extend$1;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	function extend$1(target) {
		for (var i = 1; i < arguments.length; i++) {
			var source = arguments[i];
			for (var key in source) if (hasOwnProperty.call(source, key)) target[key] = source[key];
		}
		return target;
	}
}));

//#endregion
//#region ../../node_modules/.bun/postgres-interval@1.2.0/node_modules/postgres-interval/index.js
var require_postgres_interval = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var extend = require_mutable();
	module.exports = PostgresInterval;
	function PostgresInterval(raw) {
		if (!(this instanceof PostgresInterval)) return new PostgresInterval(raw);
		extend(this, parse$5(raw));
	}
	var properties = [
		"seconds",
		"minutes",
		"hours",
		"days",
		"months",
		"years"
	];
	PostgresInterval.prototype.toPostgres = function() {
		var filtered = properties.filter(this.hasOwnProperty, this);
		if (this.milliseconds && filtered.indexOf("seconds") < 0) filtered.push("seconds");
		if (filtered.length === 0) return "0";
		return filtered.map(function(property) {
			var value = this[property] || 0;
			if (property === "seconds" && this.milliseconds) value = (value + this.milliseconds / 1e3).toFixed(6).replace(/\.?0+$/, "");
			return value + " " + property;
		}, this).join(" ");
	};
	var propertiesISOEquivalent = {
		years: "Y",
		months: "M",
		days: "D",
		hours: "H",
		minutes: "M",
		seconds: "S"
	};
	var dateProperties = [
		"years",
		"months",
		"days"
	];
	var timeProperties = [
		"hours",
		"minutes",
		"seconds"
	];
	PostgresInterval.prototype.toISOString = PostgresInterval.prototype.toISO = function() {
		var datePart = dateProperties.map(buildProperty, this).join("");
		var timePart = timeProperties.map(buildProperty, this).join("");
		return "P" + datePart + "T" + timePart;
		function buildProperty(property) {
			var value = this[property] || 0;
			if (property === "seconds" && this.milliseconds) value = (value + this.milliseconds / 1e3).toFixed(6).replace(/0+$/, "");
			return value + propertiesISOEquivalent[property];
		}
	};
	var NUMBER = "([+-]?\\d+)";
	var YEAR = NUMBER + "\\s+years?";
	var MONTH = NUMBER + "\\s+mons?";
	var DAY = NUMBER + "\\s+days?";
	var INTERVAL = new RegExp([
		YEAR,
		MONTH,
		DAY,
		"([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?"
	].map(function(regexString) {
		return "(" + regexString + ")?";
	}).join("\\s*"));
	var positions = {
		years: 2,
		months: 4,
		days: 6,
		hours: 9,
		minutes: 10,
		seconds: 11,
		milliseconds: 12
	};
	var negatives = [
		"hours",
		"minutes",
		"seconds",
		"milliseconds"
	];
	function parseMilliseconds(fraction) {
		var microseconds = fraction + "000000".slice(fraction.length);
		return parseInt(microseconds, 10) / 1e3;
	}
	function parse$5(interval) {
		if (!interval) return {};
		var matches = INTERVAL.exec(interval);
		var isNegative = matches[8] === "-";
		return Object.keys(positions).reduce(function(parsed, property) {
			var value = matches[positions[property]];
			if (!value) return parsed;
			value = property === "milliseconds" ? parseMilliseconds(value) : parseInt(value, 10);
			if (!value) return parsed;
			if (isNegative && ~negatives.indexOf(property)) value *= -1;
			parsed[property] = value;
			return parsed;
		}, {});
	}
}));

//#endregion
//#region ../../node_modules/.bun/postgres-bytea@1.0.1/node_modules/postgres-bytea/index.js
var require_postgres_bytea = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var bufferFrom = Buffer.from || Buffer;
	module.exports = function parseBytea(input) {
		if (/^\\x/.test(input)) return bufferFrom(input.substr(2), "hex");
		var output = "";
		var i = 0;
		while (i < input.length) if (input[i] !== "\\") {
			output += input[i];
			++i;
		} else if (/[0-7]{3}/.test(input.substr(i + 1, 3))) {
			output += String.fromCharCode(parseInt(input.substr(i + 1, 3), 8));
			i += 4;
		} else {
			var backslashes = 1;
			while (i + backslashes < input.length && input[i + backslashes] === "\\") backslashes++;
			for (var k = 0; k < Math.floor(backslashes / 2); ++k) output += "\\";
			i += Math.floor(backslashes / 2) * 2;
		}
		return bufferFrom(output, "binary");
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg-types@2.2.0/node_modules/pg-types/lib/textParsers.js
var require_textParsers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var array = require_postgres_array();
	var arrayParser$1 = require_arrayParser();
	var parseDate$1 = require_postgres_date();
	var parseInterval = require_postgres_interval();
	var parseByteA = require_postgres_bytea();
	function allowNull(fn) {
		return function nullAllowed(value) {
			if (value === null) return value;
			return fn(value);
		};
	}
	function parseBool$1(value) {
		if (value === null) return value;
		return value === "TRUE" || value === "t" || value === "true" || value === "y" || value === "yes" || value === "on" || value === "1";
	}
	function parseBoolArray(value) {
		if (!value) return null;
		return array.parse(value, parseBool$1);
	}
	function parseBaseTenInt(string) {
		return parseInt(string, 10);
	}
	function parseIntegerArray(value) {
		if (!value) return null;
		return array.parse(value, allowNull(parseBaseTenInt));
	}
	function parseBigIntegerArray$1(value) {
		if (!value) return null;
		return array.parse(value, allowNull(function(entry) {
			return parseBigInteger$1(entry).trim();
		}));
	}
	var parsePointArray = function(value) {
		if (!value) return null;
		return arrayParser$1.create(value, function(entry) {
			if (entry !== null) entry = parsePoint(entry);
			return entry;
		}).parse();
	};
	var parseFloatArray = function(value) {
		if (!value) return null;
		return arrayParser$1.create(value, function(entry) {
			if (entry !== null) entry = parseFloat(entry);
			return entry;
		}).parse();
	};
	var parseStringArray = function(value) {
		if (!value) return null;
		return arrayParser$1.create(value).parse();
	};
	var parseDateArray = function(value) {
		if (!value) return null;
		return arrayParser$1.create(value, function(entry) {
			if (entry !== null) entry = parseDate$1(entry);
			return entry;
		}).parse();
	};
	var parseIntervalArray = function(value) {
		if (!value) return null;
		return arrayParser$1.create(value, function(entry) {
			if (entry !== null) entry = parseInterval(entry);
			return entry;
		}).parse();
	};
	var parseByteAArray = function(value) {
		if (!value) return null;
		return array.parse(value, allowNull(parseByteA));
	};
	var parseInteger = function(value) {
		return parseInt(value, 10);
	};
	var parseBigInteger$1 = function(value) {
		var valStr = String(value);
		if (/^\d+$/.test(valStr)) return valStr;
		return value;
	};
	var parseJsonArray = function(value) {
		if (!value) return null;
		return array.parse(value, allowNull(JSON.parse));
	};
	var parsePoint = function(value) {
		if (value[0] !== "(") return null;
		value = value.substring(1, value.length - 1).split(",");
		return {
			x: parseFloat(value[0]),
			y: parseFloat(value[1])
		};
	};
	var parseCircle = function(value) {
		if (value[0] !== "<" && value[1] !== "(") return null;
		var point = "(";
		var radius = "";
		var pointParsed = false;
		for (var i = 2; i < value.length - 1; i++) {
			if (!pointParsed) point += value[i];
			if (value[i] === ")") {
				pointParsed = true;
				continue;
			} else if (!pointParsed) continue;
			if (value[i] === ",") continue;
			radius += value[i];
		}
		var result = parsePoint(point);
		result.radius = parseFloat(radius);
		return result;
	};
	var init$1 = function(register) {
		register(20, parseBigInteger$1);
		register(21, parseInteger);
		register(23, parseInteger);
		register(26, parseInteger);
		register(700, parseFloat);
		register(701, parseFloat);
		register(16, parseBool$1);
		register(1082, parseDate$1);
		register(1114, parseDate$1);
		register(1184, parseDate$1);
		register(600, parsePoint);
		register(651, parseStringArray);
		register(718, parseCircle);
		register(1e3, parseBoolArray);
		register(1001, parseByteAArray);
		register(1005, parseIntegerArray);
		register(1007, parseIntegerArray);
		register(1028, parseIntegerArray);
		register(1016, parseBigIntegerArray$1);
		register(1017, parsePointArray);
		register(1021, parseFloatArray);
		register(1022, parseFloatArray);
		register(1231, parseFloatArray);
		register(1014, parseStringArray);
		register(1015, parseStringArray);
		register(1008, parseStringArray);
		register(1009, parseStringArray);
		register(1040, parseStringArray);
		register(1041, parseStringArray);
		register(1115, parseDateArray);
		register(1182, parseDateArray);
		register(1185, parseDateArray);
		register(1186, parseInterval);
		register(1187, parseIntervalArray);
		register(17, parseByteA);
		register(114, JSON.parse.bind(JSON));
		register(3802, JSON.parse.bind(JSON));
		register(199, parseJsonArray);
		register(3807, parseJsonArray);
		register(3907, parseStringArray);
		register(2951, parseStringArray);
		register(791, parseStringArray);
		register(1183, parseStringArray);
		register(1270, parseStringArray);
	};
	module.exports = { init: init$1 };
}));

//#endregion
//#region ../../node_modules/.bun/pg-int8@1.0.1/node_modules/pg-int8/index.js
var require_pg_int8 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var BASE = 1e6;
	function readInt8(buffer) {
		var high = buffer.readInt32BE(0);
		var low = buffer.readUInt32BE(4);
		var sign$1 = "";
		if (high < 0) {
			high = ~high + (low === 0);
			low = ~low + 1 >>> 0;
			sign$1 = "-";
		}
		var result = "";
		var carry;
		var t;
		var digits;
		var pad;
		var l;
		var i;
		carry = high % BASE;
		high = high / BASE >>> 0;
		t = 4294967296 * carry + low;
		low = t / BASE >>> 0;
		digits = "" + (t - BASE * low);
		if (low === 0 && high === 0) return sign$1 + digits + result;
		pad = "";
		l = 6 - digits.length;
		for (i = 0; i < l; i++) pad += "0";
		result = pad + digits + result;
		carry = high % BASE;
		high = high / BASE >>> 0;
		t = 4294967296 * carry + low;
		low = t / BASE >>> 0;
		digits = "" + (t - BASE * low);
		if (low === 0 && high === 0) return sign$1 + digits + result;
		pad = "";
		l = 6 - digits.length;
		for (i = 0; i < l; i++) pad += "0";
		result = pad + digits + result;
		carry = high % BASE;
		high = high / BASE >>> 0;
		t = 4294967296 * carry + low;
		low = t / BASE >>> 0;
		digits = "" + (t - BASE * low);
		if (low === 0 && high === 0) return sign$1 + digits + result;
		pad = "";
		l = 6 - digits.length;
		for (i = 0; i < l; i++) pad += "0";
		result = pad + digits + result;
		carry = high % BASE;
		t = 4294967296 * carry + low;
		digits = "" + t % BASE;
		return sign$1 + digits + result;
	}
	module.exports = readInt8;
}));

//#endregion
//#region ../../node_modules/.bun/pg-types@2.2.0/node_modules/pg-types/lib/binaryParsers.js
var require_binaryParsers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var parseInt64 = require_pg_int8();
	var parseBits = function(data, bits, offset, invert, callback) {
		offset = offset || 0;
		invert = invert || false;
		callback = callback || function(lastValue, newValue, bits$1) {
			return lastValue * Math.pow(2, bits$1) + newValue;
		};
		var offsetBytes = offset >> 3;
		var inv = function(value) {
			if (invert) return ~value & 255;
			return value;
		};
		var mask = 255;
		var firstBits = 8 - offset % 8;
		if (bits < firstBits) {
			mask = 255 << 8 - bits & 255;
			firstBits = bits;
		}
		if (offset) mask = mask >> offset % 8;
		var result = 0;
		if (offset % 8 + bits >= 8) result = callback(0, inv(data[offsetBytes]) & mask, firstBits);
		var bytes = bits + offset >> 3;
		for (var i = offsetBytes + 1; i < bytes; i++) result = callback(result, inv(data[i]), 8);
		var lastBits = (bits + offset) % 8;
		if (lastBits > 0) result = callback(result, inv(data[bytes]) >> 8 - lastBits, lastBits);
		return result;
	};
	var parseFloatFromBits = function(data, precisionBits, exponentBits) {
		var bias = Math.pow(2, exponentBits - 1) - 1;
		var sign$1 = parseBits(data, 1);
		var exponent = parseBits(data, exponentBits, 1);
		if (exponent === 0) return 0;
		var precisionBitsCounter = 1;
		var parsePrecisionBits = function(lastValue, newValue, bits) {
			if (lastValue === 0) lastValue = 1;
			for (var i = 1; i <= bits; i++) {
				precisionBitsCounter /= 2;
				if ((newValue & 1 << bits - i) > 0) lastValue += precisionBitsCounter;
			}
			return lastValue;
		};
		var mantissa = parseBits(data, precisionBits, exponentBits + 1, false, parsePrecisionBits);
		if (exponent == Math.pow(2, exponentBits + 1) - 1) {
			if (mantissa === 0) return sign$1 === 0 ? Infinity : -Infinity;
			return NaN;
		}
		return (sign$1 === 0 ? 1 : -1) * Math.pow(2, exponent - bias) * mantissa;
	};
	var parseInt16 = function(value) {
		if (parseBits(value, 1) == 1) return -1 * (parseBits(value, 15, 1, true) + 1);
		return parseBits(value, 15, 1);
	};
	var parseInt32 = function(value) {
		if (parseBits(value, 1) == 1) return -1 * (parseBits(value, 31, 1, true) + 1);
		return parseBits(value, 31, 1);
	};
	var parseFloat32 = function(value) {
		return parseFloatFromBits(value, 23, 8);
	};
	var parseFloat64 = function(value) {
		return parseFloatFromBits(value, 52, 11);
	};
	var parseNumeric = function(value) {
		var sign$1 = parseBits(value, 16, 32);
		if (sign$1 == 49152) return NaN;
		var weight = Math.pow(1e4, parseBits(value, 16, 16));
		var result = 0;
		var ndigits = parseBits(value, 16);
		for (var i = 0; i < ndigits; i++) {
			result += parseBits(value, 16, 64 + 16 * i) * weight;
			weight /= 1e4;
		}
		var scale = Math.pow(10, parseBits(value, 16, 48));
		return (sign$1 === 0 ? 1 : -1) * Math.round(result * scale) / scale;
	};
	var parseDate = function(isUTC, value) {
		var sign$1 = parseBits(value, 1);
		var rawValue = parseBits(value, 63, 1);
		var result = /* @__PURE__ */ new Date((sign$1 === 0 ? 1 : -1) * rawValue / 1e3 + 9466848e5);
		if (!isUTC) result.setTime(result.getTime() + result.getTimezoneOffset() * 6e4);
		result.usec = rawValue % 1e3;
		result.getMicroSeconds = function() {
			return this.usec;
		};
		result.setMicroSeconds = function(value$1) {
			this.usec = value$1;
		};
		result.getUTCMicroSeconds = function() {
			return this.usec;
		};
		return result;
	};
	var parseArray = function(value) {
		var dim = parseBits(value, 32);
		parseBits(value, 32, 32);
		var elementType = parseBits(value, 32, 64);
		var offset = 96;
		var dims = [];
		for (var i = 0; i < dim; i++) {
			dims[i] = parseBits(value, 32, offset);
			offset += 32;
			offset += 32;
		}
		var parseElement = function(elementType$1) {
			var length = parseBits(value, 32, offset);
			offset += 32;
			if (length == 4294967295) return null;
			var result;
			if (elementType$1 == 23 || elementType$1 == 20) {
				result = parseBits(value, length * 8, offset);
				offset += length * 8;
				return result;
			} else if (elementType$1 == 25) {
				result = value.toString(this.encoding, offset >> 3, (offset += length << 3) >> 3);
				return result;
			} else console.log("ERROR: ElementType not implemented: " + elementType$1);
		};
		var parse$6 = function(dimension, elementType$1) {
			var array$2 = [];
			var i$1;
			if (dimension.length > 1) {
				var count$1 = dimension.shift();
				for (i$1 = 0; i$1 < count$1; i$1++) array$2[i$1] = parse$6(dimension, elementType$1);
				dimension.unshift(count$1);
			} else for (i$1 = 0; i$1 < dimension[0]; i$1++) array$2[i$1] = parseElement(elementType$1);
			return array$2;
		};
		return parse$6(dims, elementType);
	};
	var parseText = function(value) {
		return value.toString("utf8");
	};
	var parseBool = function(value) {
		if (value === null) return null;
		return parseBits(value, 8) > 0;
	};
	var init = function(register) {
		register(20, parseInt64);
		register(21, parseInt16);
		register(23, parseInt32);
		register(26, parseInt32);
		register(1700, parseNumeric);
		register(700, parseFloat32);
		register(701, parseFloat64);
		register(16, parseBool);
		register(1114, parseDate.bind(null, false));
		register(1184, parseDate.bind(null, true));
		register(1e3, parseArray);
		register(1007, parseArray);
		register(1016, parseArray);
		register(1008, parseArray);
		register(1009, parseArray);
		register(25, parseText);
	};
	module.exports = { init };
}));

//#endregion
//#region ../../node_modules/.bun/pg-types@2.2.0/node_modules/pg-types/lib/builtins.js
var require_builtins = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Following query was used to generate this file:
	
	SELECT json_object_agg(UPPER(PT.typname), PT.oid::int4 ORDER BY pt.oid)
	FROM pg_type PT
	WHERE typnamespace = (SELECT pgn.oid FROM pg_namespace pgn WHERE nspname = 'pg_catalog') -- Take only builting Postgres types with stable OID (extension types are not guaranted to be stable)
	AND typtype = 'b' -- Only basic types
	AND typelem = 0 -- Ignore aliases
	AND typisdefined -- Ignore undefined types
	*/
	module.exports = {
		BOOL: 16,
		BYTEA: 17,
		CHAR: 18,
		INT8: 20,
		INT2: 21,
		INT4: 23,
		REGPROC: 24,
		TEXT: 25,
		OID: 26,
		TID: 27,
		XID: 28,
		CID: 29,
		JSON: 114,
		XML: 142,
		PG_NODE_TREE: 194,
		SMGR: 210,
		PATH: 602,
		POLYGON: 604,
		CIDR: 650,
		FLOAT4: 700,
		FLOAT8: 701,
		ABSTIME: 702,
		RELTIME: 703,
		TINTERVAL: 704,
		CIRCLE: 718,
		MACADDR8: 774,
		MONEY: 790,
		MACADDR: 829,
		INET: 869,
		ACLITEM: 1033,
		BPCHAR: 1042,
		VARCHAR: 1043,
		DATE: 1082,
		TIME: 1083,
		TIMESTAMP: 1114,
		TIMESTAMPTZ: 1184,
		INTERVAL: 1186,
		TIMETZ: 1266,
		BIT: 1560,
		VARBIT: 1562,
		NUMERIC: 1700,
		REFCURSOR: 1790,
		REGPROCEDURE: 2202,
		REGOPER: 2203,
		REGOPERATOR: 2204,
		REGCLASS: 2205,
		REGTYPE: 2206,
		UUID: 2950,
		TXID_SNAPSHOT: 2970,
		PG_LSN: 3220,
		PG_NDISTINCT: 3361,
		PG_DEPENDENCIES: 3402,
		TSVECTOR: 3614,
		TSQUERY: 3615,
		GTSVECTOR: 3642,
		REGCONFIG: 3734,
		REGDICTIONARY: 3769,
		JSONB: 3802,
		REGNAMESPACE: 4089,
		REGROLE: 4096
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg-types@2.2.0/node_modules/pg-types/index.js
var require_pg_types = /* @__PURE__ */ __commonJSMin(((exports) => {
	var textParsers = require_textParsers();
	var binaryParsers = require_binaryParsers();
	var arrayParser = require_arrayParser();
	var builtinTypes = require_builtins();
	exports.getTypeParser = getTypeParser;
	exports.setTypeParser = setTypeParser;
	exports.arrayParser = arrayParser;
	exports.builtins = builtinTypes;
	var typeParsers = {
		text: {},
		binary: {}
	};
	function noParse(val$1) {
		return String(val$1);
	}
	function getTypeParser(oid, format) {
		format = format || "text";
		if (!typeParsers[format]) return noParse;
		return typeParsers[format][oid] || noParse;
	}
	function setTypeParser(oid, format, parseFn) {
		if (typeof format == "function") {
			parseFn = format;
			format = "text";
		}
		typeParsers[format][oid] = parseFn;
	}
	textParsers.init(function(oid, converter) {
		typeParsers.text[oid] = converter;
	});
	binaryParsers.init(function(oid, converter) {
		typeParsers.binary[oid] = converter;
	});
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/defaults.js
var require_defaults = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let user$1;
	try {
		user$1 = process.platform === "win32" ? process.env.USERNAME : process.env.USER;
	} catch {}
	module.exports = {
		host: "localhost",
		user: user$1,
		database: void 0,
		password: null,
		connectionString: void 0,
		port: 5432,
		rows: 0,
		binary: false,
		max: 10,
		idleTimeoutMillis: 3e4,
		client_encoding: "",
		ssl: false,
		application_name: void 0,
		fallback_application_name: void 0,
		options: void 0,
		parseInputDatesAsUTC: false,
		statement_timeout: false,
		lock_timeout: false,
		idle_in_transaction_session_timeout: false,
		query_timeout: false,
		connect_timeout: 0,
		keepalives: 1,
		keepalives_idle: 0
	};
	const pgTypes = require_pg_types();
	const parseBigInteger = pgTypes.getTypeParser(20, "text");
	const parseBigIntegerArray = pgTypes.getTypeParser(1016, "text");
	module.exports.__defineSetter__("parseInt8", function(val$1) {
		pgTypes.setTypeParser(20, "text", val$1 ? pgTypes.getTypeParser(23, "text") : parseBigInteger);
		pgTypes.setTypeParser(1016, "text", val$1 ? pgTypes.getTypeParser(1007, "text") : parseBigIntegerArray);
	});
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const defaults$4 = require_defaults();
	const util$5 = __require("util");
	const { isDate } = util$5.types || util$5;
	function escapeElement(elementRepresentation) {
		return "\"" + elementRepresentation.replace(/\\/g, "\\\\").replace(/"/g, "\\\"") + "\"";
	}
	function arrayString(val$1) {
		let result = "{";
		for (let i = 0; i < val$1.length; i++) {
			if (i > 0) result = result + ",";
			if (val$1[i] === null || typeof val$1[i] === "undefined") result = result + "NULL";
			else if (Array.isArray(val$1[i])) result = result + arrayString(val$1[i]);
			else if (ArrayBuffer.isView(val$1[i])) {
				let item = val$1[i];
				if (!(item instanceof Buffer)) {
					const buf = Buffer.from(item.buffer, item.byteOffset, item.byteLength);
					if (buf.length === item.byteLength) item = buf;
					else item = buf.slice(item.byteOffset, item.byteOffset + item.byteLength);
				}
				result += "\\\\x" + item.toString("hex");
			} else result += escapeElement(prepareValue(val$1[i]));
		}
		result = result + "}";
		return result;
	}
	const prepareValue = function(val$1, seen) {
		if (val$1 == null) return null;
		if (typeof val$1 === "object") {
			if (val$1 instanceof Buffer) return val$1;
			if (ArrayBuffer.isView(val$1)) {
				const buf = Buffer.from(val$1.buffer, val$1.byteOffset, val$1.byteLength);
				if (buf.length === val$1.byteLength) return buf;
				return buf.slice(val$1.byteOffset, val$1.byteOffset + val$1.byteLength);
			}
			if (isDate(val$1)) if (defaults$4.parseInputDatesAsUTC) return dateToStringUTC(val$1);
			else return dateToString(val$1);
			if (Array.isArray(val$1)) return arrayString(val$1);
			return prepareObject(val$1, seen);
		}
		return val$1.toString();
	};
	function prepareObject(val$1, seen) {
		if (val$1 && typeof val$1.toPostgres === "function") {
			seen = seen || [];
			if (seen.indexOf(val$1) !== -1) throw new Error("circular reference detected while preparing \"" + val$1 + "\" for query");
			seen.push(val$1);
			return prepareValue(val$1.toPostgres(prepareValue), seen);
		}
		return JSON.stringify(val$1);
	}
	function dateToString(date) {
		let offset = -date.getTimezoneOffset();
		let year = date.getFullYear();
		const isBCYear = year < 1;
		if (isBCYear) year = Math.abs(year) + 1;
		let ret = String(year).padStart(4, "0") + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0") + "T" + String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0") + ":" + String(date.getSeconds()).padStart(2, "0") + "." + String(date.getMilliseconds()).padStart(3, "0");
		if (offset < 0) {
			ret += "-";
			offset *= -1;
		} else ret += "+";
		ret += String(Math.floor(offset / 60)).padStart(2, "0") + ":" + String(offset % 60).padStart(2, "0");
		if (isBCYear) ret += " BC";
		return ret;
	}
	function dateToStringUTC(date) {
		let year = date.getUTCFullYear();
		const isBCYear = year < 1;
		if (isBCYear) year = Math.abs(year) + 1;
		let ret = String(year).padStart(4, "0") + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0") + "T" + String(date.getUTCHours()).padStart(2, "0") + ":" + String(date.getUTCMinutes()).padStart(2, "0") + ":" + String(date.getUTCSeconds()).padStart(2, "0") + "." + String(date.getUTCMilliseconds()).padStart(3, "0");
		ret += "+00:00";
		if (isBCYear) ret += " BC";
		return ret;
	}
	function normalizeQueryConfig(config, values, callback) {
		config = typeof config === "string" ? { text: config } : config;
		if (values) if (typeof values === "function") config.callback = values;
		else config.values = values;
		if (callback) config.callback = callback;
		return config;
	}
	const escapeIdentifier$2 = function(str) {
		return "\"" + str.replace(/"/g, "\"\"") + "\"";
	};
	const escapeLiteral$2 = function(str) {
		let hasBackslash = false;
		let escaped = "'";
		if (str == null) return "''";
		if (typeof str !== "string") return "''";
		for (let i = 0; i < str.length; i++) {
			const c = str[i];
			if (c === "'") escaped += c + c;
			else if (c === "\\") {
				escaped += c + c;
				hasBackslash = true;
			} else escaped += c;
		}
		escaped += "'";
		if (hasBackslash === true) escaped = " E" + escaped;
		return escaped;
	};
	module.exports = {
		prepareValue: function prepareValueWrapper(value) {
			return prepareValue(value);
		},
		normalizeQueryConfig,
		escapeIdentifier: escapeIdentifier$2,
		escapeLiteral: escapeLiteral$2
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/crypto/utils-legacy.js
var require_utils_legacy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const nodeCrypto$1 = __require("crypto");
	function md5$1(string) {
		return nodeCrypto$1.createHash("md5").update(string, "utf-8").digest("hex");
	}
	function postgresMd5PasswordHash$1(user$2, password$1, salt) {
		const inner = md5$1(password$1 + user$2);
		return "md5" + md5$1(Buffer.concat([Buffer.from(inner), salt]));
	}
	function sha256$1(text$1) {
		return nodeCrypto$1.createHash("sha256").update(text$1).digest();
	}
	function hashByName$1(hashName, text$1) {
		hashName = hashName.replace(/(\D)-/, "$1");
		return nodeCrypto$1.createHash(hashName).update(text$1).digest();
	}
	function hmacSha256$1(key, msg) {
		return nodeCrypto$1.createHmac("sha256", key).update(msg).digest();
	}
	async function deriveKey$1(password$1, salt, iterations) {
		return nodeCrypto$1.pbkdf2Sync(password$1, salt, iterations, 32, "sha256");
	}
	module.exports = {
		postgresMd5PasswordHash: postgresMd5PasswordHash$1,
		randomBytes: nodeCrypto$1.randomBytes,
		deriveKey: deriveKey$1,
		sha256: sha256$1,
		hashByName: hashByName$1,
		hmacSha256: hmacSha256$1,
		md5: md5$1
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/crypto/utils-webcrypto.js
var require_utils_webcrypto = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const nodeCrypto = __require("crypto");
	module.exports = {
		postgresMd5PasswordHash,
		randomBytes: randomBytes$1,
		deriveKey,
		sha256,
		hashByName,
		hmacSha256,
		md5
	};
	/**
	* The Web Crypto API - grabbed from the Node.js library or the global
	* @type Crypto
	*/
	const webCrypto = nodeCrypto.webcrypto || globalThis.crypto;
	/**
	* The SubtleCrypto API for low level crypto operations.
	* @type SubtleCrypto
	*/
	const subtleCrypto = webCrypto.subtle;
	const textEncoder = new TextEncoder();
	/**
	*
	* @param {*} length
	* @returns
	*/
	function randomBytes$1(length) {
		return webCrypto.getRandomValues(Buffer.alloc(length));
	}
	async function md5(string) {
		try {
			return nodeCrypto.createHash("md5").update(string, "utf-8").digest("hex");
		} catch (e) {
			const data = typeof string === "string" ? textEncoder.encode(string) : string;
			const hash = await subtleCrypto.digest("MD5", data);
			return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
		}
	}
	async function postgresMd5PasswordHash(user$2, password$1, salt) {
		const inner = await md5(password$1 + user$2);
		return "md5" + await md5(Buffer.concat([Buffer.from(inner), salt]));
	}
	/**
	* Create a SHA-256 digest of the given data
	* @param {Buffer} data
	*/
	async function sha256(text$1) {
		return await subtleCrypto.digest("SHA-256", text$1);
	}
	async function hashByName(hashName, text$1) {
		return await subtleCrypto.digest(hashName, text$1);
	}
	/**
	* Sign the message with the given key
	* @param {ArrayBuffer} keyBuffer
	* @param {string} msg
	*/
	async function hmacSha256(keyBuffer, msg) {
		const key = await subtleCrypto.importKey("raw", keyBuffer, {
			name: "HMAC",
			hash: "SHA-256"
		}, false, ["sign"]);
		return await subtleCrypto.sign("HMAC", key, textEncoder.encode(msg));
	}
	/**
	* Derive a key from the password and salt
	* @param {string} password
	* @param {Uint8Array} salt
	* @param {number} iterations
	*/
	async function deriveKey(password$1, salt, iterations) {
		const key = await subtleCrypto.importKey("raw", textEncoder.encode(password$1), "PBKDF2", false, ["deriveBits"]);
		const params = {
			name: "PBKDF2",
			hash: "SHA-256",
			salt,
			iterations
		};
		return await subtleCrypto.deriveBits(params, key, 256, ["deriveBits"]);
	}
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/crypto/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	if (parseInt(process.versions && process.versions.node && process.versions.node.split(".")[0]) < 15) module.exports = require_utils_legacy();
	else module.exports = require_utils_webcrypto();
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/crypto/cert-signatures.js
var require_cert_signatures = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function x509Error(msg, cert) {
		return /* @__PURE__ */ new Error("SASL channel binding: " + msg + " when parsing public certificate " + cert.toString("base64"));
	}
	function readASN1Length(data, index$1) {
		let length = data[index$1++];
		if (length < 128) return {
			length,
			index: index$1
		};
		const lengthBytes = length & 127;
		if (lengthBytes > 4) throw x509Error("bad length", data);
		length = 0;
		for (let i = 0; i < lengthBytes; i++) length = length << 8 | data[index$1++];
		return {
			length,
			index: index$1
		};
	}
	function readASN1OID(data, index$1) {
		if (data[index$1++] !== 6) throw x509Error("non-OID data", data);
		const { length: OIDLength, index: indexAfterOIDLength } = readASN1Length(data, index$1);
		index$1 = indexAfterOIDLength;
		const lastIndex = index$1 + OIDLength;
		const byte1 = data[index$1++];
		let oid = (byte1 / 40 >> 0) + "." + byte1 % 40;
		while (index$1 < lastIndex) {
			let value = 0;
			while (index$1 < lastIndex) {
				const nextByte = data[index$1++];
				value = value << 7 | nextByte & 127;
				if (nextByte < 128) break;
			}
			oid += "." + value;
		}
		return {
			oid,
			index: index$1
		};
	}
	function expectASN1Seq(data, index$1) {
		if (data[index$1++] !== 48) throw x509Error("non-sequence data", data);
		return readASN1Length(data, index$1);
	}
	function signatureAlgorithmHashFromCertificate$1(data, index$1) {
		if (index$1 === void 0) index$1 = 0;
		index$1 = expectASN1Seq(data, index$1).index;
		const { length: certInfoLength, index: indexAfterCertInfoLength } = expectASN1Seq(data, index$1);
		index$1 = indexAfterCertInfoLength + certInfoLength;
		index$1 = expectASN1Seq(data, index$1).index;
		const { oid, index: indexAfterOID } = readASN1OID(data, index$1);
		switch (oid) {
			case "1.2.840.113549.1.1.4": return "MD5";
			case "1.2.840.113549.1.1.5": return "SHA-1";
			case "1.2.840.113549.1.1.11": return "SHA-256";
			case "1.2.840.113549.1.1.12": return "SHA-384";
			case "1.2.840.113549.1.1.13": return "SHA-512";
			case "1.2.840.113549.1.1.14": return "SHA-224";
			case "1.2.840.113549.1.1.15": return "SHA512-224";
			case "1.2.840.113549.1.1.16": return "SHA512-256";
			case "1.2.840.10045.4.1": return "SHA-1";
			case "1.2.840.10045.4.3.1": return "SHA-224";
			case "1.2.840.10045.4.3.2": return "SHA-256";
			case "1.2.840.10045.4.3.3": return "SHA-384";
			case "1.2.840.10045.4.3.4": return "SHA-512";
			case "1.2.840.113549.1.1.10": {
				index$1 = indexAfterOID;
				index$1 = expectASN1Seq(data, index$1).index;
				if (data[index$1++] !== 160) throw x509Error("non-tag data", data);
				index$1 = readASN1Length(data, index$1).index;
				index$1 = expectASN1Seq(data, index$1).index;
				const { oid: hashOID } = readASN1OID(data, index$1);
				switch (hashOID) {
					case "1.2.840.113549.2.5": return "MD5";
					case "1.3.14.3.2.26": return "SHA-1";
					case "2.16.840.1.101.3.4.2.1": return "SHA-256";
					case "2.16.840.1.101.3.4.2.2": return "SHA-384";
					case "2.16.840.1.101.3.4.2.3": return "SHA-512";
				}
				throw x509Error("unknown hash OID " + hashOID, data);
			}
			case "1.3.101.110":
			case "1.3.101.112": return "SHA-512";
			case "1.3.101.111":
			case "1.3.101.113": throw x509Error("Ed448 certificate channel binding is not currently supported by Postgres");
		}
		throw x509Error("unknown OID " + oid, data);
	}
	module.exports = { signatureAlgorithmHashFromCertificate: signatureAlgorithmHashFromCertificate$1 };
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/crypto/sasl.js
var require_sasl = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const crypto$9 = require_utils();
	const { signatureAlgorithmHashFromCertificate } = require_cert_signatures();
	function startSession(mechanisms, stream) {
		const candidates = ["SCRAM-SHA-256"];
		if (stream) candidates.unshift("SCRAM-SHA-256-PLUS");
		const mechanism = candidates.find((candidate) => mechanisms.includes(candidate));
		if (!mechanism) throw new Error("SASL: Only mechanism(s) " + candidates.join(" and ") + " are supported");
		if (mechanism === "SCRAM-SHA-256-PLUS" && typeof stream.getPeerCertificate !== "function") throw new Error("SASL: Mechanism SCRAM-SHA-256-PLUS requires a certificate");
		const clientNonce = crypto$9.randomBytes(18).toString("base64");
		return {
			mechanism,
			clientNonce,
			response: (mechanism === "SCRAM-SHA-256-PLUS" ? "p=tls-server-end-point" : stream ? "y" : "n") + ",,n=*,r=" + clientNonce,
			message: "SASLInitialResponse"
		};
	}
	async function continueSession(session$1, password$1, serverData, stream) {
		if (session$1.message !== "SASLInitialResponse") throw new Error("SASL: Last message was not SASLInitialResponse");
		if (typeof password$1 !== "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
		if (password$1 === "") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a non-empty string");
		if (typeof serverData !== "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
		const sv = parseServerFirstMessage(serverData);
		if (!sv.nonce.startsWith(session$1.clientNonce)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
		else if (sv.nonce.length === session$1.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
		const clientFirstMessageBare = "n=*,r=" + session$1.clientNonce;
		const serverFirstMessage = "r=" + sv.nonce + ",s=" + sv.salt + ",i=" + sv.iteration;
		let channelBinding = stream ? "eSws" : "biws";
		if (session$1.mechanism === "SCRAM-SHA-256-PLUS") {
			const peerCert = stream.getPeerCertificate().raw;
			let hashName = signatureAlgorithmHashFromCertificate(peerCert);
			if (hashName === "MD5" || hashName === "SHA-1") hashName = "SHA-256";
			const certHash = await crypto$9.hashByName(hashName, peerCert);
			channelBinding = Buffer.concat([Buffer.from("p=tls-server-end-point,,"), Buffer.from(certHash)]).toString("base64");
		}
		const clientFinalMessageWithoutProof = "c=" + channelBinding + ",r=" + sv.nonce;
		const authMessage = clientFirstMessageBare + "," + serverFirstMessage + "," + clientFinalMessageWithoutProof;
		const saltBytes = Buffer.from(sv.salt, "base64");
		const saltedPassword = await crypto$9.deriveKey(password$1, saltBytes, sv.iteration);
		const clientKey = await crypto$9.hmacSha256(saltedPassword, "Client Key");
		const storedKey = await crypto$9.sha256(clientKey);
		const clientSignature = await crypto$9.hmacSha256(storedKey, authMessage);
		const clientProof = xorBuffers(Buffer.from(clientKey), Buffer.from(clientSignature)).toString("base64");
		const serverKey = await crypto$9.hmacSha256(saltedPassword, "Server Key");
		const serverSignatureBytes = await crypto$9.hmacSha256(serverKey, authMessage);
		session$1.message = "SASLResponse";
		session$1.serverSignature = Buffer.from(serverSignatureBytes).toString("base64");
		session$1.response = clientFinalMessageWithoutProof + ",p=" + clientProof;
	}
	function finalizeSession(session$1, serverData) {
		if (session$1.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
		if (typeof serverData !== "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
		const { serverSignature } = parseServerFinalMessage(serverData);
		if (serverSignature !== session$1.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
	}
	/**
	* printable       = %x21-2B / %x2D-7E
	*                   ;; Printable ASCII except ",".
	*                   ;; Note that any "printable" is also
	*                   ;; a valid "value".
	*/
	function isPrintableChars(text$1) {
		if (typeof text$1 !== "string") throw new TypeError("SASL: text must be a string");
		return text$1.split("").map((_, i) => text$1.charCodeAt(i)).every((c) => c >= 33 && c <= 43 || c >= 45 && c <= 126);
	}
	/**
	* base64-char     = ALPHA / DIGIT / "/" / "+"
	*
	* base64-4        = 4base64-char
	*
	* base64-3        = 3base64-char "="
	*
	* base64-2        = 2base64-char "=="
	*
	* base64          = *base64-4 [base64-3 / base64-2]
	*/
	function isBase64(text$1) {
		return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(text$1);
	}
	function parseAttributePairs(text$1) {
		if (typeof text$1 !== "string") throw new TypeError("SASL: attribute pairs text must be a string");
		return new Map(text$1.split(",").map((attrValue) => {
			if (!/^.=/.test(attrValue)) throw new Error("SASL: Invalid attribute pair entry");
			return [attrValue[0], attrValue.substring(2)];
		}));
	}
	function parseServerFirstMessage(data) {
		const attrPairs = parseAttributePairs(data);
		const nonce = attrPairs.get("r");
		if (!nonce) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
		else if (!isPrintableChars(nonce)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
		const salt = attrPairs.get("s");
		if (!salt) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
		else if (!isBase64(salt)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
		const iterationText = attrPairs.get("i");
		if (!iterationText) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
		else if (!/^[1-9][0-9]*$/.test(iterationText)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
		return {
			nonce,
			salt,
			iteration: parseInt(iterationText, 10)
		};
	}
	function parseServerFinalMessage(serverData) {
		const serverSignature = parseAttributePairs(serverData).get("v");
		if (!serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
		else if (!isBase64(serverSignature)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
		return { serverSignature };
	}
	function xorBuffers(a, b) {
		if (!Buffer.isBuffer(a)) throw new TypeError("first argument must be a Buffer");
		if (!Buffer.isBuffer(b)) throw new TypeError("second argument must be a Buffer");
		if (a.length !== b.length) throw new Error("Buffer lengths must match");
		if (a.length === 0) throw new Error("Buffers cannot be empty");
		return Buffer.from(a.map((_, i) => a[i] ^ b[i]));
	}
	module.exports = {
		startSession,
		continueSession,
		finalizeSession
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/type-overrides.js
var require_type_overrides = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const types$2 = require_pg_types();
	function TypeOverrides$4(userTypes) {
		this._types = userTypes || types$2;
		this.text = {};
		this.binary = {};
	}
	TypeOverrides$4.prototype.getOverrides = function(format) {
		switch (format) {
			case "text": return this.text;
			case "binary": return this.binary;
			default: return {};
		}
	};
	TypeOverrides$4.prototype.setTypeParser = function(oid, format, parseFn) {
		if (typeof format === "function") {
			parseFn = format;
			format = "text";
		}
		this.getOverrides(format)[oid] = parseFn;
	};
	TypeOverrides$4.prototype.getTypeParser = function(oid, format) {
		format = format || "text";
		return this.getOverrides(format)[oid] || this._types.getTypeParser(oid, format);
	};
	module.exports = TypeOverrides$4;
}));

//#endregion
//#region ../../node_modules/.bun/pg-connection-string@2.10.1/node_modules/pg-connection-string/index.js
var require_pg_connection_string = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { emitWarning } = __require("process");
	function parse$4(str, options = {}) {
		if (str.charAt(0) === "/") {
			const config$1 = str.split(" ");
			return {
				host: config$1[0],
				database: config$1[1]
			};
		}
		const config = {};
		let result;
		let dummyHost = false;
		if (/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(str)) str = encodeURI(str).replace(/%25(\d\d)/g, "%$1");
		try {
			try {
				result = new URL(str, "postgres://base");
			} catch (e) {
				result = new URL(str.replace("@/", "@___DUMMY___/"), "postgres://base");
				dummyHost = true;
			}
		} catch (err) {
			err.input && (err.input = "*****REDACTED*****");
			throw err;
		}
		for (const entry of result.searchParams.entries()) config[entry[0]] = entry[1];
		config.user = config.user || decodeURIComponent(result.username);
		config.password = config.password || decodeURIComponent(result.password);
		if (result.protocol == "socket:") {
			config.host = decodeURI(result.pathname);
			config.database = result.searchParams.get("db");
			config.client_encoding = result.searchParams.get("encoding");
			return config;
		}
		const hostname = dummyHost ? "" : result.hostname;
		if (!config.host) config.host = decodeURIComponent(hostname);
		else if (hostname && /^%2f/i.test(hostname)) result.pathname = hostname + result.pathname;
		if (!config.port) config.port = result.port;
		const pathname = result.pathname.slice(1) || null;
		config.database = pathname ? decodeURI(pathname) : null;
		if (config.ssl === "true" || config.ssl === "1") config.ssl = true;
		if (config.ssl === "0") config.ssl = false;
		if (config.sslcert || config.sslkey || config.sslrootcert || config.sslmode) config.ssl = {};
		const fs$4 = config.sslcert || config.sslkey || config.sslrootcert ? __require("fs") : null;
		if (config.sslcert) config.ssl.cert = fs$4.readFileSync(config.sslcert).toString();
		if (config.sslkey) config.ssl.key = fs$4.readFileSync(config.sslkey).toString();
		if (config.sslrootcert) config.ssl.ca = fs$4.readFileSync(config.sslrootcert).toString();
		if (options.useLibpqCompat && config.uselibpqcompat) throw new Error("Both useLibpqCompat and uselibpqcompat are set. Please use only one of them.");
		if (config.uselibpqcompat === "true" || options.useLibpqCompat) switch (config.sslmode) {
			case "disable":
				config.ssl = false;
				break;
			case "prefer":
				config.ssl.rejectUnauthorized = false;
				break;
			case "require":
				if (config.sslrootcert) config.ssl.checkServerIdentity = function() {};
				else config.ssl.rejectUnauthorized = false;
				break;
			case "verify-ca":
				if (!config.ssl.ca) throw new Error("SECURITY WARNING: Using sslmode=verify-ca requires specifying a CA with sslrootcert. If a public CA is used, verify-ca allows connections to a server that somebody else may have registered with the CA, making you vulnerable to Man-in-the-Middle attacks. Either specify a custom CA certificate with sslrootcert parameter or use sslmode=verify-full for proper security.");
				config.ssl.checkServerIdentity = function() {};
				break;
			case "verify-full": break;
		}
		else switch (config.sslmode) {
			case "disable":
				config.ssl = false;
				break;
			case "prefer":
			case "require":
			case "verify-ca":
			case "verify-full":
				if (config.sslmode !== "verify-full") deprecatedSslModeWarning(config.sslmode);
				break;
			case "no-verify":
				config.ssl.rejectUnauthorized = false;
				break;
		}
		return config;
	}
	function toConnectionOptions(sslConfig) {
		return Object.entries(sslConfig).reduce((c, [key, value]) => {
			if (value !== void 0 && value !== null) c[key] = value;
			return c;
		}, {});
	}
	function toClientConfig(config) {
		return Object.entries(config).reduce((c, [key, value]) => {
			if (key === "ssl") {
				const sslConfig = value;
				if (typeof sslConfig === "boolean") c[key] = sslConfig;
				if (typeof sslConfig === "object") c[key] = toConnectionOptions(sslConfig);
			} else if (value !== void 0 && value !== null) if (key === "port") {
				if (value !== "") {
					const v = parseInt(value, 10);
					if (isNaN(v)) throw new Error(`Invalid ${key}: ${value}`);
					c[key] = v;
				}
			} else c[key] = value;
			return c;
		}, {});
	}
	function parseIntoClientConfig(str) {
		return toClientConfig(parse$4(str));
	}
	function deprecatedSslModeWarning(sslmode) {
		if (!deprecatedSslModeWarning.warned) {
			deprecatedSslModeWarning.warned = true;
			emitWarning(`SECURITY WARNING: The SSL modes 'prefer', 'require', and 'verify-ca' are treated as aliases for 'verify-full'.
In the next major version (pg-connection-string v3.0.0 and pg v9.0.0), these modes will adopt standard libpq semantics, which have weaker security guarantees.

To prepare for this change:
- If you want the current behavior, explicitly use 'sslmode=verify-full'
- If you want libpq compatibility now, use 'uselibpqcompat=true&sslmode=${sslmode}'

See https://www.postgresql.org/docs/current/libpq-ssl.html for libpq SSL mode definitions.`);
		}
	}
	module.exports = parse$4;
	parse$4.parse = parse$4;
	parse$4.toClientConfig = toClientConfig;
	parse$4.parseIntoClientConfig = parseIntoClientConfig;
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/connection-parameters.js
var require_connection_parameters = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const dns$2 = __require("dns");
	const defaults$3 = require_defaults();
	const parse$3 = require_pg_connection_string().parse;
	const val = function(key, config, envVar) {
		if (config[key]) return config[key];
		if (envVar === void 0) envVar = process.env["PG" + key.toUpperCase()];
		else if (envVar === false) {} else envVar = process.env[envVar];
		return envVar || defaults$3[key];
	};
	const readSSLConfigFromEnvironment = function() {
		switch (process.env.PGSSLMODE) {
			case "disable": return false;
			case "prefer":
			case "require":
			case "verify-ca":
			case "verify-full": return true;
			case "no-verify": return { rejectUnauthorized: false };
		}
		return defaults$3.ssl;
	};
	const quoteParamValue = function(value) {
		return "'" + ("" + value).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
	};
	const add = function(params, config, paramName) {
		const value = config[paramName];
		if (value !== void 0 && value !== null) params.push(paramName + "=" + quoteParamValue(value));
	};
	var ConnectionParameters$2 = class {
		constructor(config) {
			config = typeof config === "string" ? parse$3(config) : config || {};
			if (config.connectionString) config = Object.assign({}, config, parse$3(config.connectionString));
			this.user = val("user", config);
			this.database = val("database", config);
			if (this.database === void 0) this.database = this.user;
			this.port = parseInt(val("port", config), 10);
			this.host = val("host", config);
			Object.defineProperty(this, "password", {
				configurable: true,
				enumerable: false,
				writable: true,
				value: val("password", config)
			});
			this.binary = val("binary", config);
			this.options = val("options", config);
			this.ssl = typeof config.ssl === "undefined" ? readSSLConfigFromEnvironment() : config.ssl;
			if (typeof this.ssl === "string") {
				if (this.ssl === "true") this.ssl = true;
			}
			if (this.ssl === "no-verify") this.ssl = { rejectUnauthorized: false };
			if (this.ssl && this.ssl.key) Object.defineProperty(this.ssl, "key", { enumerable: false });
			this.client_encoding = val("client_encoding", config);
			this.replication = val("replication", config);
			this.isDomainSocket = !(this.host || "").indexOf("/");
			this.application_name = val("application_name", config, "PGAPPNAME");
			this.fallback_application_name = val("fallback_application_name", config, false);
			this.statement_timeout = val("statement_timeout", config, false);
			this.lock_timeout = val("lock_timeout", config, false);
			this.idle_in_transaction_session_timeout = val("idle_in_transaction_session_timeout", config, false);
			this.query_timeout = val("query_timeout", config, false);
			if (config.connectionTimeoutMillis === void 0) this.connect_timeout = process.env.PGCONNECT_TIMEOUT || 0;
			else this.connect_timeout = Math.floor(config.connectionTimeoutMillis / 1e3);
			if (config.keepAlive === false) this.keepalives = 0;
			else if (config.keepAlive === true) this.keepalives = 1;
			if (typeof config.keepAliveInitialDelayMillis === "number") this.keepalives_idle = Math.floor(config.keepAliveInitialDelayMillis / 1e3);
		}
		getLibpqConnectionString(cb) {
			const params = [];
			add(params, this, "user");
			add(params, this, "password");
			add(params, this, "port");
			add(params, this, "application_name");
			add(params, this, "fallback_application_name");
			add(params, this, "connect_timeout");
			add(params, this, "options");
			const ssl = typeof this.ssl === "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
			add(params, ssl, "sslmode");
			add(params, ssl, "sslca");
			add(params, ssl, "sslkey");
			add(params, ssl, "sslcert");
			add(params, ssl, "sslrootcert");
			if (this.database) params.push("dbname=" + quoteParamValue(this.database));
			if (this.replication) params.push("replication=" + quoteParamValue(this.replication));
			if (this.host) params.push("host=" + quoteParamValue(this.host));
			if (this.isDomainSocket) return cb(null, params.join(" "));
			if (this.client_encoding) params.push("client_encoding=" + quoteParamValue(this.client_encoding));
			dns$2.lookup(this.host, function(err, address) {
				if (err) return cb(err, null);
				params.push("hostaddr=" + quoteParamValue(address));
				return cb(null, params.join(" "));
			});
		}
	};
	module.exports = ConnectionParameters$2;
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/result.js
var require_result = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const types$1 = require_pg_types();
	const matchRegexp = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/;
	var Result$3 = class {
		constructor(rowMode, types$3) {
			this.command = null;
			this.rowCount = null;
			this.oid = null;
			this.rows = [];
			this.fields = [];
			this._parsers = void 0;
			this._types = types$3;
			this.RowCtor = null;
			this.rowAsArray = rowMode === "array";
			if (this.rowAsArray) this.parseRow = this._parseRowAsArray;
			this._prebuiltEmptyResultObject = null;
		}
		addCommandComplete(msg) {
			let match;
			if (msg.text) match = matchRegexp.exec(msg.text);
			else match = matchRegexp.exec(msg.command);
			if (match) {
				this.command = match[1];
				if (match[3]) {
					this.oid = parseInt(match[2], 10);
					this.rowCount = parseInt(match[3], 10);
				} else if (match[2]) this.rowCount = parseInt(match[2], 10);
			}
		}
		_parseRowAsArray(rowData) {
			const row = new Array(rowData.length);
			for (let i = 0, len = rowData.length; i < len; i++) {
				const rawValue = rowData[i];
				if (rawValue !== null) row[i] = this._parsers[i](rawValue);
				else row[i] = null;
			}
			return row;
		}
		parseRow(rowData) {
			const row = { ...this._prebuiltEmptyResultObject };
			for (let i = 0, len = rowData.length; i < len; i++) {
				const rawValue = rowData[i];
				const field = this.fields[i].name;
				if (rawValue !== null) {
					const v = this.fields[i].format === "binary" ? Buffer.from(rawValue) : rawValue;
					row[field] = this._parsers[i](v);
				} else row[field] = null;
			}
			return row;
		}
		addRow(row) {
			this.rows.push(row);
		}
		addFields(fieldDescriptions) {
			this.fields = fieldDescriptions;
			if (this.fields.length) this._parsers = new Array(fieldDescriptions.length);
			const row = {};
			for (let i = 0; i < fieldDescriptions.length; i++) {
				const desc$1 = fieldDescriptions[i];
				row[desc$1.name] = null;
				if (this._types) this._parsers[i] = this._types.getTypeParser(desc$1.dataTypeID, desc$1.format || "text");
				else this._parsers[i] = types$1.getTypeParser(desc$1.dataTypeID, desc$1.format || "text");
			}
			this._prebuiltEmptyResultObject = { ...row };
		}
	};
	module.exports = Result$3;
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/query.js
var require_query$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { EventEmitter: EventEmitter$11 } = __require("events");
	const Result$2 = require_result();
	const utils$3 = require_utils$1();
	var Query$2 = class extends EventEmitter$11 {
		constructor(config, values, callback) {
			super();
			config = utils$3.normalizeQueryConfig(config, values, callback);
			this.text = config.text;
			this.values = config.values;
			this.rows = config.rows;
			this.types = config.types;
			this.name = config.name;
			this.queryMode = config.queryMode;
			this.binary = config.binary;
			this.portal = config.portal || "";
			this.callback = config.callback;
			this._rowMode = config.rowMode;
			if (process.domain && config.callback) this.callback = process.domain.bind(config.callback);
			this._result = new Result$2(this._rowMode, this.types);
			this._results = this._result;
			this._canceledDueToError = false;
		}
		requiresPreparation() {
			if (this.queryMode === "extended") return true;
			if (this.name) return true;
			if (this.rows) return true;
			if (!this.text) return false;
			if (!this.values) return false;
			return this.values.length > 0;
		}
		_checkForMultirow() {
			if (this._result.command) {
				if (!Array.isArray(this._results)) this._results = [this._result];
				this._result = new Result$2(this._rowMode, this._result._types);
				this._results.push(this._result);
			}
		}
		handleRowDescription(msg) {
			this._checkForMultirow();
			this._result.addFields(msg.fields);
			this._accumulateRows = this.callback || !this.listeners("row").length;
		}
		handleDataRow(msg) {
			let row;
			if (this._canceledDueToError) return;
			try {
				row = this._result.parseRow(msg.fields);
			} catch (err) {
				this._canceledDueToError = err;
				return;
			}
			this.emit("row", row, this._result);
			if (this._accumulateRows) this._result.addRow(row);
		}
		handleCommandComplete(msg, connection) {
			this._checkForMultirow();
			this._result.addCommandComplete(msg);
			if (this.rows) connection.sync();
		}
		handleEmptyQuery(connection) {
			if (this.rows) connection.sync();
		}
		handleError(err, connection) {
			if (this._canceledDueToError) {
				err = this._canceledDueToError;
				this._canceledDueToError = false;
			}
			if (this.callback) return this.callback(err);
			this.emit("error", err);
		}
		handleReadyForQuery(con) {
			if (this._canceledDueToError) return this.handleError(this._canceledDueToError, con);
			if (this.callback) try {
				this.callback(null, this._results);
			} catch (err) {
				process.nextTick(() => {
					throw err;
				});
			}
			this.emit("end", this._results);
		}
		submit(connection) {
			if (typeof this.text !== "string" && typeof this.name !== "string") return /* @__PURE__ */ new Error("A query must have either text or a name. Supplying neither is unsupported.");
			const previous = connection.parsedStatements[this.name];
			if (this.text && previous && this.text !== previous) return /* @__PURE__ */ new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
			if (this.values && !Array.isArray(this.values)) return /* @__PURE__ */ new Error("Query values must be an array");
			if (this.requiresPreparation()) {
				connection.stream.cork && connection.stream.cork();
				try {
					this.prepare(connection);
				} finally {
					connection.stream.uncork && connection.stream.uncork();
				}
			} else connection.query(this.text);
			return null;
		}
		hasBeenParsed(connection) {
			return this.name && connection.parsedStatements[this.name];
		}
		handlePortalSuspended(connection) {
			this._getRows(connection, this.rows);
		}
		_getRows(connection, rows) {
			connection.execute({
				portal: this.portal,
				rows
			});
			if (!rows) connection.sync();
			else connection.flush();
		}
		prepare(connection) {
			if (!this.hasBeenParsed(connection)) connection.parse({
				text: this.text,
				name: this.name,
				types: this.types
			});
			try {
				connection.bind({
					portal: this.portal,
					statement: this.name,
					values: this.values,
					binary: this.binary,
					valueMapper: utils$3.prepareValue
				});
			} catch (err) {
				this.handleError(err, connection);
				return;
			}
			connection.describe({
				type: "P",
				name: this.portal || ""
			});
			this._getRows(connection, this.rows);
		}
		handleCopyInResponse(connection) {
			connection.sendCopyFail("No source stream defined");
		}
		handleCopyData(msg, connection) {}
	};
	module.exports = Query$2;
}));

//#endregion
//#region ../../node_modules/.bun/pg-protocol@1.11.0/node_modules/pg-protocol/dist/messages.js
var require_messages = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.NoticeMessage = exports.DataRowMessage = exports.CommandCompleteMessage = exports.ReadyForQueryMessage = exports.NotificationResponseMessage = exports.BackendKeyDataMessage = exports.AuthenticationMD5Password = exports.ParameterStatusMessage = exports.ParameterDescriptionMessage = exports.RowDescriptionMessage = exports.Field = exports.CopyResponse = exports.CopyDataMessage = exports.DatabaseError = exports.copyDone = exports.emptyQuery = exports.replicationStart = exports.portalSuspended = exports.noData = exports.closeComplete = exports.bindComplete = exports.parseComplete = void 0;
	exports.parseComplete = {
		name: "parseComplete",
		length: 5
	};
	exports.bindComplete = {
		name: "bindComplete",
		length: 5
	};
	exports.closeComplete = {
		name: "closeComplete",
		length: 5
	};
	exports.noData = {
		name: "noData",
		length: 5
	};
	exports.portalSuspended = {
		name: "portalSuspended",
		length: 5
	};
	exports.replicationStart = {
		name: "replicationStart",
		length: 4
	};
	exports.emptyQuery = {
		name: "emptyQuery",
		length: 4
	};
	exports.copyDone = {
		name: "copyDone",
		length: 4
	};
	var DatabaseError$2 = class extends Error {
		constructor(message, length, name) {
			super(message);
			this.length = length;
			this.name = name;
		}
	};
	exports.DatabaseError = DatabaseError$2;
	var CopyDataMessage = class {
		constructor(length, chunk) {
			this.length = length;
			this.chunk = chunk;
			this.name = "copyData";
		}
	};
	exports.CopyDataMessage = CopyDataMessage;
	var CopyResponse = class {
		constructor(length, name, binary, columnCount) {
			this.length = length;
			this.name = name;
			this.binary = binary;
			this.columnTypes = new Array(columnCount);
		}
	};
	exports.CopyResponse = CopyResponse;
	var Field = class {
		constructor(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, format) {
			this.name = name;
			this.tableID = tableID;
			this.columnID = columnID;
			this.dataTypeID = dataTypeID;
			this.dataTypeSize = dataTypeSize;
			this.dataTypeModifier = dataTypeModifier;
			this.format = format;
		}
	};
	exports.Field = Field;
	var RowDescriptionMessage = class {
		constructor(length, fieldCount) {
			this.length = length;
			this.fieldCount = fieldCount;
			this.name = "rowDescription";
			this.fields = new Array(this.fieldCount);
		}
	};
	exports.RowDescriptionMessage = RowDescriptionMessage;
	var ParameterDescriptionMessage = class {
		constructor(length, parameterCount) {
			this.length = length;
			this.parameterCount = parameterCount;
			this.name = "parameterDescription";
			this.dataTypeIDs = new Array(this.parameterCount);
		}
	};
	exports.ParameterDescriptionMessage = ParameterDescriptionMessage;
	var ParameterStatusMessage = class {
		constructor(length, parameterName, parameterValue) {
			this.length = length;
			this.parameterName = parameterName;
			this.parameterValue = parameterValue;
			this.name = "parameterStatus";
		}
	};
	exports.ParameterStatusMessage = ParameterStatusMessage;
	var AuthenticationMD5Password = class {
		constructor(length, salt) {
			this.length = length;
			this.salt = salt;
			this.name = "authenticationMD5Password";
		}
	};
	exports.AuthenticationMD5Password = AuthenticationMD5Password;
	var BackendKeyDataMessage = class {
		constructor(length, processID, secretKey) {
			this.length = length;
			this.processID = processID;
			this.secretKey = secretKey;
			this.name = "backendKeyData";
		}
	};
	exports.BackendKeyDataMessage = BackendKeyDataMessage;
	var NotificationResponseMessage = class {
		constructor(length, processId, channel, payload) {
			this.length = length;
			this.processId = processId;
			this.channel = channel;
			this.payload = payload;
			this.name = "notification";
		}
	};
	exports.NotificationResponseMessage = NotificationResponseMessage;
	var ReadyForQueryMessage = class {
		constructor(length, status) {
			this.length = length;
			this.status = status;
			this.name = "readyForQuery";
		}
	};
	exports.ReadyForQueryMessage = ReadyForQueryMessage;
	var CommandCompleteMessage = class {
		constructor(length, text$1) {
			this.length = length;
			this.text = text$1;
			this.name = "commandComplete";
		}
	};
	exports.CommandCompleteMessage = CommandCompleteMessage;
	var DataRowMessage = class {
		constructor(length, fields) {
			this.length = length;
			this.fields = fields;
			this.name = "dataRow";
			this.fieldCount = fields.length;
		}
	};
	exports.DataRowMessage = DataRowMessage;
	var NoticeMessage = class {
		constructor(length, message) {
			this.length = length;
			this.message = message;
			this.name = "notice";
		}
	};
	exports.NoticeMessage = NoticeMessage;
}));

//#endregion
//#region ../../node_modules/.bun/pg-protocol@1.11.0/node_modules/pg-protocol/dist/buffer-writer.js
var require_buffer_writer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Writer = void 0;
	var Writer = class {
		constructor(size = 256) {
			this.size = size;
			this.offset = 5;
			this.headerPosition = 0;
			this.buffer = Buffer.allocUnsafe(size);
		}
		ensure(size) {
			if (this.buffer.length - this.offset < size) {
				const oldBuffer = this.buffer;
				const newSize = oldBuffer.length + (oldBuffer.length >> 1) + size;
				this.buffer = Buffer.allocUnsafe(newSize);
				oldBuffer.copy(this.buffer);
			}
		}
		addInt32(num) {
			this.ensure(4);
			this.buffer[this.offset++] = num >>> 24 & 255;
			this.buffer[this.offset++] = num >>> 16 & 255;
			this.buffer[this.offset++] = num >>> 8 & 255;
			this.buffer[this.offset++] = num >>> 0 & 255;
			return this;
		}
		addInt16(num) {
			this.ensure(2);
			this.buffer[this.offset++] = num >>> 8 & 255;
			this.buffer[this.offset++] = num >>> 0 & 255;
			return this;
		}
		addCString(string) {
			if (!string) this.ensure(1);
			else {
				const len = Buffer.byteLength(string);
				this.ensure(len + 1);
				this.buffer.write(string, this.offset, "utf-8");
				this.offset += len;
			}
			this.buffer[this.offset++] = 0;
			return this;
		}
		addString(string = "") {
			const len = Buffer.byteLength(string);
			this.ensure(len);
			this.buffer.write(string, this.offset);
			this.offset += len;
			return this;
		}
		add(otherBuffer) {
			this.ensure(otherBuffer.length);
			otherBuffer.copy(this.buffer, this.offset);
			this.offset += otherBuffer.length;
			return this;
		}
		join(code) {
			if (code) {
				this.buffer[this.headerPosition] = code;
				const length = this.offset - (this.headerPosition + 1);
				this.buffer.writeInt32BE(length, this.headerPosition + 1);
			}
			return this.buffer.slice(code ? 0 : 5, this.offset);
		}
		flush(code) {
			const result = this.join(code);
			this.offset = 5;
			this.headerPosition = 0;
			this.buffer = Buffer.allocUnsafe(this.size);
			return result;
		}
	};
	exports.Writer = Writer;
}));

//#endregion
//#region ../../node_modules/.bun/pg-protocol@1.11.0/node_modules/pg-protocol/dist/serializer.js
var require_serializer = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.serialize = void 0;
	const buffer_writer_1 = require_buffer_writer();
	const writer = new buffer_writer_1.Writer();
	const startup = (opts) => {
		writer.addInt16(3).addInt16(0);
		for (const key of Object.keys(opts)) writer.addCString(key).addCString(opts[key]);
		writer.addCString("client_encoding").addCString("UTF8");
		const bodyBuffer = writer.addCString("").flush();
		const length = bodyBuffer.length + 4;
		return new buffer_writer_1.Writer().addInt32(length).add(bodyBuffer).flush();
	};
	const requestSsl = () => {
		const response = Buffer.allocUnsafe(8);
		response.writeInt32BE(8, 0);
		response.writeInt32BE(80877103, 4);
		return response;
	};
	const password = (password$1) => {
		return writer.addCString(password$1).flush(112);
	};
	const sendSASLInitialResponseMessage = function(mechanism, initialResponse) {
		writer.addCString(mechanism).addInt32(Buffer.byteLength(initialResponse)).addString(initialResponse);
		return writer.flush(112);
	};
	const sendSCRAMClientFinalMessage = function(additionalData) {
		return writer.addString(additionalData).flush(112);
	};
	const query = (text$1) => {
		return writer.addCString(text$1).flush(81);
	};
	const emptyArray = [];
	const parse$2 = (query$1) => {
		const name = query$1.name || "";
		if (name.length > 63) {
			console.error("Warning! Postgres only supports 63 characters for query names.");
			console.error("You supplied %s (%s)", name, name.length);
			console.error("This can cause conflicts and silent errors executing queries");
		}
		const types$3 = query$1.types || emptyArray;
		const len = types$3.length;
		const buffer = writer.addCString(name).addCString(query$1.text).addInt16(len);
		for (let i = 0; i < len; i++) buffer.addInt32(types$3[i]);
		return writer.flush(80);
	};
	const paramWriter = new buffer_writer_1.Writer();
	const writeValues = function(values, valueMapper) {
		for (let i = 0; i < values.length; i++) {
			const mappedVal = valueMapper ? valueMapper(values[i], i) : values[i];
			if (mappedVal == null) {
				writer.addInt16(0);
				paramWriter.addInt32(-1);
			} else if (mappedVal instanceof Buffer) {
				writer.addInt16(1);
				paramWriter.addInt32(mappedVal.length);
				paramWriter.add(mappedVal);
			} else {
				writer.addInt16(0);
				paramWriter.addInt32(Buffer.byteLength(mappedVal));
				paramWriter.addString(mappedVal);
			}
		}
	};
	const bind = (config = {}) => {
		const portal = config.portal || "";
		const statement = config.statement || "";
		const binary = config.binary || false;
		const values = config.values || emptyArray;
		const len = values.length;
		writer.addCString(portal).addCString(statement);
		writer.addInt16(len);
		writeValues(values, config.valueMapper);
		writer.addInt16(len);
		writer.add(paramWriter.flush());
		writer.addInt16(1);
		writer.addInt16(binary ? 1 : 0);
		return writer.flush(66);
	};
	const emptyExecute = Buffer.from([
		69,
		0,
		0,
		0,
		9,
		0,
		0,
		0,
		0,
		0
	]);
	const execute = (config) => {
		if (!config || !config.portal && !config.rows) return emptyExecute;
		const portal = config.portal || "";
		const rows = config.rows || 0;
		const portalLength = Buffer.byteLength(portal);
		const len = 4 + portalLength + 1 + 4;
		const buff = Buffer.allocUnsafe(1 + len);
		buff[0] = 69;
		buff.writeInt32BE(len, 1);
		buff.write(portal, 5, "utf-8");
		buff[portalLength + 5] = 0;
		buff.writeUInt32BE(rows, buff.length - 4);
		return buff;
	};
	const cancel = (processID, secretKey) => {
		const buffer = Buffer.allocUnsafe(16);
		buffer.writeInt32BE(16, 0);
		buffer.writeInt16BE(1234, 4);
		buffer.writeInt16BE(5678, 6);
		buffer.writeInt32BE(processID, 8);
		buffer.writeInt32BE(secretKey, 12);
		return buffer;
	};
	const cstringMessage = (code, string) => {
		const len = 4 + Buffer.byteLength(string) + 1;
		const buffer = Buffer.allocUnsafe(1 + len);
		buffer[0] = code;
		buffer.writeInt32BE(len, 1);
		buffer.write(string, 5, "utf-8");
		buffer[len] = 0;
		return buffer;
	};
	const emptyDescribePortal = writer.addCString("P").flush(68);
	const emptyDescribeStatement = writer.addCString("S").flush(68);
	const describe = (msg) => {
		return msg.name ? cstringMessage(68, `${msg.type}${msg.name || ""}`) : msg.type === "P" ? emptyDescribePortal : emptyDescribeStatement;
	};
	const close = (msg) => {
		return cstringMessage(67, `${msg.type}${msg.name || ""}`);
	};
	const copyData = (chunk) => {
		return writer.add(chunk).flush(100);
	};
	const copyFail = (message) => {
		return cstringMessage(102, message);
	};
	const codeOnlyBuffer = (code) => Buffer.from([
		code,
		0,
		0,
		0,
		4
	]);
	const flushBuffer$1 = codeOnlyBuffer(72);
	const syncBuffer$1 = codeOnlyBuffer(83);
	const endBuffer$1 = codeOnlyBuffer(88);
	const copyDoneBuffer = codeOnlyBuffer(99);
	const serialize$1 = {
		startup,
		password,
		requestSsl,
		sendSASLInitialResponseMessage,
		sendSCRAMClientFinalMessage,
		query,
		parse: parse$2,
		bind,
		execute,
		describe,
		close,
		flush: () => flushBuffer$1,
		sync: () => syncBuffer$1,
		end: () => endBuffer$1,
		copyData,
		copyDone: () => copyDoneBuffer,
		copyFail,
		cancel
	};
	exports.serialize = serialize$1;
}));

//#endregion
//#region ../../node_modules/.bun/pg-protocol@1.11.0/node_modules/pg-protocol/dist/buffer-reader.js
var require_buffer_reader = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.BufferReader = void 0;
	const emptyBuffer$1 = Buffer.allocUnsafe(0);
	var BufferReader = class {
		constructor(offset = 0) {
			this.offset = offset;
			this.buffer = emptyBuffer$1;
			this.encoding = "utf-8";
		}
		setBuffer(offset, buffer) {
			this.offset = offset;
			this.buffer = buffer;
		}
		int16() {
			const result = this.buffer.readInt16BE(this.offset);
			this.offset += 2;
			return result;
		}
		byte() {
			const result = this.buffer[this.offset];
			this.offset++;
			return result;
		}
		int32() {
			const result = this.buffer.readInt32BE(this.offset);
			this.offset += 4;
			return result;
		}
		uint32() {
			const result = this.buffer.readUInt32BE(this.offset);
			this.offset += 4;
			return result;
		}
		string(length) {
			const result = this.buffer.toString(this.encoding, this.offset, this.offset + length);
			this.offset += length;
			return result;
		}
		cstring() {
			const start = this.offset;
			let end = start;
			while (this.buffer[end++] !== 0);
			this.offset = end;
			return this.buffer.toString(this.encoding, start, end - 1);
		}
		bytes(length) {
			const result = this.buffer.slice(this.offset, this.offset + length);
			this.offset += length;
			return result;
		}
	};
	exports.BufferReader = BufferReader;
}));

//#endregion
//#region ../../node_modules/.bun/pg-protocol@1.11.0/node_modules/pg-protocol/dist/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.Parser = void 0;
	const messages_1$1 = require_messages();
	const buffer_reader_1 = require_buffer_reader();
	const CODE_LENGTH = 1;
	const HEADER_LENGTH = CODE_LENGTH + 4;
	const LATEINIT_LENGTH = -1;
	const emptyBuffer = Buffer.allocUnsafe(0);
	var Parser = class {
		constructor(opts) {
			this.buffer = emptyBuffer;
			this.bufferLength = 0;
			this.bufferOffset = 0;
			this.reader = new buffer_reader_1.BufferReader();
			if ((opts === null || opts === void 0 ? void 0 : opts.mode) === "binary") throw new Error("Binary mode not supported yet");
			this.mode = (opts === null || opts === void 0 ? void 0 : opts.mode) || "text";
		}
		parse(buffer, callback) {
			this.mergeBuffer(buffer);
			const bufferFullLength = this.bufferOffset + this.bufferLength;
			let offset = this.bufferOffset;
			while (offset + HEADER_LENGTH <= bufferFullLength) {
				const code = this.buffer[offset];
				const length = this.buffer.readUInt32BE(offset + CODE_LENGTH);
				const fullMessageLength = CODE_LENGTH + length;
				if (fullMessageLength + offset <= bufferFullLength) {
					callback(this.handlePacket(offset + HEADER_LENGTH, code, length, this.buffer));
					offset += fullMessageLength;
				} else break;
			}
			if (offset === bufferFullLength) {
				this.buffer = emptyBuffer;
				this.bufferLength = 0;
				this.bufferOffset = 0;
			} else {
				this.bufferLength = bufferFullLength - offset;
				this.bufferOffset = offset;
			}
		}
		mergeBuffer(buffer) {
			if (this.bufferLength > 0) {
				const newLength = this.bufferLength + buffer.byteLength;
				if (newLength + this.bufferOffset > this.buffer.byteLength) {
					let newBuffer;
					if (newLength <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) newBuffer = this.buffer;
					else {
						let newBufferLength = this.buffer.byteLength * 2;
						while (newLength >= newBufferLength) newBufferLength *= 2;
						newBuffer = Buffer.allocUnsafe(newBufferLength);
					}
					this.buffer.copy(newBuffer, 0, this.bufferOffset, this.bufferOffset + this.bufferLength);
					this.buffer = newBuffer;
					this.bufferOffset = 0;
				}
				buffer.copy(this.buffer, this.bufferOffset + this.bufferLength);
				this.bufferLength = newLength;
			} else {
				this.buffer = buffer;
				this.bufferOffset = 0;
				this.bufferLength = buffer.byteLength;
			}
		}
		handlePacket(offset, code, length, bytes) {
			const { reader } = this;
			reader.setBuffer(offset, bytes);
			let message;
			switch (code) {
				case 50:
					message = messages_1$1.bindComplete;
					break;
				case 49:
					message = messages_1$1.parseComplete;
					break;
				case 51:
					message = messages_1$1.closeComplete;
					break;
				case 110:
					message = messages_1$1.noData;
					break;
				case 115:
					message = messages_1$1.portalSuspended;
					break;
				case 99:
					message = messages_1$1.copyDone;
					break;
				case 87:
					message = messages_1$1.replicationStart;
					break;
				case 73:
					message = messages_1$1.emptyQuery;
					break;
				case 68:
					message = parseDataRowMessage(reader);
					break;
				case 67:
					message = parseCommandCompleteMessage(reader);
					break;
				case 90:
					message = parseReadyForQueryMessage(reader);
					break;
				case 65:
					message = parseNotificationMessage(reader);
					break;
				case 82:
					message = parseAuthenticationResponse(reader, length);
					break;
				case 83:
					message = parseParameterStatusMessage(reader);
					break;
				case 75:
					message = parseBackendKeyData(reader);
					break;
				case 69:
					message = parseErrorMessage(reader, "error");
					break;
				case 78:
					message = parseErrorMessage(reader, "notice");
					break;
				case 84:
					message = parseRowDescriptionMessage(reader);
					break;
				case 116:
					message = parseParameterDescriptionMessage(reader);
					break;
				case 71:
					message = parseCopyInMessage(reader);
					break;
				case 72:
					message = parseCopyOutMessage(reader);
					break;
				case 100:
					message = parseCopyData(reader, length);
					break;
				default: return new messages_1$1.DatabaseError("received invalid response: " + code.toString(16), length, "error");
			}
			reader.setBuffer(0, emptyBuffer);
			message.length = length;
			return message;
		}
	};
	exports.Parser = Parser;
	const parseReadyForQueryMessage = (reader) => {
		const status = reader.string(1);
		return new messages_1$1.ReadyForQueryMessage(LATEINIT_LENGTH, status);
	};
	const parseCommandCompleteMessage = (reader) => {
		const text$1 = reader.cstring();
		return new messages_1$1.CommandCompleteMessage(LATEINIT_LENGTH, text$1);
	};
	const parseCopyData = (reader, length) => {
		const chunk = reader.bytes(length - 4);
		return new messages_1$1.CopyDataMessage(LATEINIT_LENGTH, chunk);
	};
	const parseCopyInMessage = (reader) => parseCopyMessage(reader, "copyInResponse");
	const parseCopyOutMessage = (reader) => parseCopyMessage(reader, "copyOutResponse");
	const parseCopyMessage = (reader, messageName) => {
		const isBinary = reader.byte() !== 0;
		const columnCount = reader.int16();
		const message = new messages_1$1.CopyResponse(LATEINIT_LENGTH, messageName, isBinary, columnCount);
		for (let i = 0; i < columnCount; i++) message.columnTypes[i] = reader.int16();
		return message;
	};
	const parseNotificationMessage = (reader) => {
		const processId = reader.int32();
		const channel = reader.cstring();
		const payload = reader.cstring();
		return new messages_1$1.NotificationResponseMessage(LATEINIT_LENGTH, processId, channel, payload);
	};
	const parseRowDescriptionMessage = (reader) => {
		const fieldCount = reader.int16();
		const message = new messages_1$1.RowDescriptionMessage(LATEINIT_LENGTH, fieldCount);
		for (let i = 0; i < fieldCount; i++) message.fields[i] = parseField(reader);
		return message;
	};
	const parseField = (reader) => {
		const name = reader.cstring();
		const tableID = reader.uint32();
		const columnID = reader.int16();
		const dataTypeID = reader.uint32();
		const dataTypeSize = reader.int16();
		const dataTypeModifier = reader.int32();
		const mode = reader.int16() === 0 ? "text" : "binary";
		return new messages_1$1.Field(name, tableID, columnID, dataTypeID, dataTypeSize, dataTypeModifier, mode);
	};
	const parseParameterDescriptionMessage = (reader) => {
		const parameterCount = reader.int16();
		const message = new messages_1$1.ParameterDescriptionMessage(LATEINIT_LENGTH, parameterCount);
		for (let i = 0; i < parameterCount; i++) message.dataTypeIDs[i] = reader.int32();
		return message;
	};
	const parseDataRowMessage = (reader) => {
		const fieldCount = reader.int16();
		const fields = new Array(fieldCount);
		for (let i = 0; i < fieldCount; i++) {
			const len = reader.int32();
			fields[i] = len === -1 ? null : reader.string(len);
		}
		return new messages_1$1.DataRowMessage(LATEINIT_LENGTH, fields);
	};
	const parseParameterStatusMessage = (reader) => {
		const name = reader.cstring();
		const value = reader.cstring();
		return new messages_1$1.ParameterStatusMessage(LATEINIT_LENGTH, name, value);
	};
	const parseBackendKeyData = (reader) => {
		const processID = reader.int32();
		const secretKey = reader.int32();
		return new messages_1$1.BackendKeyDataMessage(LATEINIT_LENGTH, processID, secretKey);
	};
	const parseAuthenticationResponse = (reader, length) => {
		const code = reader.int32();
		const message = {
			name: "authenticationOk",
			length
		};
		switch (code) {
			case 0: break;
			case 3:
				if (message.length === 8) message.name = "authenticationCleartextPassword";
				break;
			case 5:
				if (message.length === 12) {
					message.name = "authenticationMD5Password";
					const salt = reader.bytes(4);
					return new messages_1$1.AuthenticationMD5Password(LATEINIT_LENGTH, salt);
				}
				break;
			case 10:
				{
					message.name = "authenticationSASL";
					message.mechanisms = [];
					let mechanism;
					do {
						mechanism = reader.cstring();
						if (mechanism) message.mechanisms.push(mechanism);
					} while (mechanism);
				}
				break;
			case 11:
				message.name = "authenticationSASLContinue";
				message.data = reader.string(length - 8);
				break;
			case 12:
				message.name = "authenticationSASLFinal";
				message.data = reader.string(length - 8);
				break;
			default: throw new Error("Unknown authenticationOk message type " + code);
		}
		return message;
	};
	const parseErrorMessage = (reader, name) => {
		const fields = {};
		let fieldType = reader.string(1);
		while (fieldType !== "\0") {
			fields[fieldType] = reader.cstring();
			fieldType = reader.string(1);
		}
		const messageValue = fields.M;
		const message = name === "notice" ? new messages_1$1.NoticeMessage(LATEINIT_LENGTH, messageValue) : new messages_1$1.DatabaseError(messageValue, LATEINIT_LENGTH, name);
		message.severity = fields.S;
		message.code = fields.C;
		message.detail = fields.D;
		message.hint = fields.H;
		message.position = fields.P;
		message.internalPosition = fields.p;
		message.internalQuery = fields.q;
		message.where = fields.W;
		message.schema = fields.s;
		message.table = fields.t;
		message.column = fields.c;
		message.dataType = fields.d;
		message.constraint = fields.n;
		message.file = fields.F;
		message.line = fields.L;
		message.routine = fields.R;
		return message;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg-protocol@1.11.0/node_modules/pg-protocol/dist/index.js
var require_dist = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.DatabaseError = exports.serialize = exports.parse = void 0;
	const messages_1 = require_messages();
	Object.defineProperty(exports, "DatabaseError", {
		enumerable: true,
		get: function() {
			return messages_1.DatabaseError;
		}
	});
	const serializer_1 = require_serializer();
	Object.defineProperty(exports, "serialize", {
		enumerable: true,
		get: function() {
			return serializer_1.serialize;
		}
	});
	const parser_1 = require_parser();
	function parse$1(stream, callback) {
		const parser = new parser_1.Parser();
		stream.on("data", (buffer) => parser.parse(buffer, callback));
		return new Promise((resolve$1) => stream.on("end", () => resolve$1()));
	}
	exports.parse = parse$1;
}));

//#endregion
//#region ../../node_modules/.bun/pg-cloudflare@1.3.0/node_modules/pg-cloudflare/dist/empty.js
var require_empty = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.default = {};
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/stream.js
var require_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { getStream: getStream$1, getSecureStream: getSecureStream$1 } = getStreamFuncs();
	module.exports = {
		getStream: getStream$1,
		getSecureStream: getSecureStream$1
	};
	/**
	* The stream functions that work in Node.js
	*/
	function getNodejsStreamFuncs() {
		function getStream$2(ssl) {
			return new (__require("net")).Socket();
		}
		function getSecureStream$2(options) {
			return __require("tls").connect(options);
		}
		return {
			getStream: getStream$2,
			getSecureStream: getSecureStream$2
		};
	}
	/**
	* The stream functions that work in Cloudflare Workers
	*/
	function getCloudflareStreamFuncs() {
		function getStream$2(ssl) {
			const { CloudflareSocket } = require_empty();
			return new CloudflareSocket(ssl);
		}
		function getSecureStream$2(options) {
			options.socket.startTls(options);
			return options.socket;
		}
		return {
			getStream: getStream$2,
			getSecureStream: getSecureStream$2
		};
	}
	/**
	* Are we running in a Cloudflare Worker?
	*
	* @returns true if the code is currently running inside a Cloudflare Worker.
	*/
	function isCloudflareRuntime() {
		if (typeof navigator === "object" && navigator !== null && typeof navigator.userAgent === "string") return navigator.userAgent === "Cloudflare-Workers";
		if (typeof Response === "function") {
			const resp = new Response(null, { cf: { thing: true } });
			if (typeof resp.cf === "object" && resp.cf !== null && resp.cf.thing) return true;
		}
		return false;
	}
	function getStreamFuncs() {
		if (isCloudflareRuntime()) return getCloudflareStreamFuncs();
		return getNodejsStreamFuncs();
	}
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/connection.js
var require_connection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$10 = __require("events").EventEmitter;
	const { parse, serialize } = require_dist();
	const { getStream, getSecureStream } = require_stream();
	const flushBuffer = serialize.flush();
	const syncBuffer = serialize.sync();
	const endBuffer = serialize.end();
	var Connection$3 = class extends EventEmitter$10 {
		constructor(config) {
			super();
			config = config || {};
			this.stream = config.stream || getStream(config.ssl);
			if (typeof this.stream === "function") this.stream = this.stream(config);
			this._keepAlive = config.keepAlive;
			this._keepAliveInitialDelayMillis = config.keepAliveInitialDelayMillis;
			this.parsedStatements = {};
			this.ssl = config.ssl || false;
			this._ending = false;
			this._emitMessage = false;
			const self = this;
			this.on("newListener", function(eventName) {
				if (eventName === "message") self._emitMessage = true;
			});
		}
		connect(port, host) {
			const self = this;
			this._connecting = true;
			this.stream.setNoDelay(true);
			this.stream.connect(port, host);
			this.stream.once("connect", function() {
				if (self._keepAlive) self.stream.setKeepAlive(true, self._keepAliveInitialDelayMillis);
				self.emit("connect");
			});
			const reportStreamError = function(error$1) {
				if (self._ending && (error$1.code === "ECONNRESET" || error$1.code === "EPIPE")) return;
				self.emit("error", error$1);
			};
			this.stream.on("error", reportStreamError);
			this.stream.on("close", function() {
				self.emit("end");
			});
			if (!this.ssl) return this.attachListeners(this.stream);
			this.stream.once("data", function(buffer) {
				switch (buffer.toString("utf8")) {
					case "S": break;
					case "N":
						self.stream.end();
						return self.emit("error", /* @__PURE__ */ new Error("The server does not support SSL connections"));
					default:
						self.stream.end();
						return self.emit("error", /* @__PURE__ */ new Error("There was an error establishing an SSL connection"));
				}
				const options = { socket: self.stream };
				if (self.ssl !== true) {
					Object.assign(options, self.ssl);
					if ("key" in self.ssl) options.key = self.ssl.key;
				}
				const net$5 = __require("net");
				if (net$5.isIP && net$5.isIP(host) === 0) options.servername = host;
				try {
					self.stream = getSecureStream(options);
				} catch (err) {
					return self.emit("error", err);
				}
				self.attachListeners(self.stream);
				self.stream.on("error", reportStreamError);
				self.emit("sslconnect");
			});
		}
		attachListeners(stream) {
			parse(stream, (msg) => {
				const eventName = msg.name === "error" ? "errorMessage" : msg.name;
				if (this._emitMessage) this.emit("message", msg);
				this.emit(eventName, msg);
			});
		}
		requestSsl() {
			this.stream.write(serialize.requestSsl());
		}
		startup(config) {
			this.stream.write(serialize.startup(config));
		}
		cancel(processID, secretKey) {
			this._send(serialize.cancel(processID, secretKey));
		}
		password(password$1) {
			this._send(serialize.password(password$1));
		}
		sendSASLInitialResponseMessage(mechanism, initialResponse) {
			this._send(serialize.sendSASLInitialResponseMessage(mechanism, initialResponse));
		}
		sendSCRAMClientFinalMessage(additionalData) {
			this._send(serialize.sendSCRAMClientFinalMessage(additionalData));
		}
		_send(buffer) {
			if (!this.stream.writable) return false;
			return this.stream.write(buffer);
		}
		query(text$1) {
			this._send(serialize.query(text$1));
		}
		parse(query$1) {
			this._send(serialize.parse(query$1));
		}
		bind(config) {
			this._send(serialize.bind(config));
		}
		execute(config) {
			this._send(serialize.execute(config));
		}
		flush() {
			if (this.stream.writable) this.stream.write(flushBuffer);
		}
		sync() {
			this._ending = true;
			this._send(syncBuffer);
		}
		ref() {
			this.stream.ref();
		}
		unref() {
			this.stream.unref();
		}
		end() {
			this._ending = true;
			if (!this._connecting || !this.stream.writable) {
				this.stream.end();
				return;
			}
			return this.stream.write(endBuffer, () => {
				this.stream.end();
			});
		}
		close(msg) {
			this._send(serialize.close(msg));
		}
		describe(msg) {
			this._send(serialize.describe(msg));
		}
		sendCopyFromChunk(chunk) {
			this._send(serialize.copyData(chunk));
		}
		endCopyFrom() {
			this._send(serialize.copyDone());
		}
		sendCopyFail(msg) {
			this._send(serialize.copyFail(msg));
		}
	};
	module.exports = Connection$3;
}));

//#endregion
//#region ../../node_modules/.bun/split2@4.2.0/node_modules/split2/index.js
var require_split2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { Transform: Transform$8 } = __require("stream");
	const { StringDecoder } = __require("string_decoder");
	const kLast = Symbol("last");
	const kDecoder = Symbol("decoder");
	function transform(chunk, enc, cb) {
		let list;
		if (this.overflow) {
			list = this[kDecoder].write(chunk).split(this.matcher);
			if (list.length === 1) return cb();
			list.shift();
			this.overflow = false;
		} else {
			this[kLast] += this[kDecoder].write(chunk);
			list = this[kLast].split(this.matcher);
		}
		this[kLast] = list.pop();
		for (let i = 0; i < list.length; i++) try {
			push(this, this.mapper(list[i]));
		} catch (error$1) {
			return cb(error$1);
		}
		this.overflow = this[kLast].length > this.maxLength;
		if (this.overflow && !this.skipOverflow) {
			cb(/* @__PURE__ */ new Error("maximum buffer reached"));
			return;
		}
		cb();
	}
	function flush(cb) {
		this[kLast] += this[kDecoder].end();
		if (this[kLast]) try {
			push(this, this.mapper(this[kLast]));
		} catch (error$1) {
			return cb(error$1);
		}
		cb();
	}
	function push(self, val$1) {
		if (val$1 !== void 0) self.push(val$1);
	}
	function noop(incoming) {
		return incoming;
	}
	function split$1(matcher$1, mapper, options) {
		matcher$1 = matcher$1 || /\r?\n/;
		mapper = mapper || noop;
		options = options || {};
		switch (arguments.length) {
			case 1:
				if (typeof matcher$1 === "function") {
					mapper = matcher$1;
					matcher$1 = /\r?\n/;
				} else if (typeof matcher$1 === "object" && !(matcher$1 instanceof RegExp) && !matcher$1[Symbol.split]) {
					options = matcher$1;
					matcher$1 = /\r?\n/;
				}
				break;
			case 2: if (typeof matcher$1 === "function") {
				options = mapper;
				mapper = matcher$1;
				matcher$1 = /\r?\n/;
			} else if (typeof mapper === "object") {
				options = mapper;
				mapper = noop;
			}
		}
		options = Object.assign({}, options);
		options.autoDestroy = true;
		options.transform = transform;
		options.flush = flush;
		options.readableObjectMode = true;
		const stream = new Transform$8(options);
		stream[kLast] = "";
		stream[kDecoder] = new StringDecoder("utf8");
		stream.matcher = matcher$1;
		stream.mapper = mapper;
		stream.maxLength = options.maxLength;
		stream.skipOverflow = options.skipOverflow || false;
		stream.overflow = false;
		stream._destroy = function(err, cb) {
			this._writableState.errorEmitted = false;
			cb(err);
		};
		return stream;
	}
	module.exports = split$1;
}));

//#endregion
//#region ../../node_modules/.bun/pgpass@1.0.5/node_modules/pgpass/lib/helper.js
var require_helper = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var path$2 = __require("path"), Stream$1 = __require("stream").Stream, split = require_split2(), util$4 = __require("util"), defaultPort = 5432, isWin = process.platform === "win32", warnStream = process.stderr;
	var S_IRWXG = 56, S_IRWXO = 7, S_IFMT = 61440, S_IFREG = 32768;
	function isRegFile(mode) {
		return (mode & S_IFMT) == S_IFREG;
	}
	var fieldNames = [
		"host",
		"port",
		"database",
		"user",
		"password"
	];
	var nrOfFields = fieldNames.length;
	var passKey = fieldNames[nrOfFields - 1];
	function warn() {
		if (warnStream instanceof Stream$1 && true === warnStream.writable) {
			var args = Array.prototype.slice.call(arguments).concat("\n");
			warnStream.write(util$4.format.apply(util$4, args));
		}
	}
	Object.defineProperty(module.exports, "isWin", {
		get: function() {
			return isWin;
		},
		set: function(val$1) {
			isWin = val$1;
		}
	});
	module.exports.warnTo = function(stream) {
		var old = warnStream;
		warnStream = stream;
		return old;
	};
	module.exports.getFileName = function(rawEnv) {
		var env$1 = rawEnv || process.env;
		return env$1.PGPASSFILE || (isWin ? path$2.join(env$1.APPDATA || "./", "postgresql", "pgpass.conf") : path$2.join(env$1.HOME || "./", ".pgpass"));
	};
	module.exports.usePgPass = function(stats, fname) {
		if (Object.prototype.hasOwnProperty.call(process.env, "PGPASSWORD")) return false;
		if (isWin) return true;
		fname = fname || "<unkn>";
		if (!isRegFile(stats.mode)) {
			warn("WARNING: password file \"%s\" is not a plain file", fname);
			return false;
		}
		if (stats.mode & (S_IRWXG | S_IRWXO)) {
			warn("WARNING: password file \"%s\" has group or world access; permissions should be u=rw (0600) or less", fname);
			return false;
		}
		return true;
	};
	var matcher = module.exports.match = function(connInfo, entry) {
		return fieldNames.slice(0, -1).reduce(function(prev, field, idx) {
			if (idx == 1) {
				if (Number(connInfo[field] || defaultPort) === Number(entry[field])) return prev && true;
			}
			return prev && (entry[field] === "*" || entry[field] === connInfo[field]);
		}, true);
	};
	module.exports.getPassword = function(connInfo, stream, cb) {
		var pass;
		var lineStream = stream.pipe(split());
		function onLine(line) {
			var entry = parseLine(line);
			if (entry && isValidEntry(entry) && matcher(connInfo, entry)) {
				pass = entry[passKey];
				lineStream.end();
			}
		}
		var onEnd = function() {
			stream.destroy();
			cb(pass);
		};
		var onErr = function(err) {
			stream.destroy();
			warn("WARNING: error on reading file: %s", err);
			cb(void 0);
		};
		stream.on("error", onErr);
		lineStream.on("data", onLine).on("end", onEnd).on("error", onErr);
	};
	var parseLine = module.exports.parseLine = function(line) {
		if (line.length < 11 || line.match(/^\s+#/)) return null;
		var curChar = "";
		var prevChar = "";
		var fieldIdx = 0;
		var startIdx = 0;
		var obj = {};
		var isLastField = false;
		var addToObj = function(idx, i0, i1) {
			var field = line.substring(i0, i1);
			if (!Object.hasOwnProperty.call(process.env, "PGPASS_NO_DEESCAPE")) field = field.replace(/\\([:\\])/g, "$1");
			obj[fieldNames[idx]] = field;
		};
		for (var i = 0; i < line.length - 1; i += 1) {
			curChar = line.charAt(i + 1);
			prevChar = line.charAt(i);
			isLastField = fieldIdx == nrOfFields - 1;
			if (isLastField) {
				addToObj(fieldIdx, startIdx);
				break;
			}
			if (i >= 0 && curChar == ":" && prevChar !== "\\") {
				addToObj(fieldIdx, startIdx, i + 1);
				startIdx = i + 2;
				fieldIdx += 1;
			}
		}
		obj = Object.keys(obj).length === nrOfFields ? obj : null;
		return obj;
	};
	var isValidEntry = module.exports.isValidEntry = function(entry) {
		var rules = {
			0: function(x) {
				return x.length > 0;
			},
			1: function(x) {
				if (x === "*") return true;
				x = Number(x);
				return isFinite(x) && x > 0 && x < 9007199254740992 && Math.floor(x) === x;
			},
			2: function(x) {
				return x.length > 0;
			},
			3: function(x) {
				return x.length > 0;
			},
			4: function(x) {
				return x.length > 0;
			}
		};
		for (var idx = 0; idx < fieldNames.length; idx += 1) {
			var rule = rules[idx];
			if (!rule(entry[fieldNames[idx]] || "")) return false;
		}
		return true;
	};
}));

//#endregion
//#region ../../node_modules/.bun/pgpass@1.0.5/node_modules/pgpass/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	__require("path");
	var fs$3 = __require("fs"), helper = require_helper();
	module.exports = function(connInfo, cb) {
		var file = helper.getFileName();
		fs$3.stat(file, function(err, stat) {
			if (err || !helper.usePgPass(stat, file)) return cb(void 0);
			var st = fs$3.createReadStream(file);
			helper.getPassword(connInfo, st, cb);
		});
	};
	module.exports.warnTo = helper.warnTo;
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/client.js
var require_client$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$9 = __require("events").EventEmitter;
	const utils$2 = require_utils$1();
	const nodeUtils = __require("util");
	const sasl = require_sasl();
	const TypeOverrides$3 = require_type_overrides();
	const ConnectionParameters$1 = require_connection_parameters();
	const Query$1 = require_query$1();
	const defaults$2 = require_defaults();
	const Connection$2 = require_connection();
	const crypto$8 = require_utils();
	const activeQueryDeprecationNotice = nodeUtils.deprecate(() => {}, "Client.activeQuery is deprecated and will be removed in a future version.");
	const queryQueueDeprecationNotice = nodeUtils.deprecate(() => {}, "Client.queryQueue is deprecated and will be removed in a future version.");
	const pgPassDeprecationNotice = nodeUtils.deprecate(() => {}, "pgpass support is deprecated and will be removed in a future version. You can provide an async function as the password property to the Client/Pool constructor that returns a password instead. Within this funciton you can call the pgpass module in your own code.");
	const byoPromiseDeprecationNotice = nodeUtils.deprecate(() => {}, "Passing a custom Promise implementation to the Client/Pool constructor is deprecated and will be removed in a future version.");
	var Client$3 = class extends EventEmitter$9 {
		constructor(config) {
			super();
			this.connectionParameters = new ConnectionParameters$1(config);
			this.user = this.connectionParameters.user;
			this.database = this.connectionParameters.database;
			this.port = this.connectionParameters.port;
			this.host = this.connectionParameters.host;
			Object.defineProperty(this, "password", {
				configurable: true,
				enumerable: false,
				writable: true,
				value: this.connectionParameters.password
			});
			this.replication = this.connectionParameters.replication;
			const c = config || {};
			if (c.Promise) byoPromiseDeprecationNotice();
			this._Promise = c.Promise || global.Promise;
			this._types = new TypeOverrides$3(c.types);
			this._ending = false;
			this._ended = false;
			this._connecting = false;
			this._connected = false;
			this._connectionError = false;
			this._queryable = true;
			this._activeQuery = null;
			this.enableChannelBinding = Boolean(c.enableChannelBinding);
			this.connection = c.connection || new Connection$2({
				stream: c.stream,
				ssl: this.connectionParameters.ssl,
				keepAlive: c.keepAlive || false,
				keepAliveInitialDelayMillis: c.keepAliveInitialDelayMillis || 0,
				encoding: this.connectionParameters.client_encoding || "utf8"
			});
			this._queryQueue = [];
			this.binary = c.binary || defaults$2.binary;
			this.processID = null;
			this.secretKey = null;
			this.ssl = this.connectionParameters.ssl || false;
			if (this.ssl && this.ssl.key) Object.defineProperty(this.ssl, "key", { enumerable: false });
			this._connectionTimeoutMillis = c.connectionTimeoutMillis || 0;
		}
		get activeQuery() {
			activeQueryDeprecationNotice();
			return this._activeQuery;
		}
		set activeQuery(val$1) {
			activeQueryDeprecationNotice();
			this._activeQuery = val$1;
		}
		_getActiveQuery() {
			return this._activeQuery;
		}
		_errorAllQueries(err) {
			const enqueueError = (query$1) => {
				process.nextTick(() => {
					query$1.handleError(err, this.connection);
				});
			};
			const activeQuery = this._getActiveQuery();
			if (activeQuery) {
				enqueueError(activeQuery);
				this._activeQuery = null;
			}
			this._queryQueue.forEach(enqueueError);
			this._queryQueue.length = 0;
		}
		_connect(callback) {
			const self = this;
			const con = this.connection;
			this._connectionCallback = callback;
			if (this._connecting || this._connected) {
				const err = /* @__PURE__ */ new Error("Client has already been connected. You cannot reuse a client.");
				process.nextTick(() => {
					callback(err);
				});
				return;
			}
			this._connecting = true;
			if (this._connectionTimeoutMillis > 0) {
				this.connectionTimeoutHandle = setTimeout(() => {
					con._ending = true;
					con.stream.destroy(/* @__PURE__ */ new Error("timeout expired"));
				}, this._connectionTimeoutMillis);
				if (this.connectionTimeoutHandle.unref) this.connectionTimeoutHandle.unref();
			}
			if (this.host && this.host.indexOf("/") === 0) con.connect(this.host + "/.s.PGSQL." + this.port);
			else con.connect(this.port, this.host);
			con.on("connect", function() {
				if (self.ssl) con.requestSsl();
				else con.startup(self.getStartupConf());
			});
			con.on("sslconnect", function() {
				con.startup(self.getStartupConf());
			});
			this._attachListeners(con);
			con.once("end", () => {
				const error$1 = this._ending ? /* @__PURE__ */ new Error("Connection terminated") : /* @__PURE__ */ new Error("Connection terminated unexpectedly");
				clearTimeout(this.connectionTimeoutHandle);
				this._errorAllQueries(error$1);
				this._ended = true;
				if (!this._ending) {
					if (this._connecting && !this._connectionError) if (this._connectionCallback) this._connectionCallback(error$1);
					else this._handleErrorEvent(error$1);
					else if (!this._connectionError) this._handleErrorEvent(error$1);
				}
				process.nextTick(() => {
					this.emit("end");
				});
			});
		}
		connect(callback) {
			if (callback) {
				this._connect(callback);
				return;
			}
			return new this._Promise((resolve$1, reject) => {
				this._connect((error$1) => {
					if (error$1) reject(error$1);
					else resolve$1();
				});
			});
		}
		_attachListeners(con) {
			con.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this));
			con.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this));
			con.on("authenticationSASL", this._handleAuthSASL.bind(this));
			con.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this));
			con.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this));
			con.on("backendKeyData", this._handleBackendKeyData.bind(this));
			con.on("error", this._handleErrorEvent.bind(this));
			con.on("errorMessage", this._handleErrorMessage.bind(this));
			con.on("readyForQuery", this._handleReadyForQuery.bind(this));
			con.on("notice", this._handleNotice.bind(this));
			con.on("rowDescription", this._handleRowDescription.bind(this));
			con.on("dataRow", this._handleDataRow.bind(this));
			con.on("portalSuspended", this._handlePortalSuspended.bind(this));
			con.on("emptyQuery", this._handleEmptyQuery.bind(this));
			con.on("commandComplete", this._handleCommandComplete.bind(this));
			con.on("parseComplete", this._handleParseComplete.bind(this));
			con.on("copyInResponse", this._handleCopyInResponse.bind(this));
			con.on("copyData", this._handleCopyData.bind(this));
			con.on("notification", this._handleNotification.bind(this));
		}
		_getPassword(cb) {
			const con = this.connection;
			if (typeof this.password === "function") this._Promise.resolve().then(() => this.password()).then((pass) => {
				if (pass !== void 0) {
					if (typeof pass !== "string") {
						con.emit("error", /* @__PURE__ */ new TypeError("Password must be a string"));
						return;
					}
					this.connectionParameters.password = this.password = pass;
				} else this.connectionParameters.password = this.password = null;
				cb();
			}).catch((err) => {
				con.emit("error", err);
			});
			else if (this.password !== null) cb();
			else try {
				require_lib$1()(this.connectionParameters, (pass) => {
					if (void 0 !== pass) {
						pgPassDeprecationNotice();
						this.connectionParameters.password = this.password = pass;
					}
					cb();
				});
			} catch (e) {
				this.emit("error", e);
			}
		}
		_handleAuthCleartextPassword(msg) {
			this._getPassword(() => {
				this.connection.password(this.password);
			});
		}
		_handleAuthMD5Password(msg) {
			this._getPassword(async () => {
				try {
					const hashedPassword = await crypto$8.postgresMd5PasswordHash(this.user, this.password, msg.salt);
					this.connection.password(hashedPassword);
				} catch (e) {
					this.emit("error", e);
				}
			});
		}
		_handleAuthSASL(msg) {
			this._getPassword(() => {
				try {
					this.saslSession = sasl.startSession(msg.mechanisms, this.enableChannelBinding && this.connection.stream);
					this.connection.sendSASLInitialResponseMessage(this.saslSession.mechanism, this.saslSession.response);
				} catch (err) {
					this.connection.emit("error", err);
				}
			});
		}
		async _handleAuthSASLContinue(msg) {
			try {
				await sasl.continueSession(this.saslSession, this.password, msg.data, this.enableChannelBinding && this.connection.stream);
				this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
			} catch (err) {
				this.connection.emit("error", err);
			}
		}
		_handleAuthSASLFinal(msg) {
			try {
				sasl.finalizeSession(this.saslSession, msg.data);
				this.saslSession = null;
			} catch (err) {
				this.connection.emit("error", err);
			}
		}
		_handleBackendKeyData(msg) {
			this.processID = msg.processID;
			this.secretKey = msg.secretKey;
		}
		_handleReadyForQuery(msg) {
			if (this._connecting) {
				this._connecting = false;
				this._connected = true;
				clearTimeout(this.connectionTimeoutHandle);
				if (this._connectionCallback) {
					this._connectionCallback(null, this);
					this._connectionCallback = null;
				}
				this.emit("connect");
			}
			const activeQuery = this._getActiveQuery();
			this._activeQuery = null;
			this.readyForQuery = true;
			if (activeQuery) activeQuery.handleReadyForQuery(this.connection);
			this._pulseQueryQueue();
		}
		_handleErrorWhileConnecting(err) {
			if (this._connectionError) return;
			this._connectionError = true;
			clearTimeout(this.connectionTimeoutHandle);
			if (this._connectionCallback) return this._connectionCallback(err);
			this.emit("error", err);
		}
		_handleErrorEvent(err) {
			if (this._connecting) return this._handleErrorWhileConnecting(err);
			this._queryable = false;
			this._errorAllQueries(err);
			this.emit("error", err);
		}
		_handleErrorMessage(msg) {
			if (this._connecting) return this._handleErrorWhileConnecting(msg);
			const activeQuery = this._getActiveQuery();
			if (!activeQuery) {
				this._handleErrorEvent(msg);
				return;
			}
			this._activeQuery = null;
			activeQuery.handleError(msg, this.connection);
		}
		_handleRowDescription(msg) {
			this._getActiveQuery().handleRowDescription(msg);
		}
		_handleDataRow(msg) {
			this._getActiveQuery().handleDataRow(msg);
		}
		_handlePortalSuspended(msg) {
			this._getActiveQuery().handlePortalSuspended(this.connection);
		}
		_handleEmptyQuery(msg) {
			this._getActiveQuery().handleEmptyQuery(this.connection);
		}
		_handleCommandComplete(msg) {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error$1 = /* @__PURE__ */ new Error("Received unexpected commandComplete message from backend.");
				this._handleErrorEvent(error$1);
				return;
			}
			activeQuery.handleCommandComplete(msg, this.connection);
		}
		_handleParseComplete() {
			const activeQuery = this._getActiveQuery();
			if (activeQuery == null) {
				const error$1 = /* @__PURE__ */ new Error("Received unexpected parseComplete message from backend.");
				this._handleErrorEvent(error$1);
				return;
			}
			if (activeQuery.name) this.connection.parsedStatements[activeQuery.name] = activeQuery.text;
		}
		_handleCopyInResponse(msg) {
			this._getActiveQuery().handleCopyInResponse(this.connection);
		}
		_handleCopyData(msg) {
			this._getActiveQuery().handleCopyData(msg, this.connection);
		}
		_handleNotification(msg) {
			this.emit("notification", msg);
		}
		_handleNotice(msg) {
			this.emit("notice", msg);
		}
		getStartupConf() {
			const params = this.connectionParameters;
			const data = {
				user: params.user,
				database: params.database
			};
			const appName = params.application_name || params.fallback_application_name;
			if (appName) data.application_name = appName;
			if (params.replication) data.replication = "" + params.replication;
			if (params.statement_timeout) data.statement_timeout = String(parseInt(params.statement_timeout, 10));
			if (params.lock_timeout) data.lock_timeout = String(parseInt(params.lock_timeout, 10));
			if (params.idle_in_transaction_session_timeout) data.idle_in_transaction_session_timeout = String(parseInt(params.idle_in_transaction_session_timeout, 10));
			if (params.options) data.options = params.options;
			return data;
		}
		cancel(client, query$1) {
			if (client.activeQuery === query$1) {
				const con = this.connection;
				if (this.host && this.host.indexOf("/") === 0) con.connect(this.host + "/.s.PGSQL." + this.port);
				else con.connect(this.port, this.host);
				con.on("connect", function() {
					con.cancel(client.processID, client.secretKey);
				});
			} else if (client._queryQueue.indexOf(query$1) !== -1) client._queryQueue.splice(client._queryQueue.indexOf(query$1), 1);
		}
		setTypeParser(oid, format, parseFn) {
			return this._types.setTypeParser(oid, format, parseFn);
		}
		getTypeParser(oid, format) {
			return this._types.getTypeParser(oid, format);
		}
		escapeIdentifier(str) {
			return utils$2.escapeIdentifier(str);
		}
		escapeLiteral(str) {
			return utils$2.escapeLiteral(str);
		}
		_pulseQueryQueue() {
			if (this.readyForQuery === true) {
				this._activeQuery = this._queryQueue.shift();
				const activeQuery = this._getActiveQuery();
				if (activeQuery) {
					this.readyForQuery = false;
					this.hasExecuted = true;
					const queryError = activeQuery.submit(this.connection);
					if (queryError) process.nextTick(() => {
						activeQuery.handleError(queryError, this.connection);
						this.readyForQuery = true;
						this._pulseQueryQueue();
					});
				} else if (this.hasExecuted) {
					this._activeQuery = null;
					this.emit("drain");
				}
			}
		}
		query(config, values, callback) {
			let query$1;
			let result;
			let readTimeout;
			let readTimeoutTimer;
			let queryCallback;
			if (config === null || config === void 0) throw new TypeError("Client was passed a null or undefined query");
			else if (typeof config.submit === "function") {
				readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
				result = query$1 = config;
				if (typeof values === "function") query$1.callback = query$1.callback || values;
			} else {
				readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
				query$1 = new Query$1(config, values, callback);
				if (!query$1.callback) result = new this._Promise((resolve$1, reject) => {
					query$1.callback = (err, res) => err ? reject(err) : resolve$1(res);
				}).catch((err) => {
					Error.captureStackTrace(err);
					throw err;
				});
			}
			if (readTimeout) {
				queryCallback = query$1.callback;
				readTimeoutTimer = setTimeout(() => {
					const error$1 = /* @__PURE__ */ new Error("Query read timeout");
					process.nextTick(() => {
						query$1.handleError(error$1, this.connection);
					});
					queryCallback(error$1);
					query$1.callback = () => {};
					const index$1 = this._queryQueue.indexOf(query$1);
					if (index$1 > -1) this._queryQueue.splice(index$1, 1);
					this._pulseQueryQueue();
				}, readTimeout);
				query$1.callback = (err, res) => {
					clearTimeout(readTimeoutTimer);
					queryCallback(err, res);
				};
			}
			if (this.binary && !query$1.binary) query$1.binary = true;
			if (query$1._result && !query$1._result._types) query$1._result._types = this._types;
			if (!this._queryable) {
				process.nextTick(() => {
					query$1.handleError(/* @__PURE__ */ new Error("Client has encountered a connection error and is not queryable"), this.connection);
				});
				return result;
			}
			if (this._ending) {
				process.nextTick(() => {
					query$1.handleError(/* @__PURE__ */ new Error("Client was closed and is not queryable"), this.connection);
				});
				return result;
			}
			this._queryQueue.push(query$1);
			this._pulseQueryQueue();
			return result;
		}
		ref() {
			this.connection.ref();
		}
		unref() {
			this.connection.unref();
		}
		end(cb) {
			this._ending = true;
			if (!this.connection._connecting || this._ended) if (cb) cb();
			else return this._Promise.resolve();
			if (this._getActiveQuery() || !this._queryable) this.connection.stream.destroy();
			else this.connection.end();
			if (cb) this.connection.once("end", cb);
			else return new this._Promise((resolve$1) => {
				this.connection.once("end", resolve$1);
			});
		}
		get queryQueue() {
			queryQueueDeprecationNotice();
			return this._queryQueue;
		}
	};
	Client$3.Query = Query$1;
	module.exports = Client$3;
}));

//#endregion
//#region ../../node_modules/.bun/pg-pool@3.11.0+5b6060c982e03003/node_modules/pg-pool/index.js
var require_pg_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$8 = __require("events").EventEmitter;
	const NOOP = function() {};
	const removeWhere = (list, predicate) => {
		const i = list.findIndex(predicate);
		return i === -1 ? void 0 : list.splice(i, 1)[0];
	};
	var IdleItem = class {
		constructor(client, idleListener, timeoutId) {
			this.client = client;
			this.idleListener = idleListener;
			this.timeoutId = timeoutId;
		}
	};
	var PendingItem = class {
		constructor(callback) {
			this.callback = callback;
		}
	};
	function throwOnDoubleRelease() {
		throw new Error("Release called on client which has already been released to the pool.");
	}
	function promisify(Promise$1, callback) {
		if (callback) return {
			callback,
			result: void 0
		};
		let rej;
		let res;
		const cb = function(err, client) {
			err ? rej(err) : res(client);
		};
		return {
			callback: cb,
			result: new Promise$1(function(resolve$1, reject) {
				res = resolve$1;
				rej = reject;
			}).catch((err) => {
				Error.captureStackTrace(err);
				throw err;
			})
		};
	}
	function makeIdleListener(pool$1, client) {
		return function idleListener(err) {
			err.client = client;
			client.removeListener("error", idleListener);
			client.on("error", () => {
				pool$1.log("additional client error after disconnection due to error", err);
			});
			pool$1._remove(client);
			pool$1.emit("error", err, client);
		};
	}
	var Pool$2 = class extends EventEmitter$8 {
		constructor(options, Client$4) {
			super();
			this.options = Object.assign({}, options);
			if (options != null && "password" in options) Object.defineProperty(this.options, "password", {
				configurable: true,
				enumerable: false,
				writable: true,
				value: options.password
			});
			if (options != null && options.ssl && options.ssl.key) Object.defineProperty(this.options.ssl, "key", { enumerable: false });
			this.options.max = this.options.max || this.options.poolSize || 10;
			this.options.min = this.options.min || 0;
			this.options.maxUses = this.options.maxUses || Infinity;
			this.options.allowExitOnIdle = this.options.allowExitOnIdle || false;
			this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0;
			this.log = this.options.log || function() {};
			this.Client = this.options.Client || Client$4 || require_lib().Client;
			this.Promise = this.options.Promise || global.Promise;
			if (typeof this.options.idleTimeoutMillis === "undefined") this.options.idleTimeoutMillis = 1e4;
			this._clients = [];
			this._idle = [];
			this._expired = /* @__PURE__ */ new WeakSet();
			this._pendingQueue = [];
			this._endCallback = void 0;
			this.ending = false;
			this.ended = false;
		}
		_isFull() {
			return this._clients.length >= this.options.max;
		}
		_isAboveMin() {
			return this._clients.length > this.options.min;
		}
		_pulseQueue() {
			this.log("pulse queue");
			if (this.ended) {
				this.log("pulse queue ended");
				return;
			}
			if (this.ending) {
				this.log("pulse queue on ending");
				if (this._idle.length) this._idle.slice().map((item) => {
					this._remove(item.client);
				});
				if (!this._clients.length) {
					this.ended = true;
					this._endCallback();
				}
				return;
			}
			if (!this._pendingQueue.length) {
				this.log("no queued requests");
				return;
			}
			if (!this._idle.length && this._isFull()) return;
			const pendingItem = this._pendingQueue.shift();
			if (this._idle.length) {
				const idleItem = this._idle.pop();
				clearTimeout(idleItem.timeoutId);
				const client = idleItem.client;
				client.ref && client.ref();
				const idleListener = idleItem.idleListener;
				return this._acquireClient(client, pendingItem, idleListener, false);
			}
			if (!this._isFull()) return this.newClient(pendingItem);
			throw new Error("unexpected condition");
		}
		_remove(client, callback) {
			const removed = removeWhere(this._idle, (item) => item.client === client);
			if (removed !== void 0) clearTimeout(removed.timeoutId);
			this._clients = this._clients.filter((c) => c !== client);
			const context = this;
			client.end(() => {
				context.emit("remove", client);
				if (typeof callback === "function") callback();
			});
		}
		connect(cb) {
			if (this.ending) {
				const err = /* @__PURE__ */ new Error("Cannot use a pool after calling end on the pool");
				return cb ? cb(err) : this.Promise.reject(err);
			}
			const response = promisify(this.Promise, cb);
			const result = response.result;
			if (this._isFull() || this._idle.length) {
				if (this._idle.length) process.nextTick(() => this._pulseQueue());
				if (!this.options.connectionTimeoutMillis) {
					this._pendingQueue.push(new PendingItem(response.callback));
					return result;
				}
				const queueCallback = (err, res, done) => {
					clearTimeout(tid);
					response.callback(err, res, done);
				};
				const pendingItem = new PendingItem(queueCallback);
				const tid = setTimeout(() => {
					removeWhere(this._pendingQueue, (i) => i.callback === queueCallback);
					pendingItem.timedOut = true;
					response.callback(/* @__PURE__ */ new Error("timeout exceeded when trying to connect"));
				}, this.options.connectionTimeoutMillis);
				if (tid.unref) tid.unref();
				this._pendingQueue.push(pendingItem);
				return result;
			}
			this.newClient(new PendingItem(response.callback));
			return result;
		}
		newClient(pendingItem) {
			const client = new this.Client(this.options);
			this._clients.push(client);
			const idleListener = makeIdleListener(this, client);
			this.log("checking client timeout");
			let tid;
			let timeoutHit = false;
			if (this.options.connectionTimeoutMillis) tid = setTimeout(() => {
				this.log("ending client due to timeout");
				timeoutHit = true;
				client.connection ? client.connection.stream.destroy() : client.end();
			}, this.options.connectionTimeoutMillis);
			this.log("connecting new client");
			client.connect((err) => {
				if (tid) clearTimeout(tid);
				client.on("error", idleListener);
				if (err) {
					this.log("client failed to connect", err);
					this._clients = this._clients.filter((c) => c !== client);
					if (timeoutHit) err = new Error("Connection terminated due to connection timeout", { cause: err });
					this._pulseQueue();
					if (!pendingItem.timedOut) pendingItem.callback(err, void 0, NOOP);
				} else {
					this.log("new client connected");
					if (this.options.maxLifetimeSeconds !== 0) {
						const maxLifetimeTimeout = setTimeout(() => {
							this.log("ending client due to expired lifetime");
							this._expired.add(client);
							if (this._idle.findIndex((idleItem) => idleItem.client === client) !== -1) this._acquireClient(client, new PendingItem((err$1, client$1, clientRelease) => clientRelease()), idleListener, false);
						}, this.options.maxLifetimeSeconds * 1e3);
						maxLifetimeTimeout.unref();
						client.once("end", () => clearTimeout(maxLifetimeTimeout));
					}
					return this._acquireClient(client, pendingItem, idleListener, true);
				}
			});
		}
		_acquireClient(client, pendingItem, idleListener, isNew) {
			if (isNew) this.emit("connect", client);
			this.emit("acquire", client);
			client.release = this._releaseOnce(client, idleListener);
			client.removeListener("error", idleListener);
			if (!pendingItem.timedOut) if (isNew && this.options.verify) this.options.verify(client, (err) => {
				if (err) {
					client.release(err);
					return pendingItem.callback(err, void 0, NOOP);
				}
				pendingItem.callback(void 0, client, client.release);
			});
			else pendingItem.callback(void 0, client, client.release);
			else if (isNew && this.options.verify) this.options.verify(client, client.release);
			else client.release();
		}
		_releaseOnce(client, idleListener) {
			let released = false;
			return (err) => {
				if (released) throwOnDoubleRelease();
				released = true;
				this._release(client, idleListener, err);
			};
		}
		_release(client, idleListener, err) {
			client.on("error", idleListener);
			client._poolUseCount = (client._poolUseCount || 0) + 1;
			this.emit("release", err, client);
			if (err || this.ending || !client._queryable || client._ending || client._poolUseCount >= this.options.maxUses) {
				if (client._poolUseCount >= this.options.maxUses) this.log("remove expended client");
				return this._remove(client, this._pulseQueue.bind(this));
			}
			if (this._expired.has(client)) {
				this.log("remove expired client");
				this._expired.delete(client);
				return this._remove(client, this._pulseQueue.bind(this));
			}
			let tid;
			if (this.options.idleTimeoutMillis && this._isAboveMin()) {
				tid = setTimeout(() => {
					if (this._isAboveMin()) {
						this.log("remove idle client");
						this._remove(client, this._pulseQueue.bind(this));
					}
				}, this.options.idleTimeoutMillis);
				if (this.options.allowExitOnIdle) tid.unref();
			}
			if (this.options.allowExitOnIdle) client.unref();
			this._idle.push(new IdleItem(client, idleListener, tid));
			this._pulseQueue();
		}
		query(text$1, values, cb) {
			if (typeof text$1 === "function") {
				const response$1 = promisify(this.Promise, text$1);
				setImmediate(function() {
					return response$1.callback(/* @__PURE__ */ new Error("Passing a function as the first parameter to pool.query is not supported"));
				});
				return response$1.result;
			}
			if (typeof values === "function") {
				cb = values;
				values = void 0;
			}
			const response = promisify(this.Promise, cb);
			cb = response.callback;
			this.connect((err, client) => {
				if (err) return cb(err);
				let clientReleased = false;
				const onError = (err$1) => {
					if (clientReleased) return;
					clientReleased = true;
					client.release(err$1);
					cb(err$1);
				};
				client.once("error", onError);
				this.log("dispatching query");
				try {
					client.query(text$1, values, (err$1, res) => {
						this.log("query dispatched");
						client.removeListener("error", onError);
						if (clientReleased) return;
						clientReleased = true;
						client.release(err$1);
						if (err$1) return cb(err$1);
						return cb(void 0, res);
					});
				} catch (err$1) {
					client.release(err$1);
					return cb(err$1);
				}
			});
			return response.result;
		}
		end(cb) {
			this.log("ending");
			if (this.ending) {
				const err = /* @__PURE__ */ new Error("Called end on pool more than once");
				return cb ? cb(err) : this.Promise.reject(err);
			}
			this.ending = true;
			const promised = promisify(this.Promise, cb);
			this._endCallback = promised.callback;
			this._pulseQueue();
			return promised.result;
		}
		get waitingCount() {
			return this._pendingQueue.length;
		}
		get idleCount() {
			return this._idle.length;
		}
		get expiredCount() {
			return this._clients.reduce((acc, client) => acc + (this._expired.has(client) ? 1 : 0), 0);
		}
		get totalCount() {
			return this._clients.length;
		}
	};
	module.exports = Pool$2;
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/native/query.js
var require_query = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$7 = __require("events").EventEmitter;
	const util$3 = __require("util");
	const utils$1 = require_utils$1();
	const NativeQuery$1 = module.exports = function(config, values, callback) {
		EventEmitter$7.call(this);
		config = utils$1.normalizeQueryConfig(config, values, callback);
		this.text = config.text;
		this.values = config.values;
		this.name = config.name;
		this.queryMode = config.queryMode;
		this.callback = config.callback;
		this.state = "new";
		this._arrayMode = config.rowMode === "array";
		this._emitRowEvents = false;
		this.on("newListener", function(event) {
			if (event === "row") this._emitRowEvents = true;
		}.bind(this));
	};
	util$3.inherits(NativeQuery$1, EventEmitter$7);
	const errorFieldMap = {
		sqlState: "code",
		statementPosition: "position",
		messagePrimary: "message",
		context: "where",
		schemaName: "schema",
		tableName: "table",
		columnName: "column",
		dataTypeName: "dataType",
		constraintName: "constraint",
		sourceFile: "file",
		sourceLine: "line",
		sourceFunction: "routine"
	};
	NativeQuery$1.prototype.handleError = function(err) {
		const fields = this.native.pq.resultErrorFields();
		if (fields) for (const key in fields) {
			const normalizedFieldName = errorFieldMap[key] || key;
			err[normalizedFieldName] = fields[key];
		}
		if (this.callback) this.callback(err);
		else this.emit("error", err);
		this.state = "error";
	};
	NativeQuery$1.prototype.then = function(onSuccess, onFailure) {
		return this._getPromise().then(onSuccess, onFailure);
	};
	NativeQuery$1.prototype.catch = function(callback) {
		return this._getPromise().catch(callback);
	};
	NativeQuery$1.prototype._getPromise = function() {
		if (this._promise) return this._promise;
		this._promise = new Promise(function(resolve$1, reject) {
			this._once("end", resolve$1);
			this._once("error", reject);
		}.bind(this));
		return this._promise;
	};
	NativeQuery$1.prototype.submit = function(client) {
		this.state = "running";
		const self = this;
		this.native = client.native;
		client.native.arrayMode = this._arrayMode;
		let after = function(err, rows, results) {
			client.native.arrayMode = false;
			setImmediate(function() {
				self.emit("_done");
			});
			if (err) return self.handleError(err);
			if (self._emitRowEvents) if (results.length > 1) rows.forEach((rowOfRows, i) => {
				rowOfRows.forEach((row) => {
					self.emit("row", row, results[i]);
				});
			});
			else rows.forEach(function(row) {
				self.emit("row", row, results);
			});
			self.state = "end";
			self.emit("end", results);
			if (self.callback) self.callback(null, results);
		};
		if (process.domain) after = process.domain.bind(after);
		if (this.name) {
			if (this.name.length > 63) {
				console.error("Warning! Postgres only supports 63 characters for query names.");
				console.error("You supplied %s (%s)", this.name, this.name.length);
				console.error("This can cause conflicts and silent errors executing queries");
			}
			const values = (this.values || []).map(utils$1.prepareValue);
			if (client.namedQueries[this.name]) {
				if (this.text && client.namedQueries[this.name] !== this.text) {
					const err = /* @__PURE__ */ new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
					return after(err);
				}
				return client.native.execute(this.name, values, after);
			}
			return client.native.prepare(this.name, this.text, values.length, function(err) {
				if (err) return after(err);
				client.namedQueries[self.name] = self.text;
				return self.native.execute(self.name, values, after);
			});
		} else if (this.values) {
			if (!Array.isArray(this.values)) return after(/* @__PURE__ */ new Error("Query values must be an array"));
			const vals = this.values.map(utils$1.prepareValue);
			client.native.query(this.text, vals, after);
		} else if (this.queryMode === "extended") client.native.query(this.text, [], after);
		else client.native.query(this.text, after);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/native/client.js
var require_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Native;
	try {
		Native = __require("pg-native");
	} catch (e) {
		throw e;
	}
	const TypeOverrides$2 = require_type_overrides();
	const EventEmitter$6 = __require("events").EventEmitter;
	const util$2 = __require("util");
	const ConnectionParameters = require_connection_parameters();
	const NativeQuery = require_query();
	const Client$2 = module.exports = function(config) {
		EventEmitter$6.call(this);
		config = config || {};
		this._Promise = config.Promise || global.Promise;
		this._types = new TypeOverrides$2(config.types);
		this.native = new Native({ types: this._types });
		this._queryQueue = [];
		this._ending = false;
		this._connecting = false;
		this._connected = false;
		this._queryable = true;
		const cp = this.connectionParameters = new ConnectionParameters(config);
		if (config.nativeConnectionString) cp.nativeConnectionString = config.nativeConnectionString;
		this.user = cp.user;
		Object.defineProperty(this, "password", {
			configurable: true,
			enumerable: false,
			writable: true,
			value: cp.password
		});
		this.database = cp.database;
		this.host = cp.host;
		this.port = cp.port;
		this.namedQueries = {};
	};
	Client$2.Query = NativeQuery;
	util$2.inherits(Client$2, EventEmitter$6);
	Client$2.prototype._errorAllQueries = function(err) {
		const enqueueError = (query$1) => {
			process.nextTick(() => {
				query$1.native = this.native;
				query$1.handleError(err);
			});
		};
		if (this._hasActiveQuery()) {
			enqueueError(this._activeQuery);
			this._activeQuery = null;
		}
		this._queryQueue.forEach(enqueueError);
		this._queryQueue.length = 0;
	};
	Client$2.prototype._connect = function(cb) {
		const self = this;
		if (this._connecting) {
			process.nextTick(() => cb(/* @__PURE__ */ new Error("Client has already been connected. You cannot reuse a client.")));
			return;
		}
		this._connecting = true;
		this.connectionParameters.getLibpqConnectionString(function(err, conString) {
			if (self.connectionParameters.nativeConnectionString) conString = self.connectionParameters.nativeConnectionString;
			if (err) return cb(err);
			self.native.connect(conString, function(err$1) {
				if (err$1) {
					self.native.end();
					return cb(err$1);
				}
				self._connected = true;
				self.native.on("error", function(err$2) {
					self._queryable = false;
					self._errorAllQueries(err$2);
					self.emit("error", err$2);
				});
				self.native.on("notification", function(msg) {
					self.emit("notification", {
						channel: msg.relname,
						payload: msg.extra
					});
				});
				self.emit("connect");
				self._pulseQueryQueue(true);
				cb();
			});
		});
	};
	Client$2.prototype.connect = function(callback) {
		if (callback) {
			this._connect(callback);
			return;
		}
		return new this._Promise((resolve$1, reject) => {
			this._connect((error$1) => {
				if (error$1) reject(error$1);
				else resolve$1();
			});
		});
	};
	Client$2.prototype.query = function(config, values, callback) {
		let query$1;
		let result;
		let readTimeout;
		let readTimeoutTimer;
		let queryCallback;
		if (config === null || config === void 0) throw new TypeError("Client was passed a null or undefined query");
		else if (typeof config.submit === "function") {
			readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
			result = query$1 = config;
			if (typeof values === "function") config.callback = values;
		} else {
			readTimeout = config.query_timeout || this.connectionParameters.query_timeout;
			query$1 = new NativeQuery(config, values, callback);
			if (!query$1.callback) {
				let resolveOut, rejectOut;
				result = new this._Promise((resolve$1, reject) => {
					resolveOut = resolve$1;
					rejectOut = reject;
				}).catch((err) => {
					Error.captureStackTrace(err);
					throw err;
				});
				query$1.callback = (err, res) => err ? rejectOut(err) : resolveOut(res);
			}
		}
		if (readTimeout) {
			queryCallback = query$1.callback;
			readTimeoutTimer = setTimeout(() => {
				const error$1 = /* @__PURE__ */ new Error("Query read timeout");
				process.nextTick(() => {
					query$1.handleError(error$1, this.connection);
				});
				queryCallback(error$1);
				query$1.callback = () => {};
				const index$1 = this._queryQueue.indexOf(query$1);
				if (index$1 > -1) this._queryQueue.splice(index$1, 1);
				this._pulseQueryQueue();
			}, readTimeout);
			query$1.callback = (err, res) => {
				clearTimeout(readTimeoutTimer);
				queryCallback(err, res);
			};
		}
		if (!this._queryable) {
			query$1.native = this.native;
			process.nextTick(() => {
				query$1.handleError(/* @__PURE__ */ new Error("Client has encountered a connection error and is not queryable"));
			});
			return result;
		}
		if (this._ending) {
			query$1.native = this.native;
			process.nextTick(() => {
				query$1.handleError(/* @__PURE__ */ new Error("Client was closed and is not queryable"));
			});
			return result;
		}
		this._queryQueue.push(query$1);
		this._pulseQueryQueue();
		return result;
	};
	Client$2.prototype.end = function(cb) {
		const self = this;
		this._ending = true;
		if (!this._connected) this.once("connect", this.end.bind(this, cb));
		let result;
		if (!cb) result = new this._Promise(function(resolve$1, reject) {
			cb = (err) => err ? reject(err) : resolve$1();
		});
		this.native.end(function() {
			self._errorAllQueries(/* @__PURE__ */ new Error("Connection terminated"));
			process.nextTick(() => {
				self.emit("end");
				if (cb) cb();
			});
		});
		return result;
	};
	Client$2.prototype._hasActiveQuery = function() {
		return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
	};
	Client$2.prototype._pulseQueryQueue = function(initialConnection) {
		if (!this._connected) return;
		if (this._hasActiveQuery()) return;
		const query$1 = this._queryQueue.shift();
		if (!query$1) {
			if (!initialConnection) this.emit("drain");
			return;
		}
		this._activeQuery = query$1;
		query$1.submit(this);
		const self = this;
		query$1.once("_done", function() {
			self._pulseQueryQueue();
		});
	};
	Client$2.prototype.cancel = function(query$1) {
		if (this._activeQuery === query$1) this.native.cancel(function() {});
		else if (this._queryQueue.indexOf(query$1) !== -1) this._queryQueue.splice(this._queryQueue.indexOf(query$1), 1);
	};
	Client$2.prototype.ref = function() {};
	Client$2.prototype.unref = function() {};
	Client$2.prototype.setTypeParser = function(oid, format, parseFn) {
		return this._types.setTypeParser(oid, format, parseFn);
	};
	Client$2.prototype.getTypeParser = function(oid, format) {
		return this._types.getTypeParser(oid, format);
	};
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/native/index.js
var require_native = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = require_client();
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Client$1 = require_client$1();
	const defaults$1 = require_defaults();
	const Connection$1 = require_connection();
	const Result$1 = require_result();
	const utils = require_utils$1();
	const Pool$1 = require_pg_pool();
	const TypeOverrides$1 = require_type_overrides();
	const { DatabaseError: DatabaseError$1 } = require_dist();
	const { escapeIdentifier: escapeIdentifier$1, escapeLiteral: escapeLiteral$1 } = require_utils$1();
	const poolFactory = (Client$4) => {
		return class BoundPool extends Pool$1 {
			constructor(options) {
				super(options, Client$4);
			}
		};
	};
	const PG = function(clientConstructor$1) {
		this.defaults = defaults$1;
		this.Client = clientConstructor$1;
		this.Query = this.Client.Query;
		this.Pool = poolFactory(this.Client);
		this._pools = [];
		this.Connection = Connection$1;
		this.types = require_pg_types();
		this.DatabaseError = DatabaseError$1;
		this.TypeOverrides = TypeOverrides$1;
		this.escapeIdentifier = escapeIdentifier$1;
		this.escapeLiteral = escapeLiteral$1;
		this.Result = Result$1;
		this.utils = utils;
	};
	let clientConstructor = Client$1;
	let forceNative = false;
	try {
		forceNative = !!process.env.NODE_PG_FORCE_NATIVE;
	} catch {}
	if (forceNative) clientConstructor = require_native();
	module.exports = new PG(clientConstructor);
	Object.defineProperty(module.exports, "native", {
		configurable: true,
		enumerable: false,
		get() {
			let native = null;
			try {
				native = new PG(require_native());
			} catch (err) {
				if (err.code !== "MODULE_NOT_FOUND") throw err;
			}
			Object.defineProperty(module.exports, "native", { value: native });
			return native;
		}
	});
}));

//#endregion
//#region ../../node_modules/.bun/pg@8.17.2+5b6060c982e03003/node_modules/pg/esm/index.mjs
var import_lib = /* @__PURE__ */ __toESM(require_lib(), 1);
const Client = import_lib.default.Client;
const Pool = import_lib.default.Pool;
const Connection = import_lib.default.Connection;
const types = import_lib.default.types;
const Query = import_lib.default.Query;
const DatabaseError = import_lib.default.DatabaseError;
const escapeIdentifier = import_lib.default.escapeIdentifier;
const escapeLiteral = import_lib.default.escapeLiteral;
const Result = import_lib.default.Result;
const TypeOverrides = import_lib.default.TypeOverrides;
const defaults = import_lib.default.defaults;

//#endregion
//#region ../../node_modules/.bun/@t3-oss+env-core@0.13.10+2730826b9b7a1fe7/node_modules/@t3-oss/env-core/dist/standard.js
function ensureSynchronous(value, message) {
	if (value instanceof Promise) throw new Error(message);
}
function parseWithDictionary(dictionary, value) {
	const result = {};
	const issues = [];
	for (const key in dictionary) {
		const propResult = dictionary[key]["~standard"].validate(value[key]);
		ensureSynchronous(propResult, `Validation must be synchronous, but ${key} returned a Promise.`);
		if (propResult.issues) {
			issues.push(...propResult.issues.map((issue) => ({
				...issue,
				message: issue.message,
				path: [key, ...issue.path ?? []]
			})));
			continue;
		}
		result[key] = propResult.value;
	}
	if (issues.length) return { issues };
	return { value: result };
}

//#endregion
//#region ../../node_modules/.bun/@t3-oss+env-core@0.13.10+2730826b9b7a1fe7/node_modules/@t3-oss/env-core/dist/index.js
/**
* Create a new environment variable schema.
*/
function createEnv(opts) {
	const runtimeEnv = opts.runtimeEnvStrict ?? opts.runtimeEnv ?? process.env;
	if (opts.emptyStringAsUndefined ?? false) {
		for (const [key, value] of Object.entries(runtimeEnv)) if (value === "") delete runtimeEnv[key];
	}
	if (!!opts.skipValidation) {
		if (opts.extends) for (const preset of opts.extends) preset.skipValidation = true;
		return runtimeEnv;
	}
	const _client = typeof opts.client === "object" ? opts.client : {};
	const _server = typeof opts.server === "object" ? opts.server : {};
	const _shared = typeof opts.shared === "object" ? opts.shared : {};
	const isServer = opts.isServer ?? (typeof window === "undefined" || "Deno" in window);
	const finalSchemaShape = isServer ? {
		..._server,
		..._shared,
		..._client
	} : {
		..._client,
		..._shared
	};
	const parsed = (opts.createFinalSchema?.(finalSchemaShape, isServer))?.["~standard"].validate(runtimeEnv) ?? parseWithDictionary(finalSchemaShape, runtimeEnv);
	ensureSynchronous(parsed, "Validation must be synchronous");
	const onValidationError = opts.onValidationError ?? ((issues) => {
		console.error("❌ Invalid environment variables:", issues);
		throw new Error("Invalid environment variables");
	});
	const onInvalidAccess = opts.onInvalidAccess ?? (() => {
		throw new Error("❌ Attempted to access a server-side environment variable on the client");
	});
	if (parsed.issues) return onValidationError(parsed.issues);
	const isServerAccess = (prop) => {
		if (!opts.clientPrefix) return true;
		return !prop.startsWith(opts.clientPrefix) && !(prop in _shared);
	};
	const isValidServerAccess = (prop) => {
		return isServer || !isServerAccess(prop);
	};
	const ignoreProp = (prop) => {
		return prop === "__esModule" || prop === "$$typeof";
	};
	const extendedObj = (opts.extends ?? []).reduce((acc, curr) => {
		return Object.assign(acc, curr);
	}, {});
	const fullObj = Object.assign(extendedObj, parsed.value);
	return new Proxy(fullObj, { get(target, prop) {
		if (typeof prop !== "string") return void 0;
		if (ignoreProp(prop)) return void 0;
		if (!isValidServerAccess(prop)) return onInvalidAccess(prop);
		return Reflect.get(target, prop);
	} });
}

//#endregion
//#region ../../packages/env/src/server.ts
dotenv.config();
let currentDirectory = process.cwd();
while (true) {
	const localEnvPath = join(currentDirectory, ".env.local");
	if (existsSync(localEnvPath)) {
		dotenv.config({
			path: localEnvPath,
			override: true,
			quiet: true
		});
		break;
	}
	const parentDirectory = resolve(currentDirectory, "..");
	if (parentDirectory === currentDirectory) break;
	currentDirectory = parentDirectory;
}
const env = createEnv({
	clientPrefix: "",
	client: {},
	server: {
		NODE_ENV: z.enum([
			"development",
			"production",
			"test"
		]).default("development"),
		PORT: z.coerce.number().default(3e3),
		DATABASE_URL: z.string().url(),
		BETTER_AUTH_SECRET: z.string().min(32),
		BETTER_AUTH_URL: z.string().url(),
		WEB_ORIGIN: z.string().url(),
		S3_ENDPOINT: z.string().url().optional(),
		S3_REGION: z.string().default("auto"),
		S3_BUCKET: z.string().min(1).optional(),
		S3_PRIVATE_BUCKET: z.string().min(1).optional(),
		S3_ACCESS_KEY_ID: z.string().min(1).optional(),
		S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
		S3_PUBLIC_BASE_URL: z.string().url().optional(),
		CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
		CLOUDINARY_API_KEY: z.string().min(1).optional(),
		CLOUDINARY_API_SECRET: z.string().min(1).optional(),
		SMTP_HOST: z.string().default("smtp-relay.brevo.com"),
		SMTP_PORT: z.coerce.number().default(587),
		SMTP_USER: z.string().min(1).optional(),
		SMTP_PASS: z.string().min(1).optional(),
		EMAIL_FROM: z.string().email().optional(),
		VAPID_PUBLIC_KEY: z.string().min(1).optional(),
		VAPID_PRIVATE_KEY: z.string().min(1).optional(),
		VAPID_SUBJECT: z.string().min(1).optional(),
		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),
		FACEBOOK_CLIENT_ID: z.string().optional(),
		FACEBOOK_CLIENT_SECRET: z.string().optional()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
});

//#endregion
//#region ../../packages/db/src/schema/auth.ts
var auth_exports = /* @__PURE__ */ __export({
	account: () => account,
	accountRelations: () => accountRelations,
	session: () => session,
	sessionRelations: () => sessionRelations,
	user: () => user,
	userRelations: () => userRelations,
	verification: () => verification
});
const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").default(false).notNull(),
	image: text("image"),
	roles: text("roles").array().notNull().default(sql`ARRAY['customer']::text[]`),
	deletedAt: timestamp("deleted_at", { withTimezone: true }),
	recoverUntil: timestamp("recover_until", { withTimezone: true }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
});
const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" })
}, (table) => [index("session_userId_idx").on(table.userId)]);
const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("account_userId_idx").on(table.userId)]);
const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("verification_identifier_idx").on(table.identifier)]);
const userRelations = relations(user, ({ many }) => ({
	sessions: many(session),
	accounts: many(account)
}));
const sessionRelations = relations(session, ({ one }) => ({ user: one(user, {
	fields: [session.userId],
	references: [user.id]
}) }));
const accountRelations = relations(account, ({ one }) => ({ user: one(user, {
	fields: [account.userId],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/vendors.ts
const vendors = pgTable("vendors", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 200 }).notNull(),
	slug: varchar("slug", { length: 200 }).notNull().unique(),
	logoUrl: text("logo_url"),
	ratingAvg: real("rating_avg").default(0),
	ratingCount: integer("rating_count").default(0),
	commissionRate: real("commission_rate").default(12).notNull(),
	payoutDetails: jsonb("payout_details"),
	balancePendingPaisa: integer("balance_pending_paisa").default(0).notNull(),
	balanceAvailablePaisa: integer("balance_available_paisa").default(0).notNull(),
	pathaoStoreId: varchar("pathao_store_id", { length: 120 }),
	locationCity: varchar("location_city", { length: 100 }),
	isVerified: boolean("is_verified").default(false),
	badges: text("badges").array(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("vendors_slug_idx").on(table.slug), index("vendors_pathao_store_idx").on(table.pathaoStoreId)]);
const brands = pgTable("brands", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 100 }).notNull(),
	slug: varchar("slug", { length: 100 }).notNull().unique(),
	logoUrl: text("logo_url").notNull(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("brands_slug_idx").on(table.slug)]);

//#endregion
//#region ../../packages/db/src/schema/categories.ts
const categories = pgTable("categories", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 100 }).notNull(),
	nameBn: varchar("name_bn", { length: 100 }),
	slug: varchar("slug", { length: 100 }).notNull().unique(),
	parentId: uuid("parent_id").references(() => categories.id, { onDelete: "set null" }),
	iconKey: varchar("icon_key", { length: 50 }),
	imageUrl: text("image_url"),
	sortOrder: integer("sort_order").default(0),
	depth: integer("depth").default(0),
	path: text("path"),
	isPopular: boolean("is_popular").default(false),
	isFeatured: boolean("is_featured").default(false),
	displayInMegaMenu: boolean("display_in_mega_menu").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("categories_slug_idx").on(table.slug),
	index("categories_parent_idx").on(table.parentId),
	index("categories_depth_idx").on(table.depth),
	index("categories_path_idx").on(table.path),
	index("categories_parent_sort_idx").on(table.parentId, table.sortOrder)
]);
const categoriesRelations = relations(categories, ({ one, many }) => ({
	parent: one(categories, {
		fields: [categories.parentId],
		references: [categories.id],
		relationName: "categoryParent"
	}),
	children: many(categories, { relationName: "categoryParent" })
}));

//#endregion
//#region ../../packages/db/src/schema/products.ts
const products = pgTable("products", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: varchar("title", { length: 300 }).notNull(),
	titleBn: varchar("title_bn", { length: 300 }),
	slug: varchar("slug", { length: 300 }).notNull().unique(),
	vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
	categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
	brand: varchar("brand", { length: 100 }),
	shortDescription: text("short_description"),
	shortDescriptionBn: text("short_description_bn"),
	description: text("description"),
	descriptionBn: text("description_bn"),
	ageRange: varchar("age_range", { length: 50 }),
	ageRangeMin: integer("age_range_min"),
	ageRangeMax: integer("age_range_max"),
	isBpaFree: boolean("is_bpa_free").default(false).notNull(),
	isOrganic: boolean("is_organic").default(false).notNull(),
	isHypoallergenic: boolean("is_hypoallergenic").default(false).notNull(),
	hasSmallParts: boolean("has_small_parts").default(false).notNull(),
	safetyWarningEn: text("safety_warning_en"),
	safetyWarningBn: text("safety_warning_bn"),
	weightLimitKg: real("weight_limit_kg"),
	expiryDate: timestamp("expiry_date"),
	safetyCertifications: text("safety_certifications").array(),
	ratingAvg: real("rating_avg").default(0),
	ratingCount: integer("rating_count").default(0),
	bestSellerScore: integer("best_seller_score").default(0),
	isNew: boolean("is_new").default(true),
	isHot: boolean("is_hot").default(false),
	status: varchar("status", { length: 20 }).default("pending").$type().notNull(),
	pendingReason: varchar("pending_reason", { length: 32 }).$type().default("new_submission"),
	submittedAt: timestamp("submitted_at"),
	reviewNotes: text("review_notes"),
	lastReviewedAt: timestamp("last_reviewed_at"),
	lastReviewedBy: text("last_reviewed_by"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("products_slug_idx").on(table.slug),
	index("products_vendor_idx").on(table.vendorId),
	index("products_category_idx").on(table.categoryId),
	index("products_bestseller_idx").on(table.bestSellerScore),
	index("products_created_idx").on(table.createdAt),
	index("products_age_range_idx").on(table.ageRangeMin, table.ageRangeMax),
	index("products_safety_idx").on(table.isBpaFree, table.isOrganic)
]);
const productImages = pgTable("product_images", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	s3Key: text("s3_key").notNull(),
	variant: varchar("variant", { length: 20 }).default("original").$type().notNull(),
	alt: varchar("alt", { length: 200 }),
	sortOrder: integer("sort_order").default(0),
	isPrimary: boolean("is_primary").default(false),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("product_images_product_idx").on(table.productId), index("product_images_variant_idx").on(table.variant)]);
const productOptions = pgTable("product_options", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	name: varchar("name", { length: 50 }).notNull(),
	nameBn: varchar("name_bn", { length: 50 }),
	values: text("values").array().notNull(),
	valuesBn: text("values_bn").array(),
	sortOrder: integer("sort_order").default(0)
}, (table) => [index("product_options_product_idx").on(table.productId)]);
const productSkus = pgTable("product_skus", {
	id: uuid("id").primaryKey().defaultRandom(),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	sku: varchar("sku", { length: 50 }).notNull().unique(),
	optionValues: jsonb("option_values").$type(),
	priceAmount: integer("price_amount").notNull(),
	compareAtAmount: integer("compare_at_amount"),
	currency: varchar("currency", { length: 3 }).default("BDT").notNull(),
	stockQty: integer("stock_qty").default(0).notNull(),
	isAvailable: boolean("is_available").default(true),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("product_skus_product_idx").on(table.productId), index("product_skus_sku_idx").on(table.sku)]);
const productsRelations = relations(products, ({ one, many }) => ({
	vendor: one(vendors, {
		fields: [products.vendorId],
		references: [vendors.id]
	}),
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	images: many(productImages),
	options: many(productOptions),
	skus: many(productSkus)
}));
const productImagesRelations = relations(productImages, ({ one }) => ({ product: one(products, {
	fields: [productImages.productId],
	references: [products.id]
}) }));
const productOptionsRelations = relations(productOptions, ({ one }) => ({ product: one(products, {
	fields: [productOptions.productId],
	references: [products.id]
}) }));
const productSkusRelations = relations(productSkus, ({ one }) => ({ product: one(products, {
	fields: [productSkus.productId],
	references: [products.id]
}) }));
const vendorsRelations = relations(vendors, ({ many }) => ({ products: many(products) }));
const categoriesProductsRelations = relations(categories, ({ many }) => ({ products: many(products) }));

//#endregion
//#region ../../packages/db/src/schema/campaigns.ts
const campaigns = pgTable("campaigns", {
	id: uuid("id").primaryKey().defaultRandom(),
	placement: varchar("placement", { length: 20 }).notNull(),
	title: varchar("title", { length: 200 }).notNull(),
	titleBn: varchar("title_bn", { length: 200 }),
	subtitle: text("subtitle"),
	subtitleBn: text("subtitle_bn"),
	imageUrl: text("image_url").notNull(),
	theme: varchar("theme", { length: 50 }),
	ctaText: varchar("cta_text", { length: 50 }),
	ctaTextBn: varchar("cta_text_bn", { length: 50 }),
	ctaLink: text("cta_link"),
	discountPercent: integer("discount_percent"),
	sortOrder: integer("sort_order").default(0),
	startsAt: timestamp("starts_at").defaultNow().notNull(),
	endsAt: timestamp("ends_at"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("campaigns_placement_idx").on(table.placement), index("campaigns_dates_idx").on(table.startsAt, table.endsAt)]);
const campaignProducts = pgTable("campaign_products", {
	campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	sortOrder: integer("sort_order").default(0)
}, (table) => [primaryKey({ columns: [table.campaignId, table.productId] }), index("campaign_products_campaign_idx").on(table.campaignId)]);
const campaignsRelations = relations(campaigns, ({ many }) => ({ campaignProducts: many(campaignProducts) }));
const campaignProductsRelations = relations(campaignProducts, ({ one }) => ({
	campaign: one(campaigns, {
		fields: [campaignProducts.campaignId],
		references: [campaigns.id]
	}),
	product: one(products, {
		fields: [campaignProducts.productId],
		references: [products.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/category-metrics.ts
const categoryMetrics = pgTable("category_metrics", {
	id: uuid("id").primaryKey().defaultRandom(),
	categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }).unique(),
	trendingScore: integer("trending_score").default(0),
	popularityScore: integer("popularity_score").default(0),
	salesVelocity: real("sales_velocity").default(0),
	momChoiceWeight: integer("mom_choice_weight").default(0),
	editorPickWeight: integer("editor_pick_weight").default(0),
	homepageWeight: integer("homepage_weight").default(0),
	seasonalTags: text("seasonal_tags").array(),
	targetAudience: text("target_audience").array(),
	embeddingVector: jsonb("embedding_vector").$type(),
	userSegmentAffinity: jsonb("user_segment_affinity").$type(),
	lastCalculatedAt: timestamp("last_calculated_at"),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date())
});
const categoryMetricsRelations = relations(categoryMetrics, ({ one }) => ({ category: one(categories, {
	fields: [categoryMetrics.categoryId],
	references: [categories.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/mega-menu.ts
const megaMenuFeaturedProducts = pgTable("mega_menu_featured_products", {
	id: uuid("id").primaryKey().defaultRandom(),
	categoryId: uuid("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	position: text("position").default("right-panel"),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("mega_menu_featured_category_idx").on(table.categoryId),
	index("mega_menu_featured_product_idx").on(table.productId),
	index("mega_menu_featured_active_idx").on(table.isActive, table.categoryId)
]);
const megaMenuFeaturedProductsRelations = relations(megaMenuFeaturedProducts, ({ one }) => ({
	category: one(categories, {
		fields: [megaMenuFeaturedProducts.categoryId],
		references: [categories.id]
	}),
	product: one(products, {
		fields: [megaMenuFeaturedProducts.productId],
		references: [products.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/home.ts
const testimonials = pgTable("testimonials", {
	id: uuid("id").primaryKey().defaultRandom(),
	quote: text("quote").notNull(),
	quoteBn: text("quote_bn"),
	customerName: varchar("customer_name", { length: 100 }).notNull(),
	location: varchar("location", { length: 100 }),
	locationBn: varchar("location_bn", { length: 100 }),
	avatarUrl: text("avatar_url"),
	rating: integer("rating").default(5),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("testimonials_active_idx").on(table.isActive)]);
const featuredCollections = pgTable("featured_collections", {
	id: uuid("id").primaryKey().defaultRandom(),
	title: varchar("title", { length: 100 }).notNull(),
	titleBn: varchar("title_bn", { length: 100 }),
	description: text("description"),
	descriptionBn: text("description_bn"),
	imageUrl: text("image_url").notNull(),
	link: text("link").notNull(),
	bgColor: varchar("bg_color", { length: 50 }),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("featured_collections_active_idx").on(table.isActive)]);
const instagramPosts = pgTable("instagram_posts", {
	id: uuid("id").primaryKey().defaultRandom(),
	imageUrl: text("image_url").notNull(),
	alt: varchar("alt", { length: 255 }),
	link: text("link"),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("instagram_posts_active_idx").on(table.isActive)]);
const newsletterSubscribers = pgTable("newsletter_subscribers", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	isActive: boolean("is_active").default(true),
	subscribedAt: timestamp("subscribed_at").defaultNow().notNull()
}, (table) => [index("newsletter_email_idx").on(table.email)]);

//#endregion
//#region ../../packages/db/src/schema/cart.ts
const carts = pgTable("carts", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
	sessionId: uuid("session_id"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
	ownerCheck: check("carts_owner_check", sql`${table.userId} IS NOT NULL OR ${table.sessionId} IS NOT NULL`),
	userIdx: index("carts_user_idx").on(table.userId),
	sessionIdx: index("carts_session_idx").on(table.sessionId)
}));
const cartItems = pgTable("cart_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	cartId: uuid("cart_id").notNull().references(() => carts.id, { onDelete: "cascade" }),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
	skuId: uuid("sku_id").references(() => productSkus.id, { onDelete: "set null" }),
	quantity: integer("quantity").notNull().default(1),
	unitPrice: integer("unit_price").notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
	cartProductSkuUnique: uniqueIndex("cart_items_cart_product_sku_unique").on(table.cartId, table.productId, table.skuId),
	cartIdx: index("cart_items_cart_idx").on(table.cartId),
	productIdx: index("cart_items_product_idx").on(table.productId)
}));
const cartsRelations = relations(carts, ({ one, many }) => ({
	user: one(user, {
		fields: [carts.userId],
		references: [user.id]
	}),
	items: many(cartItems)
}));
const cartItemsRelations = relations(cartItems, ({ one }) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
	product: one(products, {
		fields: [cartItems.productId],
		references: [products.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/wishlist.ts
const wishlists = pgTable("wishlists", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
	userUnique: uniqueIndex("wishlists_user_unique").on(table.userId),
	userIdx: index("wishlists_user_idx").on(table.userId)
}));
const wishlistItems = pgTable("wishlist_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	wishlistId: uuid("wishlist_id").notNull().references(() => wishlists.id, { onDelete: "cascade" }),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => ({
	wishlistProductUnique: uniqueIndex("wishlist_items_wishlist_product_unique").on(table.wishlistId, table.productId),
	wishlistIdx: index("wishlist_items_wishlist_idx").on(table.wishlistId),
	productIdx: index("wishlist_items_product_idx").on(table.productId)
}));
const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
	user: one(user, {
		fields: [wishlists.userId],
		references: [user.id]
	}),
	items: many(wishlistItems)
}));
const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
	wishlist: one(wishlists, {
		fields: [wishlistItems.wishlistId],
		references: [wishlists.id]
	}),
	product: one(products, {
		fields: [wishlistItems.productId],
		references: [products.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/vendor-applications.ts
const APPLICATION_STATUSES = [
	"pending",
	"approved",
	"rejected"
];
const BUSINESS_TYPES$1 = [
	"sole_proprietor",
	"partnership",
	"company"
];
const vendorApplications = pgTable("vendor_applications", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
	status: varchar("status", { length: 20 }).notNull().default("pending").$type(),
	shopNameEn: varchar("shop_name_en", { length: 200 }).notNull(),
	shopNameBn: varchar("shop_name_bn", { length: 200 }),
	ownerName: varchar("owner_name", { length: 200 }).notNull(),
	phone: varchar("phone", { length: 20 }).notNull(),
	email: varchar("email", { length: 255 }).notNull(),
	businessType: varchar("business_type", { length: 50 }).notNull().$type(),
	addressLine1: text("address_line_1").notNull(),
	addressLine2: text("address_line_2"),
	district: varchar("district", { length: 100 }).notNull(),
	city: varchar("city", { length: 100 }).notNull(),
	postalCode: varchar("postal_code", { length: 10 }),
	nidNumber: varchar("nid_number", { length: 20 }).notNull(),
	nidFrontUrl: text("nid_front_url").notNull(),
	nidBackUrl: text("nid_back_url").notNull(),
	tradeLicenseUrl: text("trade_license_url"),
	shopLogoUrl: text("shop_logo_url"),
	bankName: varchar("bank_name", { length: 100 }),
	bankAccountNumber: varchar("bank_account_number", { length: 50 }),
	bankAccountName: varchar("bank_account_name", { length: 200 }),
	bkashNumber: varchar("bkash_number", { length: 20 }),
	nagadNumber: varchar("nagad_number", { length: 20 }),
	slug: varchar("slug", { length: 200 }).notNull().unique(),
	reviewNotes: text("review_notes"),
	reviewedAt: timestamp("reviewed_at"),
	reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
	vendorId: uuid("vendor_id").references(() => vendors.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("vendor_applications_user_id_idx").on(table.userId),
	index("vendor_applications_status_idx").on(table.status),
	index("vendor_applications_slug_idx").on(table.slug)
]);

//#endregion
//#region ../../packages/db/src/schema/shipping-addresses.ts
const shippingAddresses = pgTable("shipping_addresses", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	fullName: varchar("full_name", { length: 200 }).notNull(),
	phone: varchar("phone", { length: 20 }).notNull(),
	alternatePhone: varchar("alternate_phone", { length: 20 }),
	addressLine1: text("address_line_1").notNull(),
	addressLine2: text("address_line_2"),
	city: varchar("city", { length: 100 }).notNull(),
	district: varchar("district", { length: 100 }).notNull(),
	postalCode: varchar("postal_code", { length: 10 }),
	deliveryInstructions: text("delivery_instructions"),
	isDefault: boolean("is_default").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("shipping_addresses_user_id_idx").on(table.userId)]);
const shippingAddressesRelations = relations(shippingAddresses, ({ one }) => ({ user: one(user, {
	fields: [shippingAddresses.userId],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/orders.ts
const orderNumberSequence = pgTable("order_number_sequence", {
	id: integer("id").primaryKey().default(1),
	lastNumber: integer("last_number").notNull().default(0)
});
const ORDER_STATUSES = [
	"pending",
	"confirmed",
	"processing",
	"shipped",
	"delivered",
	"paid_to_admin",
	"completed",
	"returned",
	"cancelled"
];
const PAYMENT_METHODS = ["cod"];
const orders = pgTable("orders", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderNumber: varchar("order_number", { length: 20 }).notNull().unique(),
	groupId: uuid("group_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "restrict" }),
	status: varchar("status", { length: 20 }).notNull().default("pending").$type(),
	paymentMethod: varchar("payment_method", { length: 20 }).notNull().default("cod").$type(),
	subtotal: integer("subtotal").notNull(),
	shippingCost: integer("shipping_cost").notNull(),
	codFee: integer("cod_fee").notNull().default(0),
	total: integer("total").notNull(),
	shippingAddress: jsonb("shipping_address").notNull().$type(),
	customerNotes: text("customer_notes"),
	trackingNumber: varchar("tracking_number", { length: 100 }),
	trackingCarrier: varchar("tracking_carrier", { length: 100 }),
	courierName: varchar("courier_name", { length: 40 }),
	courierOrderRef: varchar("courier_order_ref", { length: 120 }),
	commissionRateSnapshot: integer("commission_rate_snapshot"),
	commissionAmountPaisa: integer("commission_amount_paisa"),
	vendorNetPaisa: integer("vendor_net_paisa"),
	actualCourierCostPaisa: integer("actual_courier_cost_paisa").notNull().default(0),
	returnFeePaisa: integer("return_fee_paisa").notNull().default(0),
	settlementNotes: text("settlement_notes"),
	codVerifiedAt: timestamp("cod_verified_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull(),
	confirmedAt: timestamp("confirmed_at"),
	processingAt: timestamp("processing_at"),
	shippedAt: timestamp("shipped_at"),
	deliveredAt: timestamp("delivered_at"),
	paidToAdminAt: timestamp("paid_to_admin_at"),
	completedAt: timestamp("completed_at"),
	returnedAt: timestamp("returned_at"),
	cancelledAt: timestamp("cancelled_at")
}, (table) => [
	index("orders_user_id_idx").on(table.userId),
	index("orders_vendor_id_idx").on(table.vendorId),
	index("orders_group_id_idx").on(table.groupId),
	index("orders_order_number_idx").on(table.orderNumber),
	index("orders_status_idx").on(table.status),
	index("orders_created_at_idx").on(table.createdAt)
]);
const orderItems = pgTable("order_items", {
	id: uuid("id").primaryKey().defaultRandom(),
	orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
	quantity: integer("quantity").notNull(),
	unitPrice: integer("unit_price").notNull(),
	lineTotal: integer("line_total").notNull(),
	productSnapshot: jsonb("product_snapshot").notNull().$type(),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("order_items_order_id_idx").on(table.orderId), index("order_items_product_id_idx").on(table.productId)]);
const ordersRelations = relations(orders, ({ one, many }) => ({
	user: one(user, {
		fields: [orders.userId],
		references: [user.id]
	}),
	vendor: one(vendors, {
		fields: [orders.vendorId],
		references: [vendors.id]
	}),
	items: many(orderItems)
}));
const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	product: one(products, {
		fields: [orderItems.productId],
		references: [products.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/vendor-payouts.ts
const PAYOUT_STATUSES = [
	"pending",
	"completed",
	"failed"
];
const vendorPayouts = pgTable("vendor_payouts", {
	id: uuid("id").primaryKey().defaultRandom(),
	vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
	amountPaisa: integer("amount_paisa").notNull(),
	payoutFeePaisa: integer("payout_fee_paisa").notNull().default(0),
	periodStart: timestamp("period_start").notNull(),
	periodEnd: timestamp("period_end").notNull(),
	paymentMethod: varchar("payment_method", { length: 20 }).notNull(),
	paymentReference: varchar("payment_reference", { length: 100 }),
	status: varchar("status", { length: 20 }).notNull().default("pending").$type(),
	processedAt: timestamp("processed_at"),
	processedBy: text("processed_by").references(() => user.id, { onDelete: "set null" }),
	notes: text("notes"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("vendor_payouts_vendor_id_idx").on(table.vendorId), index("vendor_payouts_status_idx").on(table.status)]);
const vendorPayoutsRelations = relations(vendorPayouts, ({ one }) => ({ vendor: one(vendors, {
	fields: [vendorPayouts.vendorId],
	references: [vendors.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/transactions.ts
const TRANSACTION_TYPES = [
	"sale",
	"commission_deduction",
	"delivery_charge",
	"return_fee",
	"payout",
	"payout_fee",
	"adjustment"
];
const TRANSACTION_STATUSES = [
	"pending",
	"cleared",
	"cancelled"
];
const TRANSACTION_REFERENCE_TYPES = [
	"order",
	"payout",
	"dispute",
	"adjustment",
	"external"
];
const transactions = pgTable("transactions", {
	id: uuid("id").primaryKey().defaultRandom(),
	vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "cascade" }),
	orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
	payoutId: uuid("payout_id").references(() => vendorPayouts.id, { onDelete: "set null" }),
	type: varchar("type", { length: 40 }).notNull().$type(),
	amountPaisa: integer("amount_paisa").notNull(),
	status: varchar("status", { length: 20 }).notNull().default("pending").$type(),
	description: text("description"),
	referenceId: text("reference_id"),
	referenceType: varchar("reference_type", { length: 30 }).$type(),
	meta: jsonb("meta"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("transactions_vendor_status_created_idx").on(table.vendorId, table.status, table.createdAt),
	index("transactions_order_idx").on(table.orderId),
	index("transactions_payout_idx").on(table.payoutId),
	index("transactions_type_idx").on(table.type),
	index("transactions_reference_idx").on(table.referenceType, table.referenceId)
]);
const transactionsRelations = relations(transactions, ({ one }) => ({
	vendor: one(vendors, {
		fields: [transactions.vendorId],
		references: [vendors.id]
	}),
	order: one(orders, {
		fields: [transactions.orderId],
		references: [orders.id]
	}),
	payout: one(vendorPayouts, {
		fields: [transactions.payoutId],
		references: [vendorPayouts.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/admin.ts
const adminUsers = pgTable("admin_users", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }).unique(),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [index("admin_users_user_id_idx").on(table.userId)]);
const adminAuditLog = pgTable("admin_audit_log", {
	id: uuid("id").primaryKey().defaultRandom(),
	adminUserId: text("admin_user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	action: varchar("action", { length: 50 }).notNull(),
	entityType: varchar("entity_type", { length: 50 }).notNull(),
	entityId: text("entity_id").notNull(),
	details: jsonb("details"),
	createdAt: timestamp("created_at").defaultNow().notNull()
}, (table) => [
	index("admin_audit_log_admin_user_id_idx").on(table.adminUserId),
	index("admin_audit_log_entity_idx").on(table.entityType, table.entityId),
	index("admin_audit_log_created_at_idx").on(table.createdAt)
]);
const adminInvitations = pgTable("admin_invitations", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).notNull(),
	role: varchar("role", { length: 20 }).notNull().$type(),
	invitedBy: text("invited_by").notNull().references(() => user.id, { onDelete: "cascade" }),
	tokenHash: text("token_hash").notNull().unique(),
	expiresAt: timestamp("expires_at").notNull(),
	acceptedAt: timestamp("accepted_at"),
	status: varchar("status", { length: 20 }).notNull().default("pending").$type(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [
	index("admin_invitations_email_idx").on(table.email),
	index("admin_invitations_status_idx").on(table.status),
	index("admin_invitations_expires_at_idx").on(table.expiresAt),
	index("admin_invitations_invited_by_idx").on(table.invitedBy)
]);
const adminUsersRelations = relations(adminUsers, ({ one }) => ({ user: one(user, {
	fields: [adminUsers.userId],
	references: [user.id]
}) }));
const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({ adminUser: one(user, {
	fields: [adminAuditLog.adminUserId],
	references: [user.id]
}) }));
const adminInvitationsRelations = relations(adminInvitations, ({ one }) => ({ inviter: one(user, {
	fields: [adminInvitations.invitedBy],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/banners.ts
const BANNER_PLACEMENTS = [
	"hero_carousel",
	"promotional_card",
	"homepage_middle",
	"sidebar"
];
const banners = pgTable("banners", {
	id: uuid("id").primaryKey().defaultRandom(),
	titleEn: varchar("title_en", { length: 200 }).notNull(),
	titleBn: varchar("title_bn", { length: 200 }),
	subtitleEn: varchar("subtitle_en", { length: 300 }),
	subtitleBn: varchar("subtitle_bn", { length: 300 }),
	priceLabel: varchar("price_label", { length: 100 }),
	badgeText: varchar("badge_text", { length: 50 }),
	badgeColor: varchar("badge_color", { length: 20 }),
	ctaText: varchar("cta_text", { length: 100 }),
	discountPercentage: integer("discount_percentage"),
	imageUrl: text("image_url").notNull(),
	s3Key: text("s3_key").notNull(),
	linkUrl: text("link_url"),
	placement: varchar("placement", { length: 20 }).notNull().$type(),
	isActive: boolean("is_active").notNull().default(true),
	sortOrder: integer("sort_order").notNull().default(0),
	startsAt: timestamp("starts_at"),
	endsAt: timestamp("ends_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("banners_placement_idx").on(table.placement), index("banners_active_sort_idx").on(table.isActive, table.sortOrder)]);

//#endregion
//#region ../../packages/db/src/schema/site-settings.ts
const siteSettings = pgTable("site_settings", {
	key: varchar("key", { length: 80 }).primaryKey(),
	value: jsonb("value").notNull(),
	updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => [index("site_settings_updated_at_idx").on(table.updatedAt)]);

//#endregion
//#region ../../packages/db/src/schema/notifications.ts
const notifications = pgTable("notifications", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	type: text("type").notNull(),
	title: text("title").notNull(),
	titleBn: text("title_bn"),
	body: text("body").notNull(),
	bodyBn: text("body_bn"),
	data: jsonb("data"),
	channel: text("channel").notNull(),
	isRead: boolean("is_read").notNull().default(false),
	readAt: timestamp("read_at", { withTimezone: true }),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ userReadCreatedIdx: index("notifications_user_read_created_idx").on(table.userId, table.isRead, table.createdAt) }));
const notificationsRelations = relations(notifications, ({ one }) => ({ user: one(user, {
	fields: [notifications.userId],
	references: [user.id]
}) }));
const pushSubscriptions = pgTable("push_subscriptions", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	endpoint: text("endpoint").notNull(),
	p256dh: text("p256dh").notNull(),
	auth: text("auth").notNull(),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({
	endpointUnique: uniqueIndex("push_subscriptions_endpoint_unique").on(table.endpoint),
	userIdIdx: index("push_subscriptions_user_id_idx").on(table.userId)
}));
const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({ user: one(user, {
	fields: [pushSubscriptions.userId],
	references: [user.id]
}) }));
const notificationPreferences = pgTable("notification_preferences", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	emailEnabled: boolean("email_enabled").notNull().default(true),
	pushEnabled: boolean("push_enabled").notNull().default(true),
	orderUpdates: boolean("order_updates").notNull().default(true),
	deliveryAlerts: boolean("delivery_alerts").notNull().default(true),
	promotions: boolean("promotions").notNull().default(false),
	newOrders: boolean("new_orders").notNull().default(true),
	lowStock: boolean("low_stock").notNull().default(true),
	soundEnabled: boolean("sound_enabled").notNull().default(true),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
}, (table) => ({ userIdUnique: uniqueIndex("notification_preferences_user_id_unique").on(table.userId) }));
const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({ user: one(user, {
	fields: [notificationPreferences.userId],
	references: [user.id]
}) }));

//#endregion
//#region ../../packages/db/src/schema/reviews.ts
const REVIEW_STATUSES$1 = [
	"published",
	"hidden",
	"removed"
];
const REVIEW_VOTE_TYPES = ["helpful", "not_helpful"];
const productReviews = pgTable("product_reviews", {
	id: uuid("id").defaultRandom().primaryKey(),
	productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
	vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "restrict" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "restrict" }),
	orderItemId: uuid("order_item_id").notNull().references(() => orderItems.id, { onDelete: "restrict" }),
	rating: integer("rating").notNull(),
	title: varchar("title", { length: 180 }),
	content: text("content").notNull(),
	status: varchar("status", { length: 20 }).$type().default("published").notNull(),
	moderationReason: text("moderation_reason"),
	moderationNote: text("moderation_note"),
	moderatedAt: timestamp("moderated_at"),
	moderatedBy: text("moderated_by").references(() => user.id, { onDelete: "set null" }),
	isVerifiedPurchase: boolean("is_verified_purchase").default(true).notNull(),
	helpfulCount: integer("helpful_count").default(0).notNull(),
	notHelpfulCount: integer("not_helpful_count").default(0).notNull(),
	vendorRepliedAt: timestamp("vendor_replied_at"),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
	productStatusCreatedIdx: index("product_reviews_product_status_created_idx").on(table.productId, table.status, table.createdAt),
	vendorStatusCreatedIdx: index("product_reviews_vendor_status_created_idx").on(table.vendorId, table.status, table.createdAt),
	userCreatedIdx: index("product_reviews_user_created_idx").on(table.userId, table.createdAt),
	ratingIdx: index("product_reviews_rating_idx").on(table.rating),
	orderItemUnique: uniqueIndex("product_reviews_order_item_unique").on(table.orderItemId)
}));
const reviewVotes = pgTable("review_votes", {
	id: uuid("id").defaultRandom().primaryKey(),
	reviewId: uuid("review_id").notNull().references(() => productReviews.id, { onDelete: "cascade" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
	voteType: varchar("vote_type", { length: 20 }).$type().notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
	reviewUserUnique: uniqueIndex("review_votes_review_user_unique").on(table.reviewId, table.userId),
	reviewIdx: index("review_votes_review_idx").on(table.reviewId),
	userIdx: index("review_votes_user_idx").on(table.userId)
}));
const reviewReplies = pgTable("review_replies", {
	id: uuid("id").defaultRandom().primaryKey(),
	reviewId: uuid("review_id").notNull().references(() => productReviews.id, { onDelete: "cascade" }),
	vendorId: uuid("vendor_id").notNull().references(() => vendors.id, { onDelete: "restrict" }),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "restrict" }),
	content: text("content").notNull(),
	isHidden: boolean("is_hidden").default(false).notNull(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => /* @__PURE__ */ new Date()).notNull()
}, (table) => ({
	reviewUnique: uniqueIndex("review_replies_review_unique").on(table.reviewId),
	vendorCreatedIdx: index("review_replies_vendor_created_idx").on(table.vendorId, table.createdAt)
}));
const productReviewsRelations = relations(productReviews, ({ one, many }) => ({
	product: one(products, {
		fields: [productReviews.productId],
		references: [products.id]
	}),
	vendor: one(vendors, {
		fields: [productReviews.vendorId],
		references: [vendors.id]
	}),
	user: one(user, {
		fields: [productReviews.userId],
		references: [user.id]
	}),
	order: one(orders, {
		fields: [productReviews.orderId],
		references: [orders.id]
	}),
	orderItem: one(orderItems, {
		fields: [productReviews.orderItemId],
		references: [orderItems.id]
	}),
	votes: many(reviewVotes),
	reply: one(reviewReplies, {
		fields: [productReviews.id],
		references: [reviewReplies.reviewId]
	})
}));
const reviewVotesRelations = relations(reviewVotes, ({ one }) => ({
	review: one(productReviews, {
		fields: [reviewVotes.reviewId],
		references: [productReviews.id]
	}),
	user: one(user, {
		fields: [reviewVotes.userId],
		references: [user.id]
	})
}));
const reviewRepliesRelations = relations(reviewReplies, ({ one }) => ({
	review: one(productReviews, {
		fields: [reviewReplies.reviewId],
		references: [productReviews.id]
	}),
	vendor: one(vendors, {
		fields: [reviewReplies.vendorId],
		references: [vendors.id]
	}),
	user: one(user, {
		fields: [reviewReplies.userId],
		references: [user.id]
	})
}));

//#endregion
//#region ../../packages/db/src/schema/index.ts
var schema_exports = /* @__PURE__ */ __export({
	APPLICATION_STATUSES: () => APPLICATION_STATUSES,
	BANNER_PLACEMENTS: () => BANNER_PLACEMENTS,
	BUSINESS_TYPES: () => BUSINESS_TYPES$1,
	ORDER_STATUSES: () => ORDER_STATUSES,
	PAYMENT_METHODS: () => PAYMENT_METHODS,
	PAYOUT_STATUSES: () => PAYOUT_STATUSES,
	REVIEW_STATUSES: () => REVIEW_STATUSES$1,
	REVIEW_VOTE_TYPES: () => REVIEW_VOTE_TYPES,
	TRANSACTION_REFERENCE_TYPES: () => TRANSACTION_REFERENCE_TYPES,
	TRANSACTION_STATUSES: () => TRANSACTION_STATUSES,
	TRANSACTION_TYPES: () => TRANSACTION_TYPES,
	account: () => account,
	accountRelations: () => accountRelations,
	adminAuditLog: () => adminAuditLog,
	adminAuditLogRelations: () => adminAuditLogRelations,
	adminInvitations: () => adminInvitations,
	adminInvitationsRelations: () => adminInvitationsRelations,
	adminUsers: () => adminUsers,
	adminUsersRelations: () => adminUsersRelations,
	banners: () => banners,
	brands: () => brands,
	campaignProducts: () => campaignProducts,
	campaignProductsRelations: () => campaignProductsRelations,
	campaigns: () => campaigns,
	campaignsRelations: () => campaignsRelations,
	cartItems: () => cartItems,
	cartItemsRelations: () => cartItemsRelations,
	carts: () => carts,
	cartsRelations: () => cartsRelations,
	categories: () => categories,
	categoriesProductsRelations: () => categoriesProductsRelations,
	categoriesRelations: () => categoriesRelations,
	categoryMetrics: () => categoryMetrics,
	categoryMetricsRelations: () => categoryMetricsRelations,
	featuredCollections: () => featuredCollections,
	instagramPosts: () => instagramPosts,
	megaMenuFeaturedProducts: () => megaMenuFeaturedProducts,
	megaMenuFeaturedProductsRelations: () => megaMenuFeaturedProductsRelations,
	newsletterSubscribers: () => newsletterSubscribers,
	notificationPreferences: () => notificationPreferences,
	notificationPreferencesRelations: () => notificationPreferencesRelations,
	notifications: () => notifications,
	notificationsRelations: () => notificationsRelations,
	orderItems: () => orderItems,
	orderItemsRelations: () => orderItemsRelations,
	orderNumberSequence: () => orderNumberSequence,
	orders: () => orders,
	ordersRelations: () => ordersRelations,
	productImages: () => productImages,
	productImagesRelations: () => productImagesRelations,
	productOptions: () => productOptions,
	productOptionsRelations: () => productOptionsRelations,
	productReviews: () => productReviews,
	productReviewsRelations: () => productReviewsRelations,
	productSkus: () => productSkus,
	productSkusRelations: () => productSkusRelations,
	products: () => products,
	productsRelations: () => productsRelations,
	pushSubscriptions: () => pushSubscriptions,
	pushSubscriptionsRelations: () => pushSubscriptionsRelations,
	reviewReplies: () => reviewReplies,
	reviewRepliesRelations: () => reviewRepliesRelations,
	reviewVotes: () => reviewVotes,
	reviewVotesRelations: () => reviewVotesRelations,
	session: () => session,
	sessionRelations: () => sessionRelations,
	shippingAddresses: () => shippingAddresses,
	shippingAddressesRelations: () => shippingAddressesRelations,
	siteSettings: () => siteSettings,
	testimonials: () => testimonials,
	transactions: () => transactions,
	transactionsRelations: () => transactionsRelations,
	user: () => user,
	userRelations: () => userRelations,
	vendorApplications: () => vendorApplications,
	vendorPayouts: () => vendorPayouts,
	vendorPayoutsRelations: () => vendorPayoutsRelations,
	vendors: () => vendors,
	vendorsRelations: () => vendorsRelations,
	verification: () => verification,
	wishlistItems: () => wishlistItems,
	wishlistItemsRelations: () => wishlistItemsRelations,
	wishlists: () => wishlists,
	wishlistsRelations: () => wishlistsRelations
});

//#endregion
//#region ../../packages/db/src/lib/s3-helpers.ts
/**
* S3 URL Generation Helpers
*
* Configured for Cloudflare R2 / S3-compatible storage.
*/
function getS3Url(s3Key) {
	if (!s3Key) return "";
	if (s3Key.startsWith("http://") || s3Key.startsWith("https://")) return s3Key;
	if (s3Key.startsWith("cloudinary://")) {
		const [resourceType, ...publicId] = s3Key.slice(13).split("/");
		if (env.CLOUDINARY_CLOUD_NAME && (resourceType === "image" || resourceType === "raw")) return `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload/${publicId.join("/")}`;
	}
	const normalizedKey = s3Key.replace(/^\/+/, "");
	if (env.S3_PUBLIC_BASE_URL) return `${env.S3_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${normalizedKey}`;
	if (env.S3_ENDPOINT && env.S3_BUCKET) return `${env.S3_ENDPOINT.replace(/\/+$/, "")}/${env.S3_BUCKET}/${normalizedKey}`;
	console.warn(`No S3_PUBLIC_BASE_URL configured. Returning raw S3 key: ${s3Key}`);
	return s3Key;
}

//#endregion
//#region ../../packages/db/src/index.ts
const pool = new Pool({
	connectionString: env.DATABASE_URL,
	max: 5
});
const db = drizzle(pool, { schema: schema_exports });

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/fetch/cookies.js
var require_cookies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const urllib$4 = __require("url");
	const SESSION_TIMEOUT = 1800;
	/**
	* Creates a biskviit cookie jar for managing cookie values in memory
	*
	* @constructor
	* @param {Object} [options] Optional options object
	*/
	var Cookies$1 = class {
		constructor(options) {
			this.options = options || {};
			this.cookies = [];
		}
		/**
		* Stores a cookie string to the cookie storage
		*
		* @param {String} cookieStr Value from the 'Set-Cookie:' header
		* @param {String} url Current URL
		*/
		set(cookieStr, url) {
			let urlparts = urllib$4.parse(url || "");
			let cookie = this.parse(cookieStr);
			let domain;
			if (cookie.domain) {
				domain = cookie.domain.replace(/^\./, "");
				if (urlparts.hostname.length < domain.length || ("." + urlparts.hostname).substr(-domain.length + 1) !== "." + domain) cookie.domain = urlparts.hostname;
			} else cookie.domain = urlparts.hostname;
			if (!cookie.path) cookie.path = this.getPath(urlparts.pathname);
			if (!cookie.expires) cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1e3);
			return this.add(cookie);
		}
		/**
		* Returns cookie string for the 'Cookie:' header.
		*
		* @param {String} url URL to check for
		* @returns {String} Cookie header or empty string if no matches were found
		*/
		get(url) {
			return this.list(url).map((cookie) => cookie.name + "=" + cookie.value).join("; ");
		}
		/**
		* Lists all valied cookie objects for the specified URL
		*
		* @param {String} url URL to check for
		* @returns {Array} An array of cookie objects
		*/
		list(url) {
			let result = [];
			let i;
			let cookie;
			for (i = this.cookies.length - 1; i >= 0; i--) {
				cookie = this.cookies[i];
				if (this.isExpired(cookie)) {
					this.cookies.splice(i, i);
					continue;
				}
				if (this.match(cookie, url)) result.unshift(cookie);
			}
			return result;
		}
		/**
		* Parses cookie string from the 'Set-Cookie:' header
		*
		* @param {String} cookieStr String from the 'Set-Cookie:' header
		* @returns {Object} Cookie object
		*/
		parse(cookieStr) {
			let cookie = {};
			(cookieStr || "").toString().split(";").forEach((cookiePart) => {
				let valueParts = cookiePart.split("=");
				let key = valueParts.shift().trim().toLowerCase();
				let value = valueParts.join("=").trim();
				let domain;
				if (!key) return;
				switch (key) {
					case "expires":
						value = new Date(value);
						if (value.toString() !== "Invalid Date") cookie.expires = value;
						break;
					case "path":
						cookie.path = value;
						break;
					case "domain":
						domain = value.toLowerCase();
						if (domain.length && domain.charAt(0) !== ".") domain = "." + domain;
						cookie.domain = domain;
						break;
					case "max-age":
						cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1e3);
						break;
					case "secure":
						cookie.secure = true;
						break;
					case "httponly":
						cookie.httponly = true;
						break;
					default: if (!cookie.name) {
						cookie.name = key;
						cookie.value = value;
					}
				}
			});
			return cookie;
		}
		/**
		* Checks if a cookie object is valid for a specified URL
		*
		* @param {Object} cookie Cookie object
		* @param {String} url URL to check for
		* @returns {Boolean} true if cookie is valid for specifiec URL
		*/
		match(cookie, url) {
			let urlparts = urllib$4.parse(url || "");
			if (urlparts.hostname !== cookie.domain && (cookie.domain.charAt(0) !== "." || ("." + urlparts.hostname).substr(-cookie.domain.length) !== cookie.domain)) return false;
			if (this.getPath(urlparts.pathname).substr(0, cookie.path.length) !== cookie.path) return false;
			if (cookie.secure && urlparts.protocol !== "https:") return false;
			return true;
		}
		/**
		* Adds (or updates/removes if needed) a cookie object to the cookie storage
		*
		* @param {Object} cookie Cookie value to be stored
		*/
		add(cookie) {
			let i;
			let len;
			if (!cookie || !cookie.name) return false;
			for (i = 0, len = this.cookies.length; i < len; i++) if (this.compare(this.cookies[i], cookie)) {
				if (this.isExpired(cookie)) {
					this.cookies.splice(i, 1);
					return false;
				}
				this.cookies[i] = cookie;
				return true;
			}
			if (!this.isExpired(cookie)) this.cookies.push(cookie);
			return true;
		}
		/**
		* Checks if two cookie objects are the same
		*
		* @param {Object} a Cookie to check against
		* @param {Object} b Cookie to check against
		* @returns {Boolean} True, if the cookies are the same
		*/
		compare(a, b) {
			return a.name === b.name && a.path === b.path && a.domain === b.domain && a.secure === b.secure && a.httponly === a.httponly;
		}
		/**
		* Checks if a cookie is expired
		*
		* @param {Object} cookie Cookie object to check against
		* @returns {Boolean} True, if the cookie is expired
		*/
		isExpired(cookie) {
			return cookie.expires && cookie.expires < /* @__PURE__ */ new Date() || !cookie.value;
		}
		/**
		* Returns normalized cookie path for an URL path argument
		*
		* @param {String} pathname
		* @returns {String} Normalized path
		*/
		getPath(pathname) {
			let path$3 = (pathname || "/").split("/");
			path$3.pop();
			path$3 = path$3.join("/").trim();
			if (path$3.charAt(0) !== "/") path$3 = "/" + path$3;
			if (path$3.substr(-1) !== "/") path$3 += "/";
			return path$3;
		}
	};
	module.exports = Cookies$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/package.json
var require_package = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"name": "nodemailer",
		"version": "7.0.13",
		"description": "Easy as cake e-mail sending from your Node.js applications",
		"main": "lib/nodemailer.js",
		"scripts": {
			"test": "node --test --test-concurrency=1 test/**/*.test.js test/**/*-test.js",
			"test:coverage": "c8 node --test --test-concurrency=1 test/**/*.test.js test/**/*-test.js",
			"format": "prettier --write \"**/*.{js,json,md}\"",
			"format:check": "prettier --check \"**/*.{js,json,md}\"",
			"lint": "eslint .",
			"lint:fix": "eslint . --fix",
			"update": "rm -rf node_modules/ package-lock.json && ncu -u && npm install"
		},
		"repository": {
			"type": "git",
			"url": "https://github.com/nodemailer/nodemailer.git"
		},
		"keywords": ["Nodemailer"],
		"author": "Andris Reinman",
		"license": "MIT-0",
		"bugs": { "url": "https://github.com/nodemailer/nodemailer/issues" },
		"homepage": "https://nodemailer.com/",
		"devDependencies": {
			"@aws-sdk/client-sesv2": "3.975.0",
			"bunyan": "1.8.15",
			"c8": "10.1.3",
			"eslint": "9.39.2",
			"eslint-config-prettier": "10.1.8",
			"globals": "17.1.0",
			"libbase64": "1.3.0",
			"libmime": "5.3.7",
			"libqp": "2.1.1",
			"nodemailer-ntlm-auth": "1.0.4",
			"prettier": "3.8.1",
			"proxy": "1.0.2",
			"proxy-test-server": "1.0.0",
			"smtp-server": "3.18.0"
		},
		"engines": { "node": ">=6.0.0" }
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/fetch/index.js
var require_fetch = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const http = __require("http");
	const https = __require("https");
	const urllib$3 = __require("url");
	const zlib = __require("zlib");
	const PassThrough$3 = __require("stream").PassThrough;
	const Cookies = require_cookies();
	const packageData$8 = require_package();
	const net$4 = __require("net");
	const MAX_REDIRECTS = 5;
	module.exports = function(url, options) {
		return nmfetch$4(url, options);
	};
	module.exports.Cookies = Cookies;
	function nmfetch$4(url, options) {
		options = options || {};
		options.fetchRes = options.fetchRes || new PassThrough$3();
		options.cookies = options.cookies || new Cookies();
		options.redirects = options.redirects || 0;
		options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects;
		if (options.cookie) {
			[].concat(options.cookie || []).forEach((cookie) => {
				options.cookies.set(cookie, url);
			});
			options.cookie = false;
		}
		let fetchRes = options.fetchRes;
		let parsed = urllib$3.parse(url);
		let method = (options.method || "").toString().trim().toUpperCase() || "GET";
		let finished = false;
		let cookies;
		let body;
		let handler = parsed.protocol === "https:" ? https : http;
		let headers = {
			"accept-encoding": "gzip,deflate",
			"user-agent": "nodemailer/" + packageData$8.version
		};
		Object.keys(options.headers || {}).forEach((key) => {
			headers[key.toLowerCase().trim()] = options.headers[key];
		});
		if (options.userAgent) headers["user-agent"] = options.userAgent;
		if (parsed.auth) headers.Authorization = "Basic " + Buffer.from(parsed.auth).toString("base64");
		if (cookies = options.cookies.get(url)) headers.cookie = cookies;
		if (options.body) {
			if (options.contentType !== false) headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
			if (typeof options.body.pipe === "function") {
				headers["Transfer-Encoding"] = "chunked";
				body = options.body;
				body.on("error", (err) => {
					if (finished) return;
					finished = true;
					err.type = "FETCH";
					err.sourceUrl = url;
					fetchRes.emit("error", err);
				});
			} else {
				if (options.body instanceof Buffer) body = options.body;
				else if (typeof options.body === "object") try {
					body = Buffer.from(Object.keys(options.body).map((key) => {
						let value = options.body[key].toString().trim();
						return encodeURIComponent(key) + "=" + encodeURIComponent(value);
					}).join("&"));
				} catch (E) {
					if (finished) return;
					finished = true;
					E.type = "FETCH";
					E.sourceUrl = url;
					fetchRes.emit("error", E);
					return;
				}
				else body = Buffer.from(options.body.toString().trim());
				headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
				headers["Content-Length"] = body.length;
			}
			method = (options.method || "").toString().trim().toUpperCase() || "POST";
		}
		let req;
		let reqOptions = {
			method,
			host: parsed.hostname,
			path: parsed.path,
			port: parsed.port ? parsed.port : parsed.protocol === "https:" ? 443 : 80,
			headers,
			rejectUnauthorized: false,
			agent: false
		};
		if (options.tls) Object.keys(options.tls).forEach((key) => {
			reqOptions[key] = options.tls[key];
		});
		if (parsed.protocol === "https:" && parsed.hostname && parsed.hostname !== reqOptions.host && !net$4.isIP(parsed.hostname) && !reqOptions.servername) reqOptions.servername = parsed.hostname;
		try {
			req = handler.request(reqOptions);
		} catch (E) {
			finished = true;
			setImmediate(() => {
				E.type = "FETCH";
				E.sourceUrl = url;
				fetchRes.emit("error", E);
			});
			return fetchRes;
		}
		if (options.timeout) req.setTimeout(options.timeout, () => {
			if (finished) return;
			finished = true;
			req.abort();
			let err = /* @__PURE__ */ new Error("Request Timeout");
			err.type = "FETCH";
			err.sourceUrl = url;
			fetchRes.emit("error", err);
		});
		req.on("error", (err) => {
			if (finished) return;
			finished = true;
			err.type = "FETCH";
			err.sourceUrl = url;
			fetchRes.emit("error", err);
		});
		req.on("response", (res) => {
			let inflate;
			if (finished) return;
			switch (res.headers["content-encoding"]) {
				case "gzip":
				case "deflate":
					inflate = zlib.createUnzip();
					break;
			}
			if (res.headers["set-cookie"]) [].concat(res.headers["set-cookie"] || []).forEach((cookie) => {
				options.cookies.set(cookie, url);
			});
			if ([
				301,
				302,
				303,
				307,
				308
			].includes(res.statusCode) && res.headers.location) {
				options.redirects++;
				if (options.redirects > options.maxRedirects) {
					finished = true;
					let err = /* @__PURE__ */ new Error("Maximum redirect count exceeded");
					err.type = "FETCH";
					err.sourceUrl = url;
					fetchRes.emit("error", err);
					req.abort();
					return;
				}
				options.method = "GET";
				options.body = false;
				return nmfetch$4(urllib$3.resolve(url, res.headers.location), options);
			}
			fetchRes.statusCode = res.statusCode;
			fetchRes.headers = res.headers;
			if (res.statusCode >= 300 && !options.allowErrorResponse) {
				finished = true;
				let err = /* @__PURE__ */ new Error("Invalid status code " + res.statusCode);
				err.type = "FETCH";
				err.sourceUrl = url;
				fetchRes.emit("error", err);
				req.abort();
				return;
			}
			res.on("error", (err) => {
				if (finished) return;
				finished = true;
				err.type = "FETCH";
				err.sourceUrl = url;
				fetchRes.emit("error", err);
				req.abort();
			});
			if (inflate) {
				res.pipe(inflate).pipe(fetchRes);
				inflate.on("error", (err) => {
					if (finished) return;
					finished = true;
					err.type = "FETCH";
					err.sourceUrl = url;
					fetchRes.emit("error", err);
					req.abort();
				});
			} else res.pipe(fetchRes);
		});
		setImmediate(() => {
			if (body) try {
				if (typeof body.pipe === "function") return body.pipe(req);
				else req.write(body);
			} catch (err) {
				finished = true;
				err.type = "FETCH";
				err.sourceUrl = url;
				fetchRes.emit("error", err);
				return;
			}
			req.end();
		});
		return fetchRes;
	}
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/shared/index.js
var require_shared = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const urllib$2 = __require("url");
	const util$1 = __require("util");
	const fs$2 = __require("fs");
	const nmfetch$3 = require_fetch();
	const dns$1 = __require("dns");
	const net$3 = __require("net");
	const os$1 = __require("os");
	const DNS_TTL = 300 * 1e3;
	const CACHE_CLEANUP_INTERVAL = 30 * 1e3;
	const MAX_CACHE_SIZE = 1e3;
	let lastCacheCleanup = 0;
	module.exports._lastCacheCleanup = () => lastCacheCleanup;
	module.exports._resetCacheCleanup = () => {
		lastCacheCleanup = 0;
	};
	let networkInterfaces;
	try {
		networkInterfaces = os$1.networkInterfaces();
	} catch (_err) {}
	module.exports.networkInterfaces = networkInterfaces;
	const isFamilySupported = (family, allowInternal) => {
		let networkInterfaces$1 = module.exports.networkInterfaces;
		if (!networkInterfaces$1) return true;
		return Object.keys(networkInterfaces$1).map((key) => networkInterfaces$1[key]).reduce((acc, val$1) => acc.concat(val$1), []).filter((i) => !i.internal || allowInternal).filter((i) => i.family === "IPv" + family || i.family === family).length > 0;
	};
	const resolver$1 = (family, hostname, options, callback) => {
		options = options || {};
		if (!isFamilySupported(family, options.allowInternalNetworkInterfaces)) return callback(null, []);
		(dns$1.Resolver ? new dns$1.Resolver(options) : dns$1)["resolve" + family](hostname, (err, addresses) => {
			if (err) {
				switch (err.code) {
					case dns$1.NODATA:
					case dns$1.NOTFOUND:
					case dns$1.NOTIMP:
					case dns$1.SERVFAIL:
					case dns$1.CONNREFUSED:
					case dns$1.REFUSED:
					case "EAI_AGAIN": return callback(null, []);
				}
				return callback(err);
			}
			return callback(null, Array.isArray(addresses) ? addresses : [].concat(addresses || []));
		});
	};
	const dnsCache = module.exports.dnsCache = /* @__PURE__ */ new Map();
	const formatDNSValue = (value, extra) => {
		if (!value) return Object.assign({}, extra || {});
		return Object.assign({
			servername: value.servername,
			host: !value.addresses || !value.addresses.length ? null : value.addresses.length === 1 ? value.addresses[0] : value.addresses[Math.floor(Math.random() * value.addresses.length)]
		}, extra || {});
	};
	module.exports.resolveHostname = (options, callback) => {
		options = options || {};
		if (!options.host && options.servername) options.host = options.servername;
		if (!options.host || net$3.isIP(options.host)) return callback(null, formatDNSValue({
			addresses: [options.host],
			servername: options.servername || false
		}, { cached: false }));
		let cached;
		if (dnsCache.has(options.host)) {
			cached = dnsCache.get(options.host);
			const now = Date.now();
			if (now - lastCacheCleanup > CACHE_CLEANUP_INTERVAL) {
				lastCacheCleanup = now;
				for (const [host, entry] of dnsCache.entries()) if (entry.expires && entry.expires < now) dnsCache.delete(host);
				if (dnsCache.size > MAX_CACHE_SIZE) {
					const toDelete = Math.floor(MAX_CACHE_SIZE * .1);
					Array.from(dnsCache.keys()).slice(0, toDelete).forEach((key) => dnsCache.delete(key));
				}
			}
			if (!cached.expires || cached.expires >= now) return callback(null, formatDNSValue(cached.value, { cached: true }));
		}
		resolver$1(4, options.host, options, (err, addresses) => {
			if (err) {
				if (cached) {
					dnsCache.set(options.host, {
						value: cached.value,
						expires: Date.now() + (options.dnsTtl || DNS_TTL)
					});
					return callback(null, formatDNSValue(cached.value, {
						cached: true,
						error: err
					}));
				}
				return callback(err);
			}
			if (addresses && addresses.length) {
				let value = {
					addresses,
					servername: options.servername || options.host
				};
				dnsCache.set(options.host, {
					value,
					expires: Date.now() + (options.dnsTtl || DNS_TTL)
				});
				return callback(null, formatDNSValue(value, { cached: false }));
			}
			resolver$1(6, options.host, options, (err$1, addresses$1) => {
				if (err$1) {
					if (cached) {
						dnsCache.set(options.host, {
							value: cached.value,
							expires: Date.now() + (options.dnsTtl || DNS_TTL)
						});
						return callback(null, formatDNSValue(cached.value, {
							cached: true,
							error: err$1
						}));
					}
					return callback(err$1);
				}
				if (addresses$1 && addresses$1.length) {
					let value = {
						addresses: addresses$1,
						servername: options.servername || options.host
					};
					dnsCache.set(options.host, {
						value,
						expires: Date.now() + (options.dnsTtl || DNS_TTL)
					});
					return callback(null, formatDNSValue(value, { cached: false }));
				}
				try {
					dns$1.lookup(options.host, { all: true }, (err$2, addresses$2) => {
						if (err$2) {
							if (cached) {
								dnsCache.set(options.host, {
									value: cached.value,
									expires: Date.now() + (options.dnsTtl || DNS_TTL)
								});
								return callback(null, formatDNSValue(cached.value, {
									cached: true,
									error: err$2
								}));
							}
							return callback(err$2);
						}
						let address = addresses$2 ? addresses$2.filter((addr) => isFamilySupported(addr.family)).map((addr) => addr.address).shift() : false;
						if (addresses$2 && addresses$2.length && !address) console.warn(`Failed to resolve IPv${addresses$2[0].family} addresses with current network`);
						if (!address && cached) return callback(null, formatDNSValue(cached.value, { cached: true }));
						let value = {
							addresses: address ? [address] : [options.host],
							servername: options.servername || options.host
						};
						dnsCache.set(options.host, {
							value,
							expires: Date.now() + (options.dnsTtl || DNS_TTL)
						});
						return callback(null, formatDNSValue(value, { cached: false }));
					});
				} catch (_err) {
					if (cached) {
						dnsCache.set(options.host, {
							value: cached.value,
							expires: Date.now() + (options.dnsTtl || DNS_TTL)
						});
						return callback(null, formatDNSValue(cached.value, {
							cached: true,
							error: err$1
						}));
					}
					return callback(err$1);
				}
			});
		});
	};
	/**
	* Parses connection url to a structured configuration object
	*
	* @param {String} str Connection url
	* @return {Object} Configuration object
	*/
	module.exports.parseConnectionUrl = (str) => {
		str = str || "";
		let options = {};
		[urllib$2.parse(str, true)].forEach((url) => {
			let auth$1;
			switch (url.protocol) {
				case "smtp:":
					options.secure = false;
					break;
				case "smtps:":
					options.secure = true;
					break;
				case "direct:":
					options.direct = true;
					break;
			}
			if (!isNaN(url.port) && Number(url.port)) options.port = Number(url.port);
			if (url.hostname) options.host = url.hostname;
			if (url.auth) {
				auth$1 = url.auth.split(":");
				if (!options.auth) options.auth = {};
				options.auth.user = auth$1.shift();
				options.auth.pass = auth$1.join(":");
			}
			Object.keys(url.query || {}).forEach((key) => {
				let obj = options;
				let lKey = key;
				let value = url.query[key];
				if (!isNaN(value)) value = Number(value);
				switch (value) {
					case "true":
						value = true;
						break;
					case "false":
						value = false;
						break;
				}
				if (key.indexOf("tls.") === 0) {
					lKey = key.substr(4);
					if (!options.tls) options.tls = {};
					obj = options.tls;
				} else if (key.indexOf(".") >= 0) return;
				if (!(lKey in obj)) obj[lKey] = value;
			});
		});
		return options;
	};
	module.exports._logFunc = (logger$1, level, defaults$5, data, message, ...args) => {
		let entry = {};
		Object.keys(defaults$5 || {}).forEach((key) => {
			if (key !== "level") entry[key] = defaults$5[key];
		});
		Object.keys(data || {}).forEach((key) => {
			if (key !== "level") entry[key] = data[key];
		});
		logger$1[level](entry, message, ...args);
	};
	/**
	* Returns a bunyan-compatible logger interface. Uses either provided logger or
	* creates a default console logger
	*
	* @param {Object} [options] Options object that might include 'logger' value
	* @return {Object} bunyan compatible logger
	*/
	module.exports.getLogger = (options, defaults$5) => {
		options = options || {};
		let response = {};
		let levels = [
			"trace",
			"debug",
			"info",
			"warn",
			"error",
			"fatal"
		];
		if (!options.logger) {
			levels.forEach((level) => {
				response[level] = () => false;
			});
			return response;
		}
		let logger$1 = options.logger;
		if (options.logger === true) logger$1 = createDefaultLogger(levels);
		levels.forEach((level) => {
			response[level] = (data, message, ...args) => {
				module.exports._logFunc(logger$1, level, defaults$5, data, message, ...args);
			};
		});
		return response;
	};
	/**
	* Wrapper for creating a callback that either resolves or rejects a promise
	* based on input
	*
	* @param {Function} resolve Function to run if callback is called
	* @param {Function} reject Function to run if callback ends with an error
	*/
	module.exports.callbackPromise = (resolve$1, reject) => function() {
		let args = Array.from(arguments);
		let err = args.shift();
		if (err) reject(err);
		else resolve$1(...args);
	};
	module.exports.parseDataURI = (uri) => {
		if (typeof uri !== "string") return null;
		if (!uri.startsWith("data:")) return null;
		const commaPos = uri.indexOf(",");
		if (commaPos === -1) return null;
		const data = uri.substring(commaPos + 1);
		const metaStr = uri.substring(5, commaPos);
		let encoding;
		const metaEntries = metaStr.split(";");
		if (metaEntries.length > 0) {
			const lastEntry = metaEntries[metaEntries.length - 1].toLowerCase().trim();
			if ([
				"base64",
				"utf8",
				"utf-8"
			].includes(lastEntry) && lastEntry.indexOf("=") === -1) {
				encoding = lastEntry;
				metaEntries.pop();
			}
		}
		const contentType = metaEntries.length > 0 ? metaEntries.shift() : "application/octet-stream";
		const params = {};
		for (let i = 0; i < metaEntries.length; i++) {
			const entry = metaEntries[i];
			const sepPos = entry.indexOf("=");
			if (sepPos > 0) {
				const key = entry.substring(0, sepPos).trim();
				const value = entry.substring(sepPos + 1).trim();
				if (key) params[key] = value;
			}
		}
		let bufferData;
		try {
			if (encoding === "base64") bufferData = Buffer.from(data, "base64");
			else try {
				bufferData = Buffer.from(decodeURIComponent(data));
			} catch (_decodeError) {
				bufferData = Buffer.from(data);
			}
		} catch (_bufferError) {
			bufferData = Buffer.alloc(0);
		}
		return {
			data: bufferData,
			encoding: encoding || null,
			contentType: contentType || "application/octet-stream",
			params
		};
	};
	/**
	* Resolves a String or a Buffer value for content value. Useful if the value
	* is a Stream or a file or an URL. If the value is a Stream, overwrites
	* the stream object with the resolved value (you can't stream a value twice).
	*
	* This is useful when you want to create a plugin that needs a content value,
	* for example the `html` or `text` value as a String or a Buffer but not as
	* a file path or an URL.
	*
	* @param {Object} data An object or an Array you want to resolve an element for
	* @param {String|Number} key Property name or an Array index
	* @param {Function} callback Callback function with (err, value)
	*/
	module.exports.resolveContent = (data, key, callback) => {
		let promise;
		if (!callback) promise = new Promise((resolve$1, reject) => {
			callback = module.exports.callbackPromise(resolve$1, reject);
		});
		let content = data && data[key] && data[key].content || data[key];
		let contentStream;
		let encoding = (typeof data[key] === "object" && data[key].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
		if (!content) return callback(null, content);
		if (typeof content === "object") {
			if (typeof content.pipe === "function") return resolveStream(content, (err, value) => {
				if (err) return callback(err);
				if (data[key].content) data[key].content = value;
				else data[key] = value;
				callback(null, value);
			});
			else if (/^https?:\/\//i.test(content.path || content.href)) {
				contentStream = nmfetch$3(content.path || content.href);
				return resolveStream(contentStream, callback);
			} else if (/^data:/i.test(content.path || content.href)) {
				let parsedDataUri = module.exports.parseDataURI(content.path || content.href);
				if (!parsedDataUri || !parsedDataUri.data) return callback(null, Buffer.from(0));
				return callback(null, parsedDataUri.data);
			} else if (content.path) return resolveStream(fs$2.createReadStream(content.path), callback);
		}
		if (typeof data[key].content === "string" && ![
			"utf8",
			"usascii",
			"ascii"
		].includes(encoding)) content = Buffer.from(data[key].content, encoding);
		setImmediate(() => callback(null, content));
		return promise;
	};
	/**
	* Copies properties from source objects to target objects
	*/
	module.exports.assign = function() {
		let args = Array.from(arguments);
		let target = args.shift() || {};
		args.forEach((source) => {
			Object.keys(source || {}).forEach((key) => {
				if (["tls", "auth"].includes(key) && source[key] && typeof source[key] === "object") {
					if (!target[key]) target[key] = {};
					Object.keys(source[key]).forEach((subKey) => {
						target[key][subKey] = source[key][subKey];
					});
				} else target[key] = source[key];
			});
		});
		return target;
	};
	module.exports.encodeXText = (str) => {
		if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(str)) return str;
		let buf = Buffer.from(str);
		let result = "";
		for (let i = 0, len = buf.length; i < len; i++) {
			let c = buf[i];
			if (c < 33 || c > 126 || c === 43 || c === 61) result += "+" + (c < 16 ? "0" : "") + c.toString(16).toUpperCase();
			else result += String.fromCharCode(c);
		}
		return result;
	};
	/**
	* Streams a stream value into a Buffer
	*
	* @param {Object} stream Readable stream
	* @param {Function} callback Callback function with (err, value)
	*/
	function resolveStream(stream, callback) {
		let responded = false;
		let chunks = [];
		let chunklen = 0;
		stream.on("error", (err) => {
			if (responded) return;
			responded = true;
			callback(err);
		});
		stream.on("readable", () => {
			let chunk;
			while ((chunk = stream.read()) !== null) {
				chunks.push(chunk);
				chunklen += chunk.length;
			}
		});
		stream.on("end", () => {
			if (responded) return;
			responded = true;
			let value;
			try {
				value = Buffer.concat(chunks, chunklen);
			} catch (E) {
				return callback(E);
			}
			callback(null, value);
		});
	}
	/**
	* Generates a bunyan-like logger that prints to console
	*
	* @returns {Object} Bunyan logger instance
	*/
	function createDefaultLogger(levels) {
		let levelMaxLen = 0;
		let levelNames = /* @__PURE__ */ new Map();
		levels.forEach((level) => {
			if (level.length > levelMaxLen) levelMaxLen = level.length;
		});
		levels.forEach((level) => {
			let levelName = level.toUpperCase();
			if (levelName.length < levelMaxLen) levelName += " ".repeat(levelMaxLen - levelName.length);
			levelNames.set(level, levelName);
		});
		let print = (level, entry, message, ...args) => {
			let prefix = "";
			if (entry) {
				if (entry.tnx === "server") prefix = "S: ";
				else if (entry.tnx === "client") prefix = "C: ";
				if (entry.sid) prefix = "[" + entry.sid + "] " + prefix;
				if (entry.cid) prefix = "[#" + entry.cid + "] " + prefix;
			}
			message = util$1.format(message, ...args);
			message.split(/\r?\n/).forEach((line) => {
				console.log("[%s] %s %s", (/* @__PURE__ */ new Date()).toISOString().substr(0, 19).replace(/T/, " "), levelNames.get(level), prefix + line);
			});
		};
		let logger$1 = {};
		levels.forEach((level) => {
			logger$1[level] = print.bind(null, level);
		});
		return logger$1;
	}
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mime-funcs/mime-types.js
var require_mime_types = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const path$1 = __require("path");
	const defaultMimeType = "application/octet-stream";
	const defaultExtension = "bin";
	const mimeTypes$2 = new Map([
		["application/acad", "dwg"],
		["application/applixware", "aw"],
		["application/arj", "arj"],
		["application/atom+xml", "xml"],
		["application/atomcat+xml", "atomcat"],
		["application/atomsvc+xml", "atomsvc"],
		["application/base64", ["mm", "mme"]],
		["application/binhex", "hqx"],
		["application/binhex4", "hqx"],
		["application/book", ["book", "boo"]],
		["application/ccxml+xml,", "ccxml"],
		["application/cdf", "cdf"],
		["application/cdmi-capability", "cdmia"],
		["application/cdmi-container", "cdmic"],
		["application/cdmi-domain", "cdmid"],
		["application/cdmi-object", "cdmio"],
		["application/cdmi-queue", "cdmiq"],
		["application/clariscad", "ccad"],
		["application/commonground", "dp"],
		["application/cu-seeme", "cu"],
		["application/davmount+xml", "davmount"],
		["application/drafting", "drw"],
		["application/dsptype", "tsp"],
		["application/dssc+der", "dssc"],
		["application/dssc+xml", "xdssc"],
		["application/dxf", "dxf"],
		["application/ecmascript", ["js", "es"]],
		["application/emma+xml", "emma"],
		["application/envoy", "evy"],
		["application/epub+zip", "epub"],
		["application/excel", [
			"xls",
			"xl",
			"xla",
			"xlb",
			"xlc",
			"xld",
			"xlk",
			"xll",
			"xlm",
			"xlt",
			"xlv",
			"xlw"
		]],
		["application/exi", "exi"],
		["application/font-tdpfr", "pfr"],
		["application/fractals", "fif"],
		["application/freeloader", "frl"],
		["application/futuresplash", "spl"],
		["application/geo+json", "geojson"],
		["application/gnutar", "tgz"],
		["application/groupwise", "vew"],
		["application/hlp", "hlp"],
		["application/hta", "hta"],
		["application/hyperstudio", "stk"],
		["application/i-deas", "unv"],
		["application/iges", ["iges", "igs"]],
		["application/inf", "inf"],
		["application/internet-property-stream", "acx"],
		["application/ipfix", "ipfix"],
		["application/java", "class"],
		["application/java-archive", "jar"],
		["application/java-byte-code", "class"],
		["application/java-serialized-object", "ser"],
		["application/java-vm", "class"],
		["application/javascript", "js"],
		["application/json", "json"],
		["application/lha", "lha"],
		["application/lzx", "lzx"],
		["application/mac-binary", "bin"],
		["application/mac-binhex", "hqx"],
		["application/mac-binhex40", "hqx"],
		["application/mac-compactpro", "cpt"],
		["application/macbinary", "bin"],
		["application/mads+xml", "mads"],
		["application/marc", "mrc"],
		["application/marcxml+xml", "mrcx"],
		["application/mathematica", "ma"],
		["application/mathml+xml", "mathml"],
		["application/mbedlet", "mbd"],
		["application/mbox", "mbox"],
		["application/mcad", "mcd"],
		["application/mediaservercontrol+xml", "mscml"],
		["application/metalink4+xml", "meta4"],
		["application/mets+xml", "mets"],
		["application/mime", "aps"],
		["application/mods+xml", "mods"],
		["application/mp21", "m21"],
		["application/mp4", "mp4"],
		["application/mspowerpoint", [
			"ppt",
			"pot",
			"pps",
			"ppz"
		]],
		["application/msword", [
			"doc",
			"dot",
			"w6w",
			"wiz",
			"word"
		]],
		["application/mswrite", "wri"],
		["application/mxf", "mxf"],
		["application/netmc", "mcp"],
		["application/octet-stream", ["*"]],
		["application/oda", "oda"],
		["application/oebps-package+xml", "opf"],
		["application/ogg", "ogx"],
		["application/olescript", "axs"],
		["application/onenote", "onetoc"],
		["application/patch-ops-error+xml", "xer"],
		["application/pdf", "pdf"],
		["application/pgp-encrypted", "asc"],
		["application/pgp-signature", "pgp"],
		["application/pics-rules", "prf"],
		["application/pkcs-12", "p12"],
		["application/pkcs-crl", "crl"],
		["application/pkcs10", "p10"],
		["application/pkcs7-mime", ["p7c", "p7m"]],
		["application/pkcs7-signature", "p7s"],
		["application/pkcs8", "p8"],
		["application/pkix-attr-cert", "ac"],
		["application/pkix-cert", ["cer", "crt"]],
		["application/pkix-crl", "crl"],
		["application/pkix-pkipath", "pkipath"],
		["application/pkixcmp", "pki"],
		["application/plain", "text"],
		["application/pls+xml", "pls"],
		["application/postscript", [
			"ps",
			"ai",
			"eps"
		]],
		["application/powerpoint", "ppt"],
		["application/pro_eng", ["part", "prt"]],
		["application/prs.cww", "cww"],
		["application/pskc+xml", "pskcxml"],
		["application/rdf+xml", "rdf"],
		["application/reginfo+xml", "rif"],
		["application/relax-ng-compact-syntax", "rnc"],
		["application/resource-lists+xml", "rl"],
		["application/resource-lists-diff+xml", "rld"],
		["application/ringing-tones", "rng"],
		["application/rls-services+xml", "rs"],
		["application/rsd+xml", "rsd"],
		["application/rss+xml", "xml"],
		["application/rtf", ["rtf", "rtx"]],
		["application/sbml+xml", "sbml"],
		["application/scvp-cv-request", "scq"],
		["application/scvp-cv-response", "scs"],
		["application/scvp-vp-request", "spq"],
		["application/scvp-vp-response", "spp"],
		["application/sdp", "sdp"],
		["application/sea", "sea"],
		["application/set", "set"],
		["application/set-payment-initiation", "setpay"],
		["application/set-registration-initiation", "setreg"],
		["application/shf+xml", "shf"],
		["application/sla", "stl"],
		["application/smil", ["smi", "smil"]],
		["application/smil+xml", "smi"],
		["application/solids", "sol"],
		["application/sounder", "sdr"],
		["application/sparql-query", "rq"],
		["application/sparql-results+xml", "srx"],
		["application/srgs", "gram"],
		["application/srgs+xml", "grxml"],
		["application/sru+xml", "sru"],
		["application/ssml+xml", "ssml"],
		["application/step", ["step", "stp"]],
		["application/streamingmedia", "ssm"],
		["application/tei+xml", "tei"],
		["application/thraud+xml", "tfi"],
		["application/timestamped-data", "tsd"],
		["application/toolbook", "tbk"],
		["application/vda", "vda"],
		["application/vnd.3gpp.pic-bw-large", "plb"],
		["application/vnd.3gpp.pic-bw-small", "psb"],
		["application/vnd.3gpp.pic-bw-var", "pvb"],
		["application/vnd.3gpp2.tcap", "tcap"],
		["application/vnd.3m.post-it-notes", "pwn"],
		["application/vnd.accpac.simply.aso", "aso"],
		["application/vnd.accpac.simply.imp", "imp"],
		["application/vnd.acucobol", "acu"],
		["application/vnd.acucorp", "atc"],
		["application/vnd.adobe.air-application-installer-package+zip", "air"],
		["application/vnd.adobe.fxp", "fxp"],
		["application/vnd.adobe.xdp+xml", "xdp"],
		["application/vnd.adobe.xfdf", "xfdf"],
		["application/vnd.ahead.space", "ahead"],
		["application/vnd.airzip.filesecure.azf", "azf"],
		["application/vnd.airzip.filesecure.azs", "azs"],
		["application/vnd.amazon.ebook", "azw"],
		["application/vnd.americandynamics.acc", "acc"],
		["application/vnd.amiga.ami", "ami"],
		["application/vnd.android.package-archive", "apk"],
		["application/vnd.anser-web-certificate-issue-initiation", "cii"],
		["application/vnd.anser-web-funds-transfer-initiation", "fti"],
		["application/vnd.antix.game-component", "atx"],
		["application/vnd.apple.installer+xml", "mpkg"],
		["application/vnd.apple.mpegurl", "m3u8"],
		["application/vnd.aristanetworks.swi", "swi"],
		["application/vnd.audiograph", "aep"],
		["application/vnd.blueice.multipass", "mpm"],
		["application/vnd.bmi", "bmi"],
		["application/vnd.businessobjects", "rep"],
		["application/vnd.chemdraw+xml", "cdxml"],
		["application/vnd.chipnuts.karaoke-mmd", "mmd"],
		["application/vnd.cinderella", "cdy"],
		["application/vnd.claymore", "cla"],
		["application/vnd.cloanto.rp9", "rp9"],
		["application/vnd.clonk.c4group", "c4g"],
		["application/vnd.cluetrust.cartomobile-config", "c11amc"],
		["application/vnd.cluetrust.cartomobile-config-pkg", "c11amz"],
		["application/vnd.commonspace", "csp"],
		["application/vnd.contact.cmsg", "cdbcmsg"],
		["application/vnd.cosmocaller", "cmc"],
		["application/vnd.crick.clicker", "clkx"],
		["application/vnd.crick.clicker.keyboard", "clkk"],
		["application/vnd.crick.clicker.palette", "clkp"],
		["application/vnd.crick.clicker.template", "clkt"],
		["application/vnd.crick.clicker.wordbank", "clkw"],
		["application/vnd.criticaltools.wbs+xml", "wbs"],
		["application/vnd.ctc-posml", "pml"],
		["application/vnd.cups-ppd", "ppd"],
		["application/vnd.curl.car", "car"],
		["application/vnd.curl.pcurl", "pcurl"],
		["application/vnd.data-vision.rdz", "rdz"],
		["application/vnd.denovo.fcselayout-link", "fe_launch"],
		["application/vnd.dna", "dna"],
		["application/vnd.dolby.mlp", "mlp"],
		["application/vnd.dpgraph", "dpg"],
		["application/vnd.dreamfactory", "dfac"],
		["application/vnd.dvb.ait", "ait"],
		["application/vnd.dvb.service", "svc"],
		["application/vnd.dynageo", "geo"],
		["application/vnd.ecowin.chart", "mag"],
		["application/vnd.enliven", "nml"],
		["application/vnd.epson.esf", "esf"],
		["application/vnd.epson.msf", "msf"],
		["application/vnd.epson.quickanime", "qam"],
		["application/vnd.epson.salt", "slt"],
		["application/vnd.epson.ssf", "ssf"],
		["application/vnd.eszigno3+xml", "es3"],
		["application/vnd.ezpix-album", "ez2"],
		["application/vnd.ezpix-package", "ez3"],
		["application/vnd.fdf", "fdf"],
		["application/vnd.fdsn.seed", "seed"],
		["application/vnd.flographit", "gph"],
		["application/vnd.fluxtime.clip", "ftc"],
		["application/vnd.framemaker", "fm"],
		["application/vnd.frogans.fnc", "fnc"],
		["application/vnd.frogans.ltf", "ltf"],
		["application/vnd.fsc.weblaunch", "fsc"],
		["application/vnd.fujitsu.oasys", "oas"],
		["application/vnd.fujitsu.oasys2", "oa2"],
		["application/vnd.fujitsu.oasys3", "oa3"],
		["application/vnd.fujitsu.oasysgp", "fg5"],
		["application/vnd.fujitsu.oasysprs", "bh2"],
		["application/vnd.fujixerox.ddd", "ddd"],
		["application/vnd.fujixerox.docuworks", "xdw"],
		["application/vnd.fujixerox.docuworks.binder", "xbd"],
		["application/vnd.fuzzysheet", "fzs"],
		["application/vnd.genomatix.tuxedo", "txd"],
		["application/vnd.geogebra.file", "ggb"],
		["application/vnd.geogebra.tool", "ggt"],
		["application/vnd.geometry-explorer", "gex"],
		["application/vnd.geonext", "gxt"],
		["application/vnd.geoplan", "g2w"],
		["application/vnd.geospace", "g3w"],
		["application/vnd.gmx", "gmx"],
		["application/vnd.google-earth.kml+xml", "kml"],
		["application/vnd.google-earth.kmz", "kmz"],
		["application/vnd.grafeq", "gqf"],
		["application/vnd.groove-account", "gac"],
		["application/vnd.groove-help", "ghf"],
		["application/vnd.groove-identity-message", "gim"],
		["application/vnd.groove-injector", "grv"],
		["application/vnd.groove-tool-message", "gtm"],
		["application/vnd.groove-tool-template", "tpl"],
		["application/vnd.groove-vcard", "vcg"],
		["application/vnd.hal+xml", "hal"],
		["application/vnd.handheld-entertainment+xml", "zmm"],
		["application/vnd.hbci", "hbci"],
		["application/vnd.hhe.lesson-player", "les"],
		["application/vnd.hp-hpgl", [
			"hgl",
			"hpg",
			"hpgl"
		]],
		["application/vnd.hp-hpid", "hpid"],
		["application/vnd.hp-hps", "hps"],
		["application/vnd.hp-jlyt", "jlt"],
		["application/vnd.hp-pcl", "pcl"],
		["application/vnd.hp-pclxl", "pclxl"],
		["application/vnd.hydrostatix.sof-data", "sfd-hdstx"],
		["application/vnd.hzn-3d-crossword", "x3d"],
		["application/vnd.ibm.minipay", "mpy"],
		["application/vnd.ibm.modcap", "afp"],
		["application/vnd.ibm.rights-management", "irm"],
		["application/vnd.ibm.secure-container", "sc"],
		["application/vnd.iccprofile", "icc"],
		["application/vnd.igloader", "igl"],
		["application/vnd.immervision-ivp", "ivp"],
		["application/vnd.immervision-ivu", "ivu"],
		["application/vnd.insors.igm", "igm"],
		["application/vnd.intercon.formnet", "xpw"],
		["application/vnd.intergeo", "i2g"],
		["application/vnd.intu.qbo", "qbo"],
		["application/vnd.intu.qfx", "qfx"],
		["application/vnd.ipunplugged.rcprofile", "rcprofile"],
		["application/vnd.irepository.package+xml", "irp"],
		["application/vnd.is-xpr", "xpr"],
		["application/vnd.isac.fcs", "fcs"],
		["application/vnd.jam", "jam"],
		["application/vnd.jcp.javame.midlet-rms", "rms"],
		["application/vnd.jisp", "jisp"],
		["application/vnd.joost.joda-archive", "joda"],
		["application/vnd.kahootz", "ktz"],
		["application/vnd.kde.karbon", "karbon"],
		["application/vnd.kde.kchart", "chrt"],
		["application/vnd.kde.kformula", "kfo"],
		["application/vnd.kde.kivio", "flw"],
		["application/vnd.kde.kontour", "kon"],
		["application/vnd.kde.kpresenter", "kpr"],
		["application/vnd.kde.kspread", "ksp"],
		["application/vnd.kde.kword", "kwd"],
		["application/vnd.kenameaapp", "htke"],
		["application/vnd.kidspiration", "kia"],
		["application/vnd.kinar", "kne"],
		["application/vnd.koan", "skp"],
		["application/vnd.kodak-descriptor", "sse"],
		["application/vnd.las.las+xml", "lasxml"],
		["application/vnd.llamagraphics.life-balance.desktop", "lbd"],
		["application/vnd.llamagraphics.life-balance.exchange+xml", "lbe"],
		["application/vnd.lotus-1-2-3", "123"],
		["application/vnd.lotus-approach", "apr"],
		["application/vnd.lotus-freelance", "pre"],
		["application/vnd.lotus-notes", "nsf"],
		["application/vnd.lotus-organizer", "org"],
		["application/vnd.lotus-screencam", "scm"],
		["application/vnd.lotus-wordpro", "lwp"],
		["application/vnd.macports.portpkg", "portpkg"],
		["application/vnd.mcd", "mcd"],
		["application/vnd.medcalcdata", "mc1"],
		["application/vnd.mediastation.cdkey", "cdkey"],
		["application/vnd.mfer", "mwf"],
		["application/vnd.mfmp", "mfm"],
		["application/vnd.micrografx.flo", "flo"],
		["application/vnd.micrografx.igx", "igx"],
		["application/vnd.mif", "mif"],
		["application/vnd.mobius.daf", "daf"],
		["application/vnd.mobius.dis", "dis"],
		["application/vnd.mobius.mbk", "mbk"],
		["application/vnd.mobius.mqy", "mqy"],
		["application/vnd.mobius.msl", "msl"],
		["application/vnd.mobius.plc", "plc"],
		["application/vnd.mobius.txf", "txf"],
		["application/vnd.mophun.application", "mpn"],
		["application/vnd.mophun.certificate", "mpc"],
		["application/vnd.mozilla.xul+xml", "xul"],
		["application/vnd.ms-artgalry", "cil"],
		["application/vnd.ms-cab-compressed", "cab"],
		["application/vnd.ms-excel", [
			"xls",
			"xla",
			"xlc",
			"xlm",
			"xlt",
			"xlw",
			"xlb",
			"xll"
		]],
		["application/vnd.ms-excel.addin.macroenabled.12", "xlam"],
		["application/vnd.ms-excel.sheet.binary.macroenabled.12", "xlsb"],
		["application/vnd.ms-excel.sheet.macroenabled.12", "xlsm"],
		["application/vnd.ms-excel.template.macroenabled.12", "xltm"],
		["application/vnd.ms-fontobject", "eot"],
		["application/vnd.ms-htmlhelp", "chm"],
		["application/vnd.ms-ims", "ims"],
		["application/vnd.ms-lrm", "lrm"],
		["application/vnd.ms-officetheme", "thmx"],
		["application/vnd.ms-outlook", "msg"],
		["application/vnd.ms-pki.certstore", "sst"],
		["application/vnd.ms-pki.pko", "pko"],
		["application/vnd.ms-pki.seccat", "cat"],
		["application/vnd.ms-pki.stl", "stl"],
		["application/vnd.ms-pkicertstore", "sst"],
		["application/vnd.ms-pkiseccat", "cat"],
		["application/vnd.ms-pkistl", "stl"],
		["application/vnd.ms-powerpoint", [
			"ppt",
			"pot",
			"pps",
			"ppa",
			"pwz"
		]],
		["application/vnd.ms-powerpoint.addin.macroenabled.12", "ppam"],
		["application/vnd.ms-powerpoint.presentation.macroenabled.12", "pptm"],
		["application/vnd.ms-powerpoint.slide.macroenabled.12", "sldm"],
		["application/vnd.ms-powerpoint.slideshow.macroenabled.12", "ppsm"],
		["application/vnd.ms-powerpoint.template.macroenabled.12", "potm"],
		["application/vnd.ms-project", "mpp"],
		["application/vnd.ms-word.document.macroenabled.12", "docm"],
		["application/vnd.ms-word.template.macroenabled.12", "dotm"],
		["application/vnd.ms-works", [
			"wks",
			"wcm",
			"wdb",
			"wps"
		]],
		["application/vnd.ms-wpl", "wpl"],
		["application/vnd.ms-xpsdocument", "xps"],
		["application/vnd.mseq", "mseq"],
		["application/vnd.musician", "mus"],
		["application/vnd.muvee.style", "msty"],
		["application/vnd.neurolanguage.nlu", "nlu"],
		["application/vnd.noblenet-directory", "nnd"],
		["application/vnd.noblenet-sealer", "nns"],
		["application/vnd.noblenet-web", "nnw"],
		["application/vnd.nokia.configuration-message", "ncm"],
		["application/vnd.nokia.n-gage.data", "ngdat"],
		["application/vnd.nokia.n-gage.symbian.install", "n-gage"],
		["application/vnd.nokia.radio-preset", "rpst"],
		["application/vnd.nokia.radio-presets", "rpss"],
		["application/vnd.nokia.ringing-tone", "rng"],
		["application/vnd.novadigm.edm", "edm"],
		["application/vnd.novadigm.edx", "edx"],
		["application/vnd.novadigm.ext", "ext"],
		["application/vnd.oasis.opendocument.chart", "odc"],
		["application/vnd.oasis.opendocument.chart-template", "otc"],
		["application/vnd.oasis.opendocument.database", "odb"],
		["application/vnd.oasis.opendocument.formula", "odf"],
		["application/vnd.oasis.opendocument.formula-template", "odft"],
		["application/vnd.oasis.opendocument.graphics", "odg"],
		["application/vnd.oasis.opendocument.graphics-template", "otg"],
		["application/vnd.oasis.opendocument.image", "odi"],
		["application/vnd.oasis.opendocument.image-template", "oti"],
		["application/vnd.oasis.opendocument.presentation", "odp"],
		["application/vnd.oasis.opendocument.presentation-template", "otp"],
		["application/vnd.oasis.opendocument.spreadsheet", "ods"],
		["application/vnd.oasis.opendocument.spreadsheet-template", "ots"],
		["application/vnd.oasis.opendocument.text", "odt"],
		["application/vnd.oasis.opendocument.text-master", "odm"],
		["application/vnd.oasis.opendocument.text-template", "ott"],
		["application/vnd.oasis.opendocument.text-web", "oth"],
		["application/vnd.olpc-sugar", "xo"],
		["application/vnd.oma.dd2+xml", "dd2"],
		["application/vnd.openofficeorg.extension", "oxt"],
		["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
		["application/vnd.openxmlformats-officedocument.presentationml.slide", "sldx"],
		["application/vnd.openxmlformats-officedocument.presentationml.slideshow", "ppsx"],
		["application/vnd.openxmlformats-officedocument.presentationml.template", "potx"],
		["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
		["application/vnd.openxmlformats-officedocument.spreadsheetml.template", "xltx"],
		["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
		["application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx"],
		["application/vnd.osgeo.mapguide.package", "mgp"],
		["application/vnd.osgi.dp", "dp"],
		["application/vnd.palm", "pdb"],
		["application/vnd.pawaafile", "paw"],
		["application/vnd.pg.format", "str"],
		["application/vnd.pg.osasli", "ei6"],
		["application/vnd.picsel", "efif"],
		["application/vnd.pmi.widget", "wg"],
		["application/vnd.pocketlearn", "plf"],
		["application/vnd.powerbuilder6", "pbd"],
		["application/vnd.previewsystems.box", "box"],
		["application/vnd.proteus.magazine", "mgz"],
		["application/vnd.publishare-delta-tree", "qps"],
		["application/vnd.pvi.ptid1", "ptid"],
		["application/vnd.quark.quarkxpress", "qxd"],
		["application/vnd.realvnc.bed", "bed"],
		["application/vnd.recordare.musicxml", "mxl"],
		["application/vnd.recordare.musicxml+xml", "musicxml"],
		["application/vnd.rig.cryptonote", "cryptonote"],
		["application/vnd.rim.cod", "cod"],
		["application/vnd.rn-realmedia", "rm"],
		["application/vnd.rn-realplayer", "rnx"],
		["application/vnd.route66.link66+xml", "link66"],
		["application/vnd.sailingtracker.track", "st"],
		["application/vnd.seemail", "see"],
		["application/vnd.sema", "sema"],
		["application/vnd.semd", "semd"],
		["application/vnd.semf", "semf"],
		["application/vnd.shana.informed.formdata", "ifm"],
		["application/vnd.shana.informed.formtemplate", "itp"],
		["application/vnd.shana.informed.interchange", "iif"],
		["application/vnd.shana.informed.package", "ipk"],
		["application/vnd.simtech-mindmapper", "twd"],
		["application/vnd.smaf", "mmf"],
		["application/vnd.smart.teacher", "teacher"],
		["application/vnd.solent.sdkm+xml", "sdkm"],
		["application/vnd.spotfire.dxp", "dxp"],
		["application/vnd.spotfire.sfs", "sfs"],
		["application/vnd.stardivision.calc", "sdc"],
		["application/vnd.stardivision.draw", "sda"],
		["application/vnd.stardivision.impress", "sdd"],
		["application/vnd.stardivision.math", "smf"],
		["application/vnd.stardivision.writer", "sdw"],
		["application/vnd.stardivision.writer-global", "sgl"],
		["application/vnd.stepmania.stepchart", "sm"],
		["application/vnd.sun.xml.calc", "sxc"],
		["application/vnd.sun.xml.calc.template", "stc"],
		["application/vnd.sun.xml.draw", "sxd"],
		["application/vnd.sun.xml.draw.template", "std"],
		["application/vnd.sun.xml.impress", "sxi"],
		["application/vnd.sun.xml.impress.template", "sti"],
		["application/vnd.sun.xml.math", "sxm"],
		["application/vnd.sun.xml.writer", "sxw"],
		["application/vnd.sun.xml.writer.global", "sxg"],
		["application/vnd.sun.xml.writer.template", "stw"],
		["application/vnd.sus-calendar", "sus"],
		["application/vnd.svd", "svd"],
		["application/vnd.symbian.install", "sis"],
		["application/vnd.syncml+xml", "xsm"],
		["application/vnd.syncml.dm+wbxml", "bdm"],
		["application/vnd.syncml.dm+xml", "xdm"],
		["application/vnd.tao.intent-module-archive", "tao"],
		["application/vnd.tmobile-livetv", "tmo"],
		["application/vnd.trid.tpt", "tpt"],
		["application/vnd.triscape.mxs", "mxs"],
		["application/vnd.trueapp", "tra"],
		["application/vnd.ufdl", "ufd"],
		["application/vnd.uiq.theme", "utz"],
		["application/vnd.umajin", "umj"],
		["application/vnd.unity", "unityweb"],
		["application/vnd.uoml+xml", "uoml"],
		["application/vnd.vcx", "vcx"],
		["application/vnd.visio", "vsd"],
		["application/vnd.visionary", "vis"],
		["application/vnd.vsf", "vsf"],
		["application/vnd.wap.wbxml", "wbxml"],
		["application/vnd.wap.wmlc", "wmlc"],
		["application/vnd.wap.wmlscriptc", "wmlsc"],
		["application/vnd.webturbo", "wtb"],
		["application/vnd.wolfram.player", "nbp"],
		["application/vnd.wordperfect", "wpd"],
		["application/vnd.wqd", "wqd"],
		["application/vnd.wt.stf", "stf"],
		["application/vnd.xara", ["web", "xar"]],
		["application/vnd.xfdl", "xfdl"],
		["application/vnd.yamaha.hv-dic", "hvd"],
		["application/vnd.yamaha.hv-script", "hvs"],
		["application/vnd.yamaha.hv-voice", "hvp"],
		["application/vnd.yamaha.openscoreformat", "osf"],
		["application/vnd.yamaha.openscoreformat.osfpvg+xml", "osfpvg"],
		["application/vnd.yamaha.smaf-audio", "saf"],
		["application/vnd.yamaha.smaf-phrase", "spf"],
		["application/vnd.yellowriver-custom-menu", "cmp"],
		["application/vnd.zul", "zir"],
		["application/vnd.zzazz.deck+xml", "zaz"],
		["application/vocaltec-media-desc", "vmd"],
		["application/vocaltec-media-file", "vmf"],
		["application/voicexml+xml", "vxml"],
		["application/widget", "wgt"],
		["application/winhlp", "hlp"],
		["application/wordperfect", [
			"wp",
			"wp5",
			"wp6",
			"wpd"
		]],
		["application/wordperfect6.0", ["w60", "wp5"]],
		["application/wordperfect6.1", "w61"],
		["application/wsdl+xml", "wsdl"],
		["application/wspolicy+xml", "wspolicy"],
		["application/x-123", "wk1"],
		["application/x-7z-compressed", "7z"],
		["application/x-abiword", "abw"],
		["application/x-ace-compressed", "ace"],
		["application/x-aim", "aim"],
		["application/x-authorware-bin", "aab"],
		["application/x-authorware-map", "aam"],
		["application/x-authorware-seg", "aas"],
		["application/x-bcpio", "bcpio"],
		["application/x-binary", "bin"],
		["application/x-binhex40", "hqx"],
		["application/x-bittorrent", "torrent"],
		["application/x-bsh", [
			"bsh",
			"sh",
			"shar"
		]],
		["application/x-bytecode.elisp", "elc"],
		["application/x-bytecode.python", "pyc"],
		["application/x-bzip", "bz"],
		["application/x-bzip2", ["boz", "bz2"]],
		["application/x-cdf", "cdf"],
		["application/x-cdlink", "vcd"],
		["application/x-chat", ["cha", "chat"]],
		["application/x-chess-pgn", "pgn"],
		["application/x-cmu-raster", "ras"],
		["application/x-cocoa", "cco"],
		["application/x-compactpro", "cpt"],
		["application/x-compress", "z"],
		["application/x-compressed", [
			"tgz",
			"gz",
			"z",
			"zip"
		]],
		["application/x-conference", "nsc"],
		["application/x-cpio", "cpio"],
		["application/x-cpt", "cpt"],
		["application/x-csh", "csh"],
		["application/x-debian-package", "deb"],
		["application/x-deepv", "deepv"],
		["application/x-director", [
			"dir",
			"dcr",
			"dxr"
		]],
		["application/x-doom", "wad"],
		["application/x-dtbncx+xml", "ncx"],
		["application/x-dtbook+xml", "dtb"],
		["application/x-dtbresource+xml", "res"],
		["application/x-dvi", "dvi"],
		["application/x-elc", "elc"],
		["application/x-envoy", ["env", "evy"]],
		["application/x-esrehber", "es"],
		["application/x-excel", [
			"xls",
			"xla",
			"xlb",
			"xlc",
			"xld",
			"xlk",
			"xll",
			"xlm",
			"xlt",
			"xlv",
			"xlw"
		]],
		["application/x-font-bdf", "bdf"],
		["application/x-font-ghostscript", "gsf"],
		["application/x-font-linux-psf", "psf"],
		["application/x-font-otf", "otf"],
		["application/x-font-pcf", "pcf"],
		["application/x-font-snf", "snf"],
		["application/x-font-ttf", "ttf"],
		["application/x-font-type1", "pfa"],
		["application/x-font-woff", "woff"],
		["application/x-frame", "mif"],
		["application/x-freelance", "pre"],
		["application/x-futuresplash", "spl"],
		["application/x-gnumeric", "gnumeric"],
		["application/x-gsp", "gsp"],
		["application/x-gss", "gss"],
		["application/x-gtar", "gtar"],
		["application/x-gzip", ["gz", "gzip"]],
		["application/x-hdf", "hdf"],
		["application/x-helpfile", ["help", "hlp"]],
		["application/x-httpd-imap", "imap"],
		["application/x-ima", "ima"],
		["application/x-internet-signup", ["ins", "isp"]],
		["application/x-internett-signup", "ins"],
		["application/x-inventor", "iv"],
		["application/x-ip2", "ip"],
		["application/x-iphone", "iii"],
		["application/x-java-class", "class"],
		["application/x-java-commerce", "jcm"],
		["application/x-java-jnlp-file", "jnlp"],
		["application/x-javascript", "js"],
		["application/x-koan", [
			"skd",
			"skm",
			"skp",
			"skt"
		]],
		["application/x-ksh", "ksh"],
		["application/x-latex", ["latex", "ltx"]],
		["application/x-lha", "lha"],
		["application/x-lisp", "lsp"],
		["application/x-livescreen", "ivy"],
		["application/x-lotus", "wq1"],
		["application/x-lotusscreencam", "scm"],
		["application/x-lzh", "lzh"],
		["application/x-lzx", "lzx"],
		["application/x-mac-binhex40", "hqx"],
		["application/x-macbinary", "bin"],
		["application/x-magic-cap-package-1.0", "mc$"],
		["application/x-mathcad", "mcd"],
		["application/x-meme", "mm"],
		["application/x-midi", ["mid", "midi"]],
		["application/x-mif", "mif"],
		["application/x-mix-transfer", "nix"],
		["application/x-mobipocket-ebook", "prc"],
		["application/x-mplayer2", "asx"],
		["application/x-ms-application", "application"],
		["application/x-ms-wmd", "wmd"],
		["application/x-ms-wmz", "wmz"],
		["application/x-ms-xbap", "xbap"],
		["application/x-msaccess", "mdb"],
		["application/x-msbinder", "obd"],
		["application/x-mscardfile", "crd"],
		["application/x-msclip", "clp"],
		["application/x-msdownload", ["exe", "dll"]],
		["application/x-msexcel", [
			"xls",
			"xla",
			"xlw"
		]],
		["application/x-msmediaview", [
			"mvb",
			"m13",
			"m14"
		]],
		["application/x-msmetafile", "wmf"],
		["application/x-msmoney", "mny"],
		["application/x-mspowerpoint", "ppt"],
		["application/x-mspublisher", "pub"],
		["application/x-msschedule", "scd"],
		["application/x-msterminal", "trm"],
		["application/x-mswrite", "wri"],
		["application/x-navi-animation", "ani"],
		["application/x-navidoc", "nvd"],
		["application/x-navimap", "map"],
		["application/x-navistyle", "stl"],
		["application/x-netcdf", ["cdf", "nc"]],
		["application/x-newton-compatible-pkg", "pkg"],
		["application/x-nokia-9000-communicator-add-on-software", "aos"],
		["application/x-omc", "omc"],
		["application/x-omcdatamaker", "omcd"],
		["application/x-omcregerator", "omcr"],
		["application/x-pagemaker", ["pm4", "pm5"]],
		["application/x-pcl", "pcl"],
		["application/x-perfmon", [
			"pma",
			"pmc",
			"pml",
			"pmr",
			"pmw"
		]],
		["application/x-pixclscript", "plx"],
		["application/x-pkcs10", "p10"],
		["application/x-pkcs12", ["p12", "pfx"]],
		["application/x-pkcs7-certificates", ["p7b", "spc"]],
		["application/x-pkcs7-certreqresp", "p7r"],
		["application/x-pkcs7-mime", ["p7m", "p7c"]],
		["application/x-pkcs7-signature", ["p7s", "p7a"]],
		["application/x-pointplus", "css"],
		["application/x-portable-anymap", "pnm"],
		["application/x-project", [
			"mpc",
			"mpt",
			"mpv",
			"mpx"
		]],
		["application/x-qpro", "wb1"],
		["application/x-rar-compressed", "rar"],
		["application/x-rtf", "rtf"],
		["application/x-sdp", "sdp"],
		["application/x-sea", "sea"],
		["application/x-seelogo", "sl"],
		["application/x-sh", "sh"],
		["application/x-shar", ["shar", "sh"]],
		["application/x-shockwave-flash", "swf"],
		["application/x-silverlight-app", "xap"],
		["application/x-sit", "sit"],
		["application/x-sprite", ["spr", "sprite"]],
		["application/x-stuffit", "sit"],
		["application/x-stuffitx", "sitx"],
		["application/x-sv4cpio", "sv4cpio"],
		["application/x-sv4crc", "sv4crc"],
		["application/x-tar", "tar"],
		["application/x-tbook", ["sbk", "tbk"]],
		["application/x-tcl", "tcl"],
		["application/x-tex", "tex"],
		["application/x-tex-tfm", "tfm"],
		["application/x-texinfo", ["texi", "texinfo"]],
		["application/x-troff", [
			"roff",
			"t",
			"tr"
		]],
		["application/x-troff-man", "man"],
		["application/x-troff-me", "me"],
		["application/x-troff-ms", "ms"],
		["application/x-troff-msvideo", "avi"],
		["application/x-ustar", "ustar"],
		["application/x-visio", [
			"vsd",
			"vst",
			"vsw"
		]],
		["application/x-vnd.audioexplosion.mzz", "mzz"],
		["application/x-vnd.ls-xpix", "xpix"],
		["application/x-vrml", "vrml"],
		["application/x-wais-source", ["src", "wsrc"]],
		["application/x-winhelp", "hlp"],
		["application/x-wintalk", "wtk"],
		["application/x-world", ["wrl", "svr"]],
		["application/x-wpwin", "wpd"],
		["application/x-wri", "wri"],
		["application/x-x509-ca-cert", [
			"cer",
			"crt",
			"der"
		]],
		["application/x-x509-user-cert", "crt"],
		["application/x-xfig", "fig"],
		["application/x-xpinstall", "xpi"],
		["application/x-zip-compressed", "zip"],
		["application/xcap-diff+xml", "xdf"],
		["application/xenc+xml", "xenc"],
		["application/xhtml+xml", "xhtml"],
		["application/xml", "xml"],
		["application/xml-dtd", "dtd"],
		["application/xop+xml", "xop"],
		["application/xslt+xml", "xslt"],
		["application/xspf+xml", "xspf"],
		["application/xv+xml", "mxml"],
		["application/yang", "yang"],
		["application/yin+xml", "yin"],
		["application/ynd.ms-pkipko", "pko"],
		["application/zip", "zip"],
		["audio/adpcm", "adp"],
		["audio/aiff", [
			"aiff",
			"aif",
			"aifc"
		]],
		["audio/basic", ["snd", "au"]],
		["audio/it", "it"],
		["audio/make", [
			"funk",
			"my",
			"pfunk"
		]],
		["audio/make.my.funk", "pfunk"],
		["audio/mid", ["mid", "rmi"]],
		["audio/midi", [
			"midi",
			"kar",
			"mid"
		]],
		["audio/mod", "mod"],
		["audio/mp4", "mp4a"],
		["audio/mpeg", [
			"mpga",
			"mp3",
			"m2a",
			"mp2",
			"mpa",
			"mpg"
		]],
		["audio/mpeg3", "mp3"],
		["audio/nspaudio", ["la", "lma"]],
		["audio/ogg", "oga"],
		["audio/s3m", "s3m"],
		["audio/tsp-audio", "tsi"],
		["audio/tsplayer", "tsp"],
		["audio/vnd.dece.audio", "uva"],
		["audio/vnd.digital-winds", "eol"],
		["audio/vnd.dra", "dra"],
		["audio/vnd.dts", "dts"],
		["audio/vnd.dts.hd", "dtshd"],
		["audio/vnd.lucent.voice", "lvp"],
		["audio/vnd.ms-playready.media.pya", "pya"],
		["audio/vnd.nuera.ecelp4800", "ecelp4800"],
		["audio/vnd.nuera.ecelp7470", "ecelp7470"],
		["audio/vnd.nuera.ecelp9600", "ecelp9600"],
		["audio/vnd.qcelp", "qcp"],
		["audio/vnd.rip", "rip"],
		["audio/voc", "voc"],
		["audio/voxware", "vox"],
		["audio/wav", "wav"],
		["audio/webm", "weba"],
		["audio/x-aac", "aac"],
		["audio/x-adpcm", "snd"],
		["audio/x-aiff", [
			"aiff",
			"aif",
			"aifc"
		]],
		["audio/x-au", "au"],
		["audio/x-gsm", ["gsd", "gsm"]],
		["audio/x-jam", "jam"],
		["audio/x-liveaudio", "lam"],
		["audio/x-mid", ["mid", "midi"]],
		["audio/x-midi", ["midi", "mid"]],
		["audio/x-mod", "mod"],
		["audio/x-mpeg", "mp2"],
		["audio/x-mpeg-3", "mp3"],
		["audio/x-mpegurl", "m3u"],
		["audio/x-mpequrl", "m3u"],
		["audio/x-ms-wax", "wax"],
		["audio/x-ms-wma", "wma"],
		["audio/x-nspaudio", ["la", "lma"]],
		["audio/x-pn-realaudio", [
			"ra",
			"ram",
			"rm",
			"rmm",
			"rmp"
		]],
		["audio/x-pn-realaudio-plugin", [
			"ra",
			"rmp",
			"rpm"
		]],
		["audio/x-psid", "sid"],
		["audio/x-realaudio", "ra"],
		["audio/x-twinvq", "vqf"],
		["audio/x-twinvq-plugin", ["vqe", "vql"]],
		["audio/x-vnd.audioexplosion.mjuicemediafile", "mjf"],
		["audio/x-voc", "voc"],
		["audio/x-wav", "wav"],
		["audio/xm", "xm"],
		["chemical/x-cdx", "cdx"],
		["chemical/x-cif", "cif"],
		["chemical/x-cmdf", "cmdf"],
		["chemical/x-cml", "cml"],
		["chemical/x-csml", "csml"],
		["chemical/x-pdb", ["pdb", "xyz"]],
		["chemical/x-xyz", "xyz"],
		["drawing/x-dwf", "dwf"],
		["i-world/i-vrml", "ivr"],
		["image/bmp", ["bmp", "bm"]],
		["image/cgm", "cgm"],
		["image/cis-cod", "cod"],
		["image/cmu-raster", ["ras", "rast"]],
		["image/fif", "fif"],
		["image/florian", ["flo", "turbot"]],
		["image/g3fax", "g3"],
		["image/gif", "gif"],
		["image/ief", ["ief", "iefs"]],
		["image/jpeg", [
			"jpeg",
			"jpe",
			"jpg",
			"jfif",
			"jfif-tbnl"
		]],
		["image/jutvision", "jut"],
		["image/ktx", "ktx"],
		["image/naplps", ["nap", "naplps"]],
		["image/pict", ["pic", "pict"]],
		["image/pipeg", "jfif"],
		["image/pjpeg", [
			"jfif",
			"jpe",
			"jpeg",
			"jpg"
		]],
		["image/png", ["png", "x-png"]],
		["image/prs.btif", "btif"],
		["image/svg+xml", "svg"],
		["image/tiff", ["tif", "tiff"]],
		["image/vasa", "mcf"],
		["image/vnd.adobe.photoshop", "psd"],
		["image/vnd.dece.graphic", "uvi"],
		["image/vnd.djvu", "djvu"],
		["image/vnd.dvb.subtitle", "sub"],
		["image/vnd.dwg", [
			"dwg",
			"dxf",
			"svf"
		]],
		["image/vnd.dxf", "dxf"],
		["image/vnd.fastbidsheet", "fbs"],
		["image/vnd.fpx", "fpx"],
		["image/vnd.fst", "fst"],
		["image/vnd.fujixerox.edmics-mmr", "mmr"],
		["image/vnd.fujixerox.edmics-rlc", "rlc"],
		["image/vnd.ms-modi", "mdi"],
		["image/vnd.net-fpx", ["fpx", "npx"]],
		["image/vnd.rn-realflash", "rf"],
		["image/vnd.rn-realpix", "rp"],
		["image/vnd.wap.wbmp", "wbmp"],
		["image/vnd.xiff", "xif"],
		["image/webp", "webp"],
		["image/x-cmu-raster", "ras"],
		["image/x-cmx", "cmx"],
		["image/x-dwg", [
			"dwg",
			"dxf",
			"svf"
		]],
		["image/x-freehand", "fh"],
		["image/x-icon", "ico"],
		["image/x-jg", "art"],
		["image/x-jps", "jps"],
		["image/x-niff", ["niff", "nif"]],
		["image/x-pcx", "pcx"],
		["image/x-pict", ["pct", "pic"]],
		["image/x-portable-anymap", "pnm"],
		["image/x-portable-bitmap", "pbm"],
		["image/x-portable-graymap", "pgm"],
		["image/x-portable-greymap", "pgm"],
		["image/x-portable-pixmap", "ppm"],
		["image/x-quicktime", [
			"qif",
			"qti",
			"qtif"
		]],
		["image/x-rgb", "rgb"],
		["image/x-tiff", ["tif", "tiff"]],
		["image/x-windows-bmp", "bmp"],
		["image/x-xbitmap", "xbm"],
		["image/x-xbm", "xbm"],
		["image/x-xpixmap", ["xpm", "pm"]],
		["image/x-xwd", "xwd"],
		["image/x-xwindowdump", "xwd"],
		["image/xbm", "xbm"],
		["image/xpm", "xpm"],
		["message/rfc822", [
			"eml",
			"mht",
			"mhtml",
			"nws",
			"mime"
		]],
		["model/iges", ["iges", "igs"]],
		["model/mesh", "msh"],
		["model/vnd.collada+xml", "dae"],
		["model/vnd.dwf", "dwf"],
		["model/vnd.gdl", "gdl"],
		["model/vnd.gtw", "gtw"],
		["model/vnd.mts", "mts"],
		["model/vnd.vtu", "vtu"],
		["model/vrml", [
			"vrml",
			"wrl",
			"wrz"
		]],
		["model/x-pov", "pov"],
		["multipart/x-gzip", "gzip"],
		["multipart/x-ustar", "ustar"],
		["multipart/x-zip", "zip"],
		["music/crescendo", ["mid", "midi"]],
		["music/x-karaoke", "kar"],
		["paleovu/x-pv", "pvu"],
		["text/asp", "asp"],
		["text/calendar", "ics"],
		["text/css", "css"],
		["text/csv", "csv"],
		["text/ecmascript", "js"],
		["text/h323", "323"],
		["text/html", [
			"html",
			"htm",
			"stm",
			"acgi",
			"htmls",
			"htx",
			"shtml"
		]],
		["text/iuls", "uls"],
		["text/javascript", "js"],
		["text/mcf", "mcf"],
		["text/n3", "n3"],
		["text/pascal", "pas"],
		["text/plain", [
			"txt",
			"bas",
			"c",
			"h",
			"c++",
			"cc",
			"com",
			"conf",
			"cxx",
			"def",
			"f",
			"f90",
			"for",
			"g",
			"hh",
			"idc",
			"jav",
			"java",
			"list",
			"log",
			"lst",
			"m",
			"mar",
			"pl",
			"sdml",
			"text"
		]],
		["text/plain-bas", "par"],
		["text/prs.lines.tag", "dsc"],
		["text/richtext", [
			"rtx",
			"rt",
			"rtf"
		]],
		["text/scriplet", "wsc"],
		["text/scriptlet", "sct"],
		["text/sgml", ["sgm", "sgml"]],
		["text/tab-separated-values", "tsv"],
		["text/troff", "t"],
		["text/turtle", "ttl"],
		["text/uri-list", [
			"uni",
			"unis",
			"uri",
			"uris"
		]],
		["text/vnd.abc", "abc"],
		["text/vnd.curl", "curl"],
		["text/vnd.curl.dcurl", "dcurl"],
		["text/vnd.curl.mcurl", "mcurl"],
		["text/vnd.curl.scurl", "scurl"],
		["text/vnd.fly", "fly"],
		["text/vnd.fmi.flexstor", "flx"],
		["text/vnd.graphviz", "gv"],
		["text/vnd.in3d.3dml", "3dml"],
		["text/vnd.in3d.spot", "spot"],
		["text/vnd.rn-realtext", "rt"],
		["text/vnd.sun.j2me.app-descriptor", "jad"],
		["text/vnd.wap.wml", "wml"],
		["text/vnd.wap.wmlscript", "wmls"],
		["text/webviewhtml", "htt"],
		["text/x-asm", ["asm", "s"]],
		["text/x-audiosoft-intra", "aip"],
		["text/x-c", [
			"c",
			"cc",
			"cpp"
		]],
		["text/x-component", "htc"],
		["text/x-fortran", [
			"for",
			"f",
			"f77",
			"f90"
		]],
		["text/x-h", ["h", "hh"]],
		["text/x-java-source", ["java", "jav"]],
		["text/x-java-source,java", "java"],
		["text/x-la-asf", "lsx"],
		["text/x-m", "m"],
		["text/x-pascal", "p"],
		["text/x-script", "hlb"],
		["text/x-script.csh", "csh"],
		["text/x-script.elisp", "el"],
		["text/x-script.guile", "scm"],
		["text/x-script.ksh", "ksh"],
		["text/x-script.lisp", "lsp"],
		["text/x-script.perl", "pl"],
		["text/x-script.perl-module", "pm"],
		["text/x-script.phyton", "py"],
		["text/x-script.rexx", "rexx"],
		["text/x-script.scheme", "scm"],
		["text/x-script.sh", "sh"],
		["text/x-script.tcl", "tcl"],
		["text/x-script.tcsh", "tcsh"],
		["text/x-script.zsh", "zsh"],
		["text/x-server-parsed-html", ["shtml", "ssi"]],
		["text/x-setext", "etx"],
		["text/x-sgml", ["sgm", "sgml"]],
		["text/x-speech", ["spc", "talk"]],
		["text/x-uil", "uil"],
		["text/x-uuencode", ["uu", "uue"]],
		["text/x-vcalendar", "vcs"],
		["text/x-vcard", "vcf"],
		["text/xml", "xml"],
		["video/3gpp", "3gp"],
		["video/3gpp2", "3g2"],
		["video/animaflex", "afl"],
		["video/avi", "avi"],
		["video/avs-video", "avs"],
		["video/dl", "dl"],
		["video/fli", "fli"],
		["video/gl", "gl"],
		["video/h261", "h261"],
		["video/h263", "h263"],
		["video/h264", "h264"],
		["video/jpeg", "jpgv"],
		["video/jpm", "jpm"],
		["video/mj2", "mj2"],
		["video/mp4", "mp4"],
		["video/mpeg", [
			"mpeg",
			"mp2",
			"mpa",
			"mpe",
			"mpg",
			"mpv2",
			"m1v",
			"m2v",
			"mp3"
		]],
		["video/msvideo", "avi"],
		["video/ogg", "ogv"],
		["video/quicktime", [
			"mov",
			"qt",
			"moov"
		]],
		["video/vdo", "vdo"],
		["video/vivo", ["viv", "vivo"]],
		["video/vnd.dece.hd", "uvh"],
		["video/vnd.dece.mobile", "uvm"],
		["video/vnd.dece.pd", "uvp"],
		["video/vnd.dece.sd", "uvs"],
		["video/vnd.dece.video", "uvv"],
		["video/vnd.fvt", "fvt"],
		["video/vnd.mpegurl", "mxu"],
		["video/vnd.ms-playready.media.pyv", "pyv"],
		["video/vnd.rn-realvideo", "rv"],
		["video/vnd.uvvu.mp4", "uvu"],
		["video/vnd.vivo", ["viv", "vivo"]],
		["video/vosaic", "vos"],
		["video/webm", "webm"],
		["video/x-amt-demorun", "xdr"],
		["video/x-amt-showrun", "xsr"],
		["video/x-atomic3d-feature", "fmf"],
		["video/x-dl", "dl"],
		["video/x-dv", ["dif", "dv"]],
		["video/x-f4v", "f4v"],
		["video/x-fli", "fli"],
		["video/x-flv", "flv"],
		["video/x-gl", "gl"],
		["video/x-isvideo", "isu"],
		["video/x-la-asf", ["lsf", "lsx"]],
		["video/x-m4v", "m4v"],
		["video/x-motion-jpeg", "mjpg"],
		["video/x-mpeg", ["mp3", "mp2"]],
		["video/x-mpeq2a", "mp2"],
		["video/x-ms-asf", [
			"asf",
			"asr",
			"asx"
		]],
		["video/x-ms-asf-plugin", "asx"],
		["video/x-ms-wm", "wm"],
		["video/x-ms-wmv", "wmv"],
		["video/x-ms-wmx", "wmx"],
		["video/x-ms-wvx", "wvx"],
		["video/x-msvideo", "avi"],
		["video/x-qtc", "qtc"],
		["video/x-scm", "scm"],
		["video/x-sgi-movie", ["movie", "mv"]],
		["windows/metafile", "wmf"],
		["www/mime", "mime"],
		["x-conference/x-cooltalk", "ice"],
		["x-music/x-midi", ["mid", "midi"]],
		["x-world/x-3dmf", [
			"3dm",
			"3dmf",
			"qd3",
			"qd3d"
		]],
		["x-world/x-svr", "svr"],
		["x-world/x-vrml", [
			"flr",
			"vrml",
			"wrl",
			"wrz",
			"xaf",
			"xof"
		]],
		["x-world/x-vrt", "vrt"],
		["xgl/drawing", "xgz"],
		["xgl/movie", "xmz"]
	]);
	const extensions = new Map([
		["123", "application/vnd.lotus-1-2-3"],
		["323", "text/h323"],
		["*", "application/octet-stream"],
		["3dm", "x-world/x-3dmf"],
		["3dmf", "x-world/x-3dmf"],
		["3dml", "text/vnd.in3d.3dml"],
		["3g2", "video/3gpp2"],
		["3gp", "video/3gpp"],
		["7z", "application/x-7z-compressed"],
		["a", "application/octet-stream"],
		["aab", "application/x-authorware-bin"],
		["aac", "audio/x-aac"],
		["aam", "application/x-authorware-map"],
		["aas", "application/x-authorware-seg"],
		["abc", "text/vnd.abc"],
		["abw", "application/x-abiword"],
		["ac", "application/pkix-attr-cert"],
		["acc", "application/vnd.americandynamics.acc"],
		["ace", "application/x-ace-compressed"],
		["acgi", "text/html"],
		["acu", "application/vnd.acucobol"],
		["acx", "application/internet-property-stream"],
		["adp", "audio/adpcm"],
		["aep", "application/vnd.audiograph"],
		["afl", "video/animaflex"],
		["afp", "application/vnd.ibm.modcap"],
		["ahead", "application/vnd.ahead.space"],
		["ai", "application/postscript"],
		["aif", ["audio/aiff", "audio/x-aiff"]],
		["aifc", ["audio/aiff", "audio/x-aiff"]],
		["aiff", ["audio/aiff", "audio/x-aiff"]],
		["aim", "application/x-aim"],
		["aip", "text/x-audiosoft-intra"],
		["air", "application/vnd.adobe.air-application-installer-package+zip"],
		["ait", "application/vnd.dvb.ait"],
		["ami", "application/vnd.amiga.ami"],
		["ani", "application/x-navi-animation"],
		["aos", "application/x-nokia-9000-communicator-add-on-software"],
		["apk", "application/vnd.android.package-archive"],
		["application", "application/x-ms-application"],
		["apr", "application/vnd.lotus-approach"],
		["aps", "application/mime"],
		["arc", "application/octet-stream"],
		["arj", ["application/arj", "application/octet-stream"]],
		["art", "image/x-jg"],
		["asf", "video/x-ms-asf"],
		["asm", "text/x-asm"],
		["aso", "application/vnd.accpac.simply.aso"],
		["asp", "text/asp"],
		["asr", "video/x-ms-asf"],
		["asx", [
			"video/x-ms-asf",
			"application/x-mplayer2",
			"video/x-ms-asf-plugin"
		]],
		["atc", "application/vnd.acucorp"],
		["atomcat", "application/atomcat+xml"],
		["atomsvc", "application/atomsvc+xml"],
		["atx", "application/vnd.antix.game-component"],
		["au", ["audio/basic", "audio/x-au"]],
		["avi", [
			"video/avi",
			"video/msvideo",
			"application/x-troff-msvideo",
			"video/x-msvideo"
		]],
		["avs", "video/avs-video"],
		["aw", "application/applixware"],
		["axs", "application/olescript"],
		["azf", "application/vnd.airzip.filesecure.azf"],
		["azs", "application/vnd.airzip.filesecure.azs"],
		["azw", "application/vnd.amazon.ebook"],
		["bas", "text/plain"],
		["bcpio", "application/x-bcpio"],
		["bdf", "application/x-font-bdf"],
		["bdm", "application/vnd.syncml.dm+wbxml"],
		["bed", "application/vnd.realvnc.bed"],
		["bh2", "application/vnd.fujitsu.oasysprs"],
		["bin", [
			"application/octet-stream",
			"application/mac-binary",
			"application/macbinary",
			"application/x-macbinary",
			"application/x-binary"
		]],
		["bm", "image/bmp"],
		["bmi", "application/vnd.bmi"],
		["bmp", ["image/bmp", "image/x-windows-bmp"]],
		["boo", "application/book"],
		["book", "application/book"],
		["box", "application/vnd.previewsystems.box"],
		["boz", "application/x-bzip2"],
		["bsh", "application/x-bsh"],
		["btif", "image/prs.btif"],
		["bz", "application/x-bzip"],
		["bz2", "application/x-bzip2"],
		["c", ["text/plain", "text/x-c"]],
		["c++", "text/plain"],
		["c11amc", "application/vnd.cluetrust.cartomobile-config"],
		["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
		["c4g", "application/vnd.clonk.c4group"],
		["cab", "application/vnd.ms-cab-compressed"],
		["car", "application/vnd.curl.car"],
		["cat", ["application/vnd.ms-pkiseccat", "application/vnd.ms-pki.seccat"]],
		["cc", ["text/plain", "text/x-c"]],
		["ccad", "application/clariscad"],
		["cco", "application/x-cocoa"],
		["ccxml", "application/ccxml+xml,"],
		["cdbcmsg", "application/vnd.contact.cmsg"],
		["cdf", [
			"application/cdf",
			"application/x-cdf",
			"application/x-netcdf"
		]],
		["cdkey", "application/vnd.mediastation.cdkey"],
		["cdmia", "application/cdmi-capability"],
		["cdmic", "application/cdmi-container"],
		["cdmid", "application/cdmi-domain"],
		["cdmio", "application/cdmi-object"],
		["cdmiq", "application/cdmi-queue"],
		["cdx", "chemical/x-cdx"],
		["cdxml", "application/vnd.chemdraw+xml"],
		["cdy", "application/vnd.cinderella"],
		["cer", ["application/pkix-cert", "application/x-x509-ca-cert"]],
		["cgm", "image/cgm"],
		["cha", "application/x-chat"],
		["chat", "application/x-chat"],
		["chm", "application/vnd.ms-htmlhelp"],
		["chrt", "application/vnd.kde.kchart"],
		["cif", "chemical/x-cif"],
		["cii", "application/vnd.anser-web-certificate-issue-initiation"],
		["cil", "application/vnd.ms-artgalry"],
		["cla", "application/vnd.claymore"],
		["class", [
			"application/octet-stream",
			"application/java",
			"application/java-byte-code",
			"application/java-vm",
			"application/x-java-class"
		]],
		["clkk", "application/vnd.crick.clicker.keyboard"],
		["clkp", "application/vnd.crick.clicker.palette"],
		["clkt", "application/vnd.crick.clicker.template"],
		["clkw", "application/vnd.crick.clicker.wordbank"],
		["clkx", "application/vnd.crick.clicker"],
		["clp", "application/x-msclip"],
		["cmc", "application/vnd.cosmocaller"],
		["cmdf", "chemical/x-cmdf"],
		["cml", "chemical/x-cml"],
		["cmp", "application/vnd.yellowriver-custom-menu"],
		["cmx", "image/x-cmx"],
		["cod", ["image/cis-cod", "application/vnd.rim.cod"]],
		["com", ["application/octet-stream", "text/plain"]],
		["conf", "text/plain"],
		["cpio", "application/x-cpio"],
		["cpp", "text/x-c"],
		["cpt", [
			"application/mac-compactpro",
			"application/x-compactpro",
			"application/x-cpt"
		]],
		["crd", "application/x-mscardfile"],
		["crl", ["application/pkix-crl", "application/pkcs-crl"]],
		["crt", [
			"application/pkix-cert",
			"application/x-x509-user-cert",
			"application/x-x509-ca-cert"
		]],
		["cryptonote", "application/vnd.rig.cryptonote"],
		["csh", ["text/x-script.csh", "application/x-csh"]],
		["csml", "chemical/x-csml"],
		["csp", "application/vnd.commonspace"],
		["css", ["text/css", "application/x-pointplus"]],
		["csv", "text/csv"],
		["cu", "application/cu-seeme"],
		["curl", "text/vnd.curl"],
		["cww", "application/prs.cww"],
		["cxx", "text/plain"],
		["dae", "model/vnd.collada+xml"],
		["daf", "application/vnd.mobius.daf"],
		["davmount", "application/davmount+xml"],
		["dcr", "application/x-director"],
		["dcurl", "text/vnd.curl.dcurl"],
		["dd2", "application/vnd.oma.dd2+xml"],
		["ddd", "application/vnd.fujixerox.ddd"],
		["deb", "application/x-debian-package"],
		["deepv", "application/x-deepv"],
		["def", "text/plain"],
		["der", "application/x-x509-ca-cert"],
		["dfac", "application/vnd.dreamfactory"],
		["dif", "video/x-dv"],
		["dir", "application/x-director"],
		["dis", "application/vnd.mobius.dis"],
		["djvu", "image/vnd.djvu"],
		["dl", ["video/dl", "video/x-dl"]],
		["dll", "application/x-msdownload"],
		["dms", "application/octet-stream"],
		["dna", "application/vnd.dna"],
		["doc", "application/msword"],
		["docm", "application/vnd.ms-word.document.macroenabled.12"],
		["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
		["dot", "application/msword"],
		["dotm", "application/vnd.ms-word.template.macroenabled.12"],
		["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
		["dp", ["application/commonground", "application/vnd.osgi.dp"]],
		["dpg", "application/vnd.dpgraph"],
		["dra", "audio/vnd.dra"],
		["drw", "application/drafting"],
		["dsc", "text/prs.lines.tag"],
		["dssc", "application/dssc+der"],
		["dtb", "application/x-dtbook+xml"],
		["dtd", "application/xml-dtd"],
		["dts", "audio/vnd.dts"],
		["dtshd", "audio/vnd.dts.hd"],
		["dump", "application/octet-stream"],
		["dv", "video/x-dv"],
		["dvi", "application/x-dvi"],
		["dwf", ["model/vnd.dwf", "drawing/x-dwf"]],
		["dwg", [
			"application/acad",
			"image/vnd.dwg",
			"image/x-dwg"
		]],
		["dxf", [
			"application/dxf",
			"image/vnd.dwg",
			"image/vnd.dxf",
			"image/x-dwg"
		]],
		["dxp", "application/vnd.spotfire.dxp"],
		["dxr", "application/x-director"],
		["ecelp4800", "audio/vnd.nuera.ecelp4800"],
		["ecelp7470", "audio/vnd.nuera.ecelp7470"],
		["ecelp9600", "audio/vnd.nuera.ecelp9600"],
		["edm", "application/vnd.novadigm.edm"],
		["edx", "application/vnd.novadigm.edx"],
		["efif", "application/vnd.picsel"],
		["ei6", "application/vnd.pg.osasli"],
		["el", "text/x-script.elisp"],
		["elc", ["application/x-elc", "application/x-bytecode.elisp"]],
		["eml", "message/rfc822"],
		["emma", "application/emma+xml"],
		["env", "application/x-envoy"],
		["eol", "audio/vnd.digital-winds"],
		["eot", "application/vnd.ms-fontobject"],
		["eps", "application/postscript"],
		["epub", "application/epub+zip"],
		["es", ["application/ecmascript", "application/x-esrehber"]],
		["es3", "application/vnd.eszigno3+xml"],
		["esf", "application/vnd.epson.esf"],
		["etx", "text/x-setext"],
		["evy", ["application/envoy", "application/x-envoy"]],
		["exe", ["application/octet-stream", "application/x-msdownload"]],
		["exi", "application/exi"],
		["ext", "application/vnd.novadigm.ext"],
		["ez2", "application/vnd.ezpix-album"],
		["ez3", "application/vnd.ezpix-package"],
		["f", ["text/plain", "text/x-fortran"]],
		["f4v", "video/x-f4v"],
		["f77", "text/x-fortran"],
		["f90", ["text/plain", "text/x-fortran"]],
		["fbs", "image/vnd.fastbidsheet"],
		["fcs", "application/vnd.isac.fcs"],
		["fdf", "application/vnd.fdf"],
		["fe_launch", "application/vnd.denovo.fcselayout-link"],
		["fg5", "application/vnd.fujitsu.oasysgp"],
		["fh", "image/x-freehand"],
		["fif", ["application/fractals", "image/fif"]],
		["fig", "application/x-xfig"],
		["fli", ["video/fli", "video/x-fli"]],
		["flo", ["image/florian", "application/vnd.micrografx.flo"]],
		["flr", "x-world/x-vrml"],
		["flv", "video/x-flv"],
		["flw", "application/vnd.kde.kivio"],
		["flx", "text/vnd.fmi.flexstor"],
		["fly", "text/vnd.fly"],
		["fm", "application/vnd.framemaker"],
		["fmf", "video/x-atomic3d-feature"],
		["fnc", "application/vnd.frogans.fnc"],
		["for", ["text/plain", "text/x-fortran"]],
		["fpx", ["image/vnd.fpx", "image/vnd.net-fpx"]],
		["frl", "application/freeloader"],
		["fsc", "application/vnd.fsc.weblaunch"],
		["fst", "image/vnd.fst"],
		["ftc", "application/vnd.fluxtime.clip"],
		["fti", "application/vnd.anser-web-funds-transfer-initiation"],
		["funk", "audio/make"],
		["fvt", "video/vnd.fvt"],
		["fxp", "application/vnd.adobe.fxp"],
		["fzs", "application/vnd.fuzzysheet"],
		["g", "text/plain"],
		["g2w", "application/vnd.geoplan"],
		["g3", "image/g3fax"],
		["g3w", "application/vnd.geospace"],
		["gac", "application/vnd.groove-account"],
		["gdl", "model/vnd.gdl"],
		["geo", "application/vnd.dynageo"],
		["geojson", "application/geo+json"],
		["gex", "application/vnd.geometry-explorer"],
		["ggb", "application/vnd.geogebra.file"],
		["ggt", "application/vnd.geogebra.tool"],
		["ghf", "application/vnd.groove-help"],
		["gif", "image/gif"],
		["gim", "application/vnd.groove-identity-message"],
		["gl", ["video/gl", "video/x-gl"]],
		["gmx", "application/vnd.gmx"],
		["gnumeric", "application/x-gnumeric"],
		["gph", "application/vnd.flographit"],
		["gqf", "application/vnd.grafeq"],
		["gram", "application/srgs"],
		["grv", "application/vnd.groove-injector"],
		["grxml", "application/srgs+xml"],
		["gsd", "audio/x-gsm"],
		["gsf", "application/x-font-ghostscript"],
		["gsm", "audio/x-gsm"],
		["gsp", "application/x-gsp"],
		["gss", "application/x-gss"],
		["gtar", "application/x-gtar"],
		["gtm", "application/vnd.groove-tool-message"],
		["gtw", "model/vnd.gtw"],
		["gv", "text/vnd.graphviz"],
		["gxt", "application/vnd.geonext"],
		["gz", ["application/x-gzip", "application/x-compressed"]],
		["gzip", ["multipart/x-gzip", "application/x-gzip"]],
		["h", ["text/plain", "text/x-h"]],
		["h261", "video/h261"],
		["h263", "video/h263"],
		["h264", "video/h264"],
		["hal", "application/vnd.hal+xml"],
		["hbci", "application/vnd.hbci"],
		["hdf", "application/x-hdf"],
		["help", "application/x-helpfile"],
		["hgl", "application/vnd.hp-hpgl"],
		["hh", ["text/plain", "text/x-h"]],
		["hlb", "text/x-script"],
		["hlp", [
			"application/winhlp",
			"application/hlp",
			"application/x-helpfile",
			"application/x-winhelp"
		]],
		["hpg", "application/vnd.hp-hpgl"],
		["hpgl", "application/vnd.hp-hpgl"],
		["hpid", "application/vnd.hp-hpid"],
		["hps", "application/vnd.hp-hps"],
		["hqx", [
			"application/mac-binhex40",
			"application/binhex",
			"application/binhex4",
			"application/mac-binhex",
			"application/x-binhex40",
			"application/x-mac-binhex40"
		]],
		["hta", "application/hta"],
		["htc", "text/x-component"],
		["htke", "application/vnd.kenameaapp"],
		["htm", "text/html"],
		["html", "text/html"],
		["htmls", "text/html"],
		["htt", "text/webviewhtml"],
		["htx", "text/html"],
		["hvd", "application/vnd.yamaha.hv-dic"],
		["hvp", "application/vnd.yamaha.hv-voice"],
		["hvs", "application/vnd.yamaha.hv-script"],
		["i2g", "application/vnd.intergeo"],
		["icc", "application/vnd.iccprofile"],
		["ice", "x-conference/x-cooltalk"],
		["ico", "image/x-icon"],
		["ics", "text/calendar"],
		["idc", "text/plain"],
		["ief", "image/ief"],
		["iefs", "image/ief"],
		["ifm", "application/vnd.shana.informed.formdata"],
		["iges", ["application/iges", "model/iges"]],
		["igl", "application/vnd.igloader"],
		["igm", "application/vnd.insors.igm"],
		["igs", ["application/iges", "model/iges"]],
		["igx", "application/vnd.micrografx.igx"],
		["iif", "application/vnd.shana.informed.interchange"],
		["iii", "application/x-iphone"],
		["ima", "application/x-ima"],
		["imap", "application/x-httpd-imap"],
		["imp", "application/vnd.accpac.simply.imp"],
		["ims", "application/vnd.ms-ims"],
		["inf", "application/inf"],
		["ins", ["application/x-internet-signup", "application/x-internett-signup"]],
		["ip", "application/x-ip2"],
		["ipfix", "application/ipfix"],
		["ipk", "application/vnd.shana.informed.package"],
		["irm", "application/vnd.ibm.rights-management"],
		["irp", "application/vnd.irepository.package+xml"],
		["isp", "application/x-internet-signup"],
		["isu", "video/x-isvideo"],
		["it", "audio/it"],
		["itp", "application/vnd.shana.informed.formtemplate"],
		["iv", "application/x-inventor"],
		["ivp", "application/vnd.immervision-ivp"],
		["ivr", "i-world/i-vrml"],
		["ivu", "application/vnd.immervision-ivu"],
		["ivy", "application/x-livescreen"],
		["jad", "text/vnd.sun.j2me.app-descriptor"],
		["jam", ["application/vnd.jam", "audio/x-jam"]],
		["jar", "application/java-archive"],
		["jav", ["text/plain", "text/x-java-source"]],
		["java", [
			"text/plain",
			"text/x-java-source,java",
			"text/x-java-source"
		]],
		["jcm", "application/x-java-commerce"],
		["jfif", [
			"image/pipeg",
			"image/jpeg",
			"image/pjpeg"
		]],
		["jfif-tbnl", "image/jpeg"],
		["jisp", "application/vnd.jisp"],
		["jlt", "application/vnd.hp-jlyt"],
		["jnlp", "application/x-java-jnlp-file"],
		["joda", "application/vnd.joost.joda-archive"],
		["jpe", ["image/jpeg", "image/pjpeg"]],
		["jpeg", ["image/jpeg", "image/pjpeg"]],
		["jpg", ["image/jpeg", "image/pjpeg"]],
		["jpgv", "video/jpeg"],
		["jpm", "video/jpm"],
		["jps", "image/x-jps"],
		["js", [
			"application/javascript",
			"application/ecmascript",
			"text/javascript",
			"text/ecmascript",
			"application/x-javascript"
		]],
		["json", "application/json"],
		["jut", "image/jutvision"],
		["kar", ["audio/midi", "music/x-karaoke"]],
		["karbon", "application/vnd.kde.karbon"],
		["kfo", "application/vnd.kde.kformula"],
		["kia", "application/vnd.kidspiration"],
		["kml", "application/vnd.google-earth.kml+xml"],
		["kmz", "application/vnd.google-earth.kmz"],
		["kne", "application/vnd.kinar"],
		["kon", "application/vnd.kde.kontour"],
		["kpr", "application/vnd.kde.kpresenter"],
		["ksh", ["application/x-ksh", "text/x-script.ksh"]],
		["ksp", "application/vnd.kde.kspread"],
		["ktx", "image/ktx"],
		["ktz", "application/vnd.kahootz"],
		["kwd", "application/vnd.kde.kword"],
		["la", ["audio/nspaudio", "audio/x-nspaudio"]],
		["lam", "audio/x-liveaudio"],
		["lasxml", "application/vnd.las.las+xml"],
		["latex", "application/x-latex"],
		["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
		["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
		["les", "application/vnd.hhe.lesson-player"],
		["lha", [
			"application/octet-stream",
			"application/lha",
			"application/x-lha"
		]],
		["lhx", "application/octet-stream"],
		["link66", "application/vnd.route66.link66+xml"],
		["list", "text/plain"],
		["lma", ["audio/nspaudio", "audio/x-nspaudio"]],
		["log", "text/plain"],
		["lrm", "application/vnd.ms-lrm"],
		["lsf", "video/x-la-asf"],
		["lsp", ["application/x-lisp", "text/x-script.lisp"]],
		["lst", "text/plain"],
		["lsx", ["video/x-la-asf", "text/x-la-asf"]],
		["ltf", "application/vnd.frogans.ltf"],
		["ltx", "application/x-latex"],
		["lvp", "audio/vnd.lucent.voice"],
		["lwp", "application/vnd.lotus-wordpro"],
		["lzh", ["application/octet-stream", "application/x-lzh"]],
		["lzx", [
			"application/lzx",
			"application/octet-stream",
			"application/x-lzx"
		]],
		["m", ["text/plain", "text/x-m"]],
		["m13", "application/x-msmediaview"],
		["m14", "application/x-msmediaview"],
		["m1v", "video/mpeg"],
		["m21", "application/mp21"],
		["m2a", "audio/mpeg"],
		["m2v", "video/mpeg"],
		["m3u", ["audio/x-mpegurl", "audio/x-mpequrl"]],
		["m3u8", "application/vnd.apple.mpegurl"],
		["m4v", "video/x-m4v"],
		["ma", "application/mathematica"],
		["mads", "application/mads+xml"],
		["mag", "application/vnd.ecowin.chart"],
		["man", "application/x-troff-man"],
		["map", "application/x-navimap"],
		["mar", "text/plain"],
		["mathml", "application/mathml+xml"],
		["mbd", "application/mbedlet"],
		["mbk", "application/vnd.mobius.mbk"],
		["mbox", "application/mbox"],
		["mc$", "application/x-magic-cap-package-1.0"],
		["mc1", "application/vnd.medcalcdata"],
		["mcd", [
			"application/mcad",
			"application/vnd.mcd",
			"application/x-mathcad"
		]],
		["mcf", ["image/vasa", "text/mcf"]],
		["mcp", "application/netmc"],
		["mcurl", "text/vnd.curl.mcurl"],
		["mdb", "application/x-msaccess"],
		["mdi", "image/vnd.ms-modi"],
		["me", "application/x-troff-me"],
		["meta4", "application/metalink4+xml"],
		["mets", "application/mets+xml"],
		["mfm", "application/vnd.mfmp"],
		["mgp", "application/vnd.osgeo.mapguide.package"],
		["mgz", "application/vnd.proteus.magazine"],
		["mht", "message/rfc822"],
		["mhtml", "message/rfc822"],
		["mid", [
			"audio/mid",
			"audio/midi",
			"music/crescendo",
			"x-music/x-midi",
			"audio/x-midi",
			"application/x-midi",
			"audio/x-mid"
		]],
		["midi", [
			"audio/midi",
			"music/crescendo",
			"x-music/x-midi",
			"audio/x-midi",
			"application/x-midi",
			"audio/x-mid"
		]],
		["mif", [
			"application/vnd.mif",
			"application/x-mif",
			"application/x-frame"
		]],
		["mime", ["message/rfc822", "www/mime"]],
		["mj2", "video/mj2"],
		["mjf", "audio/x-vnd.audioexplosion.mjuicemediafile"],
		["mjpg", "video/x-motion-jpeg"],
		["mlp", "application/vnd.dolby.mlp"],
		["mm", ["application/base64", "application/x-meme"]],
		["mmd", "application/vnd.chipnuts.karaoke-mmd"],
		["mme", "application/base64"],
		["mmf", "application/vnd.smaf"],
		["mmr", "image/vnd.fujixerox.edmics-mmr"],
		["mny", "application/x-msmoney"],
		["mod", ["audio/mod", "audio/x-mod"]],
		["mods", "application/mods+xml"],
		["moov", "video/quicktime"],
		["mov", "video/quicktime"],
		["movie", "video/x-sgi-movie"],
		["mp2", [
			"video/mpeg",
			"audio/mpeg",
			"video/x-mpeg",
			"audio/x-mpeg",
			"video/x-mpeq2a"
		]],
		["mp3", [
			"audio/mpeg",
			"audio/mpeg3",
			"video/mpeg",
			"audio/x-mpeg-3",
			"video/x-mpeg"
		]],
		["mp4", ["video/mp4", "application/mp4"]],
		["mp4a", "audio/mp4"],
		["mpa", ["video/mpeg", "audio/mpeg"]],
		["mpc", ["application/vnd.mophun.certificate", "application/x-project"]],
		["mpe", "video/mpeg"],
		["mpeg", "video/mpeg"],
		["mpg", ["video/mpeg", "audio/mpeg"]],
		["mpga", "audio/mpeg"],
		["mpkg", "application/vnd.apple.installer+xml"],
		["mpm", "application/vnd.blueice.multipass"],
		["mpn", "application/vnd.mophun.application"],
		["mpp", "application/vnd.ms-project"],
		["mpt", "application/x-project"],
		["mpv", "application/x-project"],
		["mpv2", "video/mpeg"],
		["mpx", "application/x-project"],
		["mpy", "application/vnd.ibm.minipay"],
		["mqy", "application/vnd.mobius.mqy"],
		["mrc", "application/marc"],
		["mrcx", "application/marcxml+xml"],
		["ms", "application/x-troff-ms"],
		["mscml", "application/mediaservercontrol+xml"],
		["mseq", "application/vnd.mseq"],
		["msf", "application/vnd.epson.msf"],
		["msg", "application/vnd.ms-outlook"],
		["msh", "model/mesh"],
		["msl", "application/vnd.mobius.msl"],
		["msty", "application/vnd.muvee.style"],
		["mts", "model/vnd.mts"],
		["mus", "application/vnd.musician"],
		["musicxml", "application/vnd.recordare.musicxml+xml"],
		["mv", "video/x-sgi-movie"],
		["mvb", "application/x-msmediaview"],
		["mwf", "application/vnd.mfer"],
		["mxf", "application/mxf"],
		["mxl", "application/vnd.recordare.musicxml"],
		["mxml", "application/xv+xml"],
		["mxs", "application/vnd.triscape.mxs"],
		["mxu", "video/vnd.mpegurl"],
		["my", "audio/make"],
		["mzz", "application/x-vnd.audioexplosion.mzz"],
		["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
		["n3", "text/n3"],
		["nap", "image/naplps"],
		["naplps", "image/naplps"],
		["nbp", "application/vnd.wolfram.player"],
		["nc", "application/x-netcdf"],
		["ncm", "application/vnd.nokia.configuration-message"],
		["ncx", "application/x-dtbncx+xml"],
		["ngdat", "application/vnd.nokia.n-gage.data"],
		["nif", "image/x-niff"],
		["niff", "image/x-niff"],
		["nix", "application/x-mix-transfer"],
		["nlu", "application/vnd.neurolanguage.nlu"],
		["nml", "application/vnd.enliven"],
		["nnd", "application/vnd.noblenet-directory"],
		["nns", "application/vnd.noblenet-sealer"],
		["nnw", "application/vnd.noblenet-web"],
		["npx", "image/vnd.net-fpx"],
		["nsc", "application/x-conference"],
		["nsf", "application/vnd.lotus-notes"],
		["nvd", "application/x-navidoc"],
		["nws", "message/rfc822"],
		["o", "application/octet-stream"],
		["oa2", "application/vnd.fujitsu.oasys2"],
		["oa3", "application/vnd.fujitsu.oasys3"],
		["oas", "application/vnd.fujitsu.oasys"],
		["obd", "application/x-msbinder"],
		["oda", "application/oda"],
		["odb", "application/vnd.oasis.opendocument.database"],
		["odc", "application/vnd.oasis.opendocument.chart"],
		["odf", "application/vnd.oasis.opendocument.formula"],
		["odft", "application/vnd.oasis.opendocument.formula-template"],
		["odg", "application/vnd.oasis.opendocument.graphics"],
		["odi", "application/vnd.oasis.opendocument.image"],
		["odm", "application/vnd.oasis.opendocument.text-master"],
		["odp", "application/vnd.oasis.opendocument.presentation"],
		["ods", "application/vnd.oasis.opendocument.spreadsheet"],
		["odt", "application/vnd.oasis.opendocument.text"],
		["oga", "audio/ogg"],
		["ogv", "video/ogg"],
		["ogx", "application/ogg"],
		["omc", "application/x-omc"],
		["omcd", "application/x-omcdatamaker"],
		["omcr", "application/x-omcregerator"],
		["onetoc", "application/onenote"],
		["opf", "application/oebps-package+xml"],
		["org", "application/vnd.lotus-organizer"],
		["osf", "application/vnd.yamaha.openscoreformat"],
		["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
		["otc", "application/vnd.oasis.opendocument.chart-template"],
		["otf", "application/x-font-otf"],
		["otg", "application/vnd.oasis.opendocument.graphics-template"],
		["oth", "application/vnd.oasis.opendocument.text-web"],
		["oti", "application/vnd.oasis.opendocument.image-template"],
		["otp", "application/vnd.oasis.opendocument.presentation-template"],
		["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
		["ott", "application/vnd.oasis.opendocument.text-template"],
		["oxt", "application/vnd.openofficeorg.extension"],
		["p", "text/x-pascal"],
		["p10", ["application/pkcs10", "application/x-pkcs10"]],
		["p12", ["application/pkcs-12", "application/x-pkcs12"]],
		["p7a", "application/x-pkcs7-signature"],
		["p7b", "application/x-pkcs7-certificates"],
		["p7c", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
		["p7m", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
		["p7r", "application/x-pkcs7-certreqresp"],
		["p7s", ["application/pkcs7-signature", "application/x-pkcs7-signature"]],
		["p8", "application/pkcs8"],
		["par", "text/plain-bas"],
		["part", "application/pro_eng"],
		["pas", "text/pascal"],
		["paw", "application/vnd.pawaafile"],
		["pbd", "application/vnd.powerbuilder6"],
		["pbm", "image/x-portable-bitmap"],
		["pcf", "application/x-font-pcf"],
		["pcl", ["application/vnd.hp-pcl", "application/x-pcl"]],
		["pclxl", "application/vnd.hp-pclxl"],
		["pct", "image/x-pict"],
		["pcurl", "application/vnd.curl.pcurl"],
		["pcx", "image/x-pcx"],
		["pdb", ["application/vnd.palm", "chemical/x-pdb"]],
		["pdf", "application/pdf"],
		["pfa", "application/x-font-type1"],
		["pfr", "application/font-tdpfr"],
		["pfunk", ["audio/make", "audio/make.my.funk"]],
		["pfx", "application/x-pkcs12"],
		["pgm", ["image/x-portable-graymap", "image/x-portable-greymap"]],
		["pgn", "application/x-chess-pgn"],
		["pgp", "application/pgp-signature"],
		["pic", ["image/pict", "image/x-pict"]],
		["pict", "image/pict"],
		["pkg", "application/x-newton-compatible-pkg"],
		["pki", "application/pkixcmp"],
		["pkipath", "application/pkix-pkipath"],
		["pko", ["application/ynd.ms-pkipko", "application/vnd.ms-pki.pko"]],
		["pl", ["text/plain", "text/x-script.perl"]],
		["plb", "application/vnd.3gpp.pic-bw-large"],
		["plc", "application/vnd.mobius.plc"],
		["plf", "application/vnd.pocketlearn"],
		["pls", "application/pls+xml"],
		["plx", "application/x-pixclscript"],
		["pm", ["text/x-script.perl-module", "image/x-xpixmap"]],
		["pm4", "application/x-pagemaker"],
		["pm5", "application/x-pagemaker"],
		["pma", "application/x-perfmon"],
		["pmc", "application/x-perfmon"],
		["pml", ["application/vnd.ctc-posml", "application/x-perfmon"]],
		["pmr", "application/x-perfmon"],
		["pmw", "application/x-perfmon"],
		["png", "image/png"],
		["pnm", ["application/x-portable-anymap", "image/x-portable-anymap"]],
		["portpkg", "application/vnd.macports.portpkg"],
		["pot", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
		["potm", "application/vnd.ms-powerpoint.template.macroenabled.12"],
		["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
		["pov", "model/x-pov"],
		["ppa", "application/vnd.ms-powerpoint"],
		["ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12"],
		["ppd", "application/vnd.cups-ppd"],
		["ppm", "image/x-portable-pixmap"],
		["pps", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
		["ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
		["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
		["ppt", [
			"application/vnd.ms-powerpoint",
			"application/mspowerpoint",
			"application/powerpoint",
			"application/x-mspowerpoint"
		]],
		["pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
		["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
		["ppz", "application/mspowerpoint"],
		["prc", "application/x-mobipocket-ebook"],
		["pre", ["application/vnd.lotus-freelance", "application/x-freelance"]],
		["prf", "application/pics-rules"],
		["prt", "application/pro_eng"],
		["ps", "application/postscript"],
		["psb", "application/vnd.3gpp.pic-bw-small"],
		["psd", ["application/octet-stream", "image/vnd.adobe.photoshop"]],
		["psf", "application/x-font-linux-psf"],
		["pskcxml", "application/pskc+xml"],
		["ptid", "application/vnd.pvi.ptid1"],
		["pub", "application/x-mspublisher"],
		["pvb", "application/vnd.3gpp.pic-bw-var"],
		["pvu", "paleovu/x-pv"],
		["pwn", "application/vnd.3m.post-it-notes"],
		["pwz", "application/vnd.ms-powerpoint"],
		["py", "text/x-script.phyton"],
		["pya", "audio/vnd.ms-playready.media.pya"],
		["pyc", "application/x-bytecode.python"],
		["pyv", "video/vnd.ms-playready.media.pyv"],
		["qam", "application/vnd.epson.quickanime"],
		["qbo", "application/vnd.intu.qbo"],
		["qcp", "audio/vnd.qcelp"],
		["qd3", "x-world/x-3dmf"],
		["qd3d", "x-world/x-3dmf"],
		["qfx", "application/vnd.intu.qfx"],
		["qif", "image/x-quicktime"],
		["qps", "application/vnd.publishare-delta-tree"],
		["qt", "video/quicktime"],
		["qtc", "video/x-qtc"],
		["qti", "image/x-quicktime"],
		["qtif", "image/x-quicktime"],
		["qxd", "application/vnd.quark.quarkxpress"],
		["ra", [
			"audio/x-realaudio",
			"audio/x-pn-realaudio",
			"audio/x-pn-realaudio-plugin"
		]],
		["ram", "audio/x-pn-realaudio"],
		["rar", "application/x-rar-compressed"],
		["ras", [
			"image/cmu-raster",
			"application/x-cmu-raster",
			"image/x-cmu-raster"
		]],
		["rast", "image/cmu-raster"],
		["rcprofile", "application/vnd.ipunplugged.rcprofile"],
		["rdf", "application/rdf+xml"],
		["rdz", "application/vnd.data-vision.rdz"],
		["rep", "application/vnd.businessobjects"],
		["res", "application/x-dtbresource+xml"],
		["rexx", "text/x-script.rexx"],
		["rf", "image/vnd.rn-realflash"],
		["rgb", "image/x-rgb"],
		["rif", "application/reginfo+xml"],
		["rip", "audio/vnd.rip"],
		["rl", "application/resource-lists+xml"],
		["rlc", "image/vnd.fujixerox.edmics-rlc"],
		["rld", "application/resource-lists-diff+xml"],
		["rm", ["application/vnd.rn-realmedia", "audio/x-pn-realaudio"]],
		["rmi", "audio/mid"],
		["rmm", "audio/x-pn-realaudio"],
		["rmp", ["audio/x-pn-realaudio-plugin", "audio/x-pn-realaudio"]],
		["rms", "application/vnd.jcp.javame.midlet-rms"],
		["rnc", "application/relax-ng-compact-syntax"],
		["rng", ["application/ringing-tones", "application/vnd.nokia.ringing-tone"]],
		["rnx", "application/vnd.rn-realplayer"],
		["roff", "application/x-troff"],
		["rp", "image/vnd.rn-realpix"],
		["rp9", "application/vnd.cloanto.rp9"],
		["rpm", "audio/x-pn-realaudio-plugin"],
		["rpss", "application/vnd.nokia.radio-presets"],
		["rpst", "application/vnd.nokia.radio-preset"],
		["rq", "application/sparql-query"],
		["rs", "application/rls-services+xml"],
		["rsd", "application/rsd+xml"],
		["rt", ["text/richtext", "text/vnd.rn-realtext"]],
		["rtf", [
			"application/rtf",
			"text/richtext",
			"application/x-rtf"
		]],
		["rtx", ["text/richtext", "application/rtf"]],
		["rv", "video/vnd.rn-realvideo"],
		["s", "text/x-asm"],
		["s3m", "audio/s3m"],
		["saf", "application/vnd.yamaha.smaf-audio"],
		["saveme", "application/octet-stream"],
		["sbk", "application/x-tbook"],
		["sbml", "application/sbml+xml"],
		["sc", "application/vnd.ibm.secure-container"],
		["scd", "application/x-msschedule"],
		["scm", [
			"application/vnd.lotus-screencam",
			"video/x-scm",
			"text/x-script.guile",
			"application/x-lotusscreencam",
			"text/x-script.scheme"
		]],
		["scq", "application/scvp-cv-request"],
		["scs", "application/scvp-cv-response"],
		["sct", "text/scriptlet"],
		["scurl", "text/vnd.curl.scurl"],
		["sda", "application/vnd.stardivision.draw"],
		["sdc", "application/vnd.stardivision.calc"],
		["sdd", "application/vnd.stardivision.impress"],
		["sdkm", "application/vnd.solent.sdkm+xml"],
		["sdml", "text/plain"],
		["sdp", ["application/sdp", "application/x-sdp"]],
		["sdr", "application/sounder"],
		["sdw", "application/vnd.stardivision.writer"],
		["sea", ["application/sea", "application/x-sea"]],
		["see", "application/vnd.seemail"],
		["seed", "application/vnd.fdsn.seed"],
		["sema", "application/vnd.sema"],
		["semd", "application/vnd.semd"],
		["semf", "application/vnd.semf"],
		["ser", "application/java-serialized-object"],
		["set", "application/set"],
		["setpay", "application/set-payment-initiation"],
		["setreg", "application/set-registration-initiation"],
		["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
		["sfs", "application/vnd.spotfire.sfs"],
		["sgl", "application/vnd.stardivision.writer-global"],
		["sgm", ["text/sgml", "text/x-sgml"]],
		["sgml", ["text/sgml", "text/x-sgml"]],
		["sh", [
			"application/x-shar",
			"application/x-bsh",
			"application/x-sh",
			"text/x-script.sh"
		]],
		["shar", ["application/x-bsh", "application/x-shar"]],
		["shf", "application/shf+xml"],
		["shtml", ["text/html", "text/x-server-parsed-html"]],
		["sid", "audio/x-psid"],
		["sis", "application/vnd.symbian.install"],
		["sit", ["application/x-stuffit", "application/x-sit"]],
		["sitx", "application/x-stuffitx"],
		["skd", "application/x-koan"],
		["skm", "application/x-koan"],
		["skp", ["application/vnd.koan", "application/x-koan"]],
		["skt", "application/x-koan"],
		["sl", "application/x-seelogo"],
		["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
		["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
		["slt", "application/vnd.epson.salt"],
		["sm", "application/vnd.stepmania.stepchart"],
		["smf", "application/vnd.stardivision.math"],
		["smi", ["application/smil", "application/smil+xml"]],
		["smil", "application/smil"],
		["snd", ["audio/basic", "audio/x-adpcm"]],
		["snf", "application/x-font-snf"],
		["sol", "application/solids"],
		["spc", ["text/x-speech", "application/x-pkcs7-certificates"]],
		["spf", "application/vnd.yamaha.smaf-phrase"],
		["spl", ["application/futuresplash", "application/x-futuresplash"]],
		["spot", "text/vnd.in3d.spot"],
		["spp", "application/scvp-vp-response"],
		["spq", "application/scvp-vp-request"],
		["spr", "application/x-sprite"],
		["sprite", "application/x-sprite"],
		["src", "application/x-wais-source"],
		["sru", "application/sru+xml"],
		["srx", "application/sparql-results+xml"],
		["sse", "application/vnd.kodak-descriptor"],
		["ssf", "application/vnd.epson.ssf"],
		["ssi", "text/x-server-parsed-html"],
		["ssm", "application/streamingmedia"],
		["ssml", "application/ssml+xml"],
		["sst", ["application/vnd.ms-pkicertstore", "application/vnd.ms-pki.certstore"]],
		["st", "application/vnd.sailingtracker.track"],
		["stc", "application/vnd.sun.xml.calc.template"],
		["std", "application/vnd.sun.xml.draw.template"],
		["step", "application/step"],
		["stf", "application/vnd.wt.stf"],
		["sti", "application/vnd.sun.xml.impress.template"],
		["stk", "application/hyperstudio"],
		["stl", [
			"application/vnd.ms-pkistl",
			"application/sla",
			"application/vnd.ms-pki.stl",
			"application/x-navistyle"
		]],
		["stm", "text/html"],
		["stp", "application/step"],
		["str", "application/vnd.pg.format"],
		["stw", "application/vnd.sun.xml.writer.template"],
		["sub", "image/vnd.dvb.subtitle"],
		["sus", "application/vnd.sus-calendar"],
		["sv4cpio", "application/x-sv4cpio"],
		["sv4crc", "application/x-sv4crc"],
		["svc", "application/vnd.dvb.service"],
		["svd", "application/vnd.svd"],
		["svf", ["image/vnd.dwg", "image/x-dwg"]],
		["svg", "image/svg+xml"],
		["svr", ["x-world/x-svr", "application/x-world"]],
		["swf", "application/x-shockwave-flash"],
		["swi", "application/vnd.aristanetworks.swi"],
		["sxc", "application/vnd.sun.xml.calc"],
		["sxd", "application/vnd.sun.xml.draw"],
		["sxg", "application/vnd.sun.xml.writer.global"],
		["sxi", "application/vnd.sun.xml.impress"],
		["sxm", "application/vnd.sun.xml.math"],
		["sxw", "application/vnd.sun.xml.writer"],
		["t", ["text/troff", "application/x-troff"]],
		["talk", "text/x-speech"],
		["tao", "application/vnd.tao.intent-module-archive"],
		["tar", "application/x-tar"],
		["tbk", ["application/toolbook", "application/x-tbook"]],
		["tcap", "application/vnd.3gpp2.tcap"],
		["tcl", ["text/x-script.tcl", "application/x-tcl"]],
		["tcsh", "text/x-script.tcsh"],
		["teacher", "application/vnd.smart.teacher"],
		["tei", "application/tei+xml"],
		["tex", "application/x-tex"],
		["texi", "application/x-texinfo"],
		["texinfo", "application/x-texinfo"],
		["text", ["application/plain", "text/plain"]],
		["tfi", "application/thraud+xml"],
		["tfm", "application/x-tex-tfm"],
		["tgz", ["application/gnutar", "application/x-compressed"]],
		["thmx", "application/vnd.ms-officetheme"],
		["tif", ["image/tiff", "image/x-tiff"]],
		["tiff", ["image/tiff", "image/x-tiff"]],
		["tmo", "application/vnd.tmobile-livetv"],
		["torrent", "application/x-bittorrent"],
		["tpl", "application/vnd.groove-tool-template"],
		["tpt", "application/vnd.trid.tpt"],
		["tr", "application/x-troff"],
		["tra", "application/vnd.trueapp"],
		["trm", "application/x-msterminal"],
		["tsd", "application/timestamped-data"],
		["tsi", "audio/tsp-audio"],
		["tsp", ["application/dsptype", "audio/tsplayer"]],
		["tsv", "text/tab-separated-values"],
		["ttf", "application/x-font-ttf"],
		["ttl", "text/turtle"],
		["turbot", "image/florian"],
		["twd", "application/vnd.simtech-mindmapper"],
		["txd", "application/vnd.genomatix.tuxedo"],
		["txf", "application/vnd.mobius.txf"],
		["txt", "text/plain"],
		["ufd", "application/vnd.ufdl"],
		["uil", "text/x-uil"],
		["uls", "text/iuls"],
		["umj", "application/vnd.umajin"],
		["uni", "text/uri-list"],
		["unis", "text/uri-list"],
		["unityweb", "application/vnd.unity"],
		["unv", "application/i-deas"],
		["uoml", "application/vnd.uoml+xml"],
		["uri", "text/uri-list"],
		["uris", "text/uri-list"],
		["ustar", ["application/x-ustar", "multipart/x-ustar"]],
		["utz", "application/vnd.uiq.theme"],
		["uu", ["application/octet-stream", "text/x-uuencode"]],
		["uue", "text/x-uuencode"],
		["uva", "audio/vnd.dece.audio"],
		["uvh", "video/vnd.dece.hd"],
		["uvi", "image/vnd.dece.graphic"],
		["uvm", "video/vnd.dece.mobile"],
		["uvp", "video/vnd.dece.pd"],
		["uvs", "video/vnd.dece.sd"],
		["uvu", "video/vnd.uvvu.mp4"],
		["uvv", "video/vnd.dece.video"],
		["vcd", "application/x-cdlink"],
		["vcf", "text/x-vcard"],
		["vcg", "application/vnd.groove-vcard"],
		["vcs", "text/x-vcalendar"],
		["vcx", "application/vnd.vcx"],
		["vda", "application/vda"],
		["vdo", "video/vdo"],
		["vew", "application/groupwise"],
		["vis", "application/vnd.visionary"],
		["viv", ["video/vivo", "video/vnd.vivo"]],
		["vivo", ["video/vivo", "video/vnd.vivo"]],
		["vmd", "application/vocaltec-media-desc"],
		["vmf", "application/vocaltec-media-file"],
		["voc", ["audio/voc", "audio/x-voc"]],
		["vos", "video/vosaic"],
		["vox", "audio/voxware"],
		["vqe", "audio/x-twinvq-plugin"],
		["vqf", "audio/x-twinvq"],
		["vql", "audio/x-twinvq-plugin"],
		["vrml", [
			"model/vrml",
			"x-world/x-vrml",
			"application/x-vrml"
		]],
		["vrt", "x-world/x-vrt"],
		["vsd", ["application/vnd.visio", "application/x-visio"]],
		["vsf", "application/vnd.vsf"],
		["vst", "application/x-visio"],
		["vsw", "application/x-visio"],
		["vtu", "model/vnd.vtu"],
		["vxml", "application/voicexml+xml"],
		["w60", "application/wordperfect6.0"],
		["w61", "application/wordperfect6.1"],
		["w6w", "application/msword"],
		["wad", "application/x-doom"],
		["wav", ["audio/wav", "audio/x-wav"]],
		["wax", "audio/x-ms-wax"],
		["wb1", "application/x-qpro"],
		["wbmp", "image/vnd.wap.wbmp"],
		["wbs", "application/vnd.criticaltools.wbs+xml"],
		["wbxml", "application/vnd.wap.wbxml"],
		["wcm", "application/vnd.ms-works"],
		["wdb", "application/vnd.ms-works"],
		["web", "application/vnd.xara"],
		["weba", "audio/webm"],
		["webm", "video/webm"],
		["webp", "image/webp"],
		["wg", "application/vnd.pmi.widget"],
		["wgt", "application/widget"],
		["wiz", "application/msword"],
		["wk1", "application/x-123"],
		["wks", "application/vnd.ms-works"],
		["wm", "video/x-ms-wm"],
		["wma", "audio/x-ms-wma"],
		["wmd", "application/x-ms-wmd"],
		["wmf", ["windows/metafile", "application/x-msmetafile"]],
		["wml", "text/vnd.wap.wml"],
		["wmlc", "application/vnd.wap.wmlc"],
		["wmls", "text/vnd.wap.wmlscript"],
		["wmlsc", "application/vnd.wap.wmlscriptc"],
		["wmv", "video/x-ms-wmv"],
		["wmx", "video/x-ms-wmx"],
		["wmz", "application/x-ms-wmz"],
		["woff", "application/x-font-woff"],
		["word", "application/msword"],
		["wp", "application/wordperfect"],
		["wp5", ["application/wordperfect", "application/wordperfect6.0"]],
		["wp6", "application/wordperfect"],
		["wpd", [
			"application/wordperfect",
			"application/vnd.wordperfect",
			"application/x-wpwin"
		]],
		["wpl", "application/vnd.ms-wpl"],
		["wps", "application/vnd.ms-works"],
		["wq1", "application/x-lotus"],
		["wqd", "application/vnd.wqd"],
		["wri", [
			"application/mswrite",
			"application/x-wri",
			"application/x-mswrite"
		]],
		["wrl", [
			"model/vrml",
			"x-world/x-vrml",
			"application/x-world"
		]],
		["wrz", ["model/vrml", "x-world/x-vrml"]],
		["wsc", "text/scriplet"],
		["wsdl", "application/wsdl+xml"],
		["wspolicy", "application/wspolicy+xml"],
		["wsrc", "application/x-wais-source"],
		["wtb", "application/vnd.webturbo"],
		["wtk", "application/x-wintalk"],
		["wvx", "video/x-ms-wvx"],
		["x-png", "image/png"],
		["x3d", "application/vnd.hzn-3d-crossword"],
		["xaf", "x-world/x-vrml"],
		["xap", "application/x-silverlight-app"],
		["xar", "application/vnd.xara"],
		["xbap", "application/x-ms-xbap"],
		["xbd", "application/vnd.fujixerox.docuworks.binder"],
		["xbm", [
			"image/xbm",
			"image/x-xbm",
			"image/x-xbitmap"
		]],
		["xdf", "application/xcap-diff+xml"],
		["xdm", "application/vnd.syncml.dm+xml"],
		["xdp", "application/vnd.adobe.xdp+xml"],
		["xdr", "video/x-amt-demorun"],
		["xdssc", "application/dssc+xml"],
		["xdw", "application/vnd.fujixerox.docuworks"],
		["xenc", "application/xenc+xml"],
		["xer", "application/patch-ops-error+xml"],
		["xfdf", "application/vnd.adobe.xfdf"],
		["xfdl", "application/vnd.xfdl"],
		["xgz", "xgl/drawing"],
		["xhtml", "application/xhtml+xml"],
		["xif", "image/vnd.xiff"],
		["xl", "application/excel"],
		["xla", [
			"application/vnd.ms-excel",
			"application/excel",
			"application/x-msexcel",
			"application/x-excel"
		]],
		["xlam", "application/vnd.ms-excel.addin.macroenabled.12"],
		["xlb", [
			"application/excel",
			"application/vnd.ms-excel",
			"application/x-excel"
		]],
		["xlc", [
			"application/vnd.ms-excel",
			"application/excel",
			"application/x-excel"
		]],
		["xld", ["application/excel", "application/x-excel"]],
		["xlk", ["application/excel", "application/x-excel"]],
		["xll", [
			"application/excel",
			"application/vnd.ms-excel",
			"application/x-excel"
		]],
		["xlm", [
			"application/vnd.ms-excel",
			"application/excel",
			"application/x-excel"
		]],
		["xls", [
			"application/vnd.ms-excel",
			"application/excel",
			"application/x-msexcel",
			"application/x-excel"
		]],
		["xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
		["xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
		["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
		["xlt", [
			"application/vnd.ms-excel",
			"application/excel",
			"application/x-excel"
		]],
		["xltm", "application/vnd.ms-excel.template.macroenabled.12"],
		["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
		["xlv", ["application/excel", "application/x-excel"]],
		["xlw", [
			"application/vnd.ms-excel",
			"application/excel",
			"application/x-msexcel",
			"application/x-excel"
		]],
		["xm", "audio/xm"],
		["xml", [
			"application/xml",
			"text/xml",
			"application/atom+xml",
			"application/rss+xml"
		]],
		["xmz", "xgl/movie"],
		["xo", "application/vnd.olpc-sugar"],
		["xof", "x-world/x-vrml"],
		["xop", "application/xop+xml"],
		["xpi", "application/x-xpinstall"],
		["xpix", "application/x-vnd.ls-xpix"],
		["xpm", ["image/xpm", "image/x-xpixmap"]],
		["xpr", "application/vnd.is-xpr"],
		["xps", "application/vnd.ms-xpsdocument"],
		["xpw", "application/vnd.intercon.formnet"],
		["xslt", "application/xslt+xml"],
		["xsm", "application/vnd.syncml+xml"],
		["xspf", "application/xspf+xml"],
		["xsr", "video/x-amt-showrun"],
		["xul", "application/vnd.mozilla.xul+xml"],
		["xwd", ["image/x-xwd", "image/x-xwindowdump"]],
		["xyz", ["chemical/x-xyz", "chemical/x-pdb"]],
		["yang", "application/yang"],
		["yin", "application/yin+xml"],
		["z", ["application/x-compressed", "application/x-compress"]],
		["zaz", "application/vnd.zzazz.deck+xml"],
		["zip", [
			"application/zip",
			"multipart/x-zip",
			"application/x-zip-compressed",
			"application/x-compressed"
		]],
		["zir", "application/vnd.zul"],
		["zmm", "application/vnd.handheld-entertainment+xml"],
		["zoo", "application/octet-stream"],
		["zsh", "text/x-script.zsh"]
	]);
	module.exports = {
		detectMimeType(filename) {
			if (!filename) return defaultMimeType;
			let parsed = path$1.parse(filename);
			let extension = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase();
			let value = defaultMimeType;
			if (extensions.has(extension)) value = extensions.get(extension);
			if (Array.isArray(value)) return value[0];
			return value;
		},
		detectExtension(mimeType) {
			if (!mimeType) return defaultExtension;
			let parts = (mimeType || "").toLowerCase().trim().split("/");
			let rootType = parts.shift().trim();
			let subType = parts.join("/").trim();
			if (mimeTypes$2.has(rootType + "/" + subType)) {
				let value = mimeTypes$2.get(rootType + "/" + subType);
				if (Array.isArray(value)) return value[0];
				return value;
			}
			switch (rootType) {
				case "text": return "txt";
				default: return "bin";
			}
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/punycode/index.js
var require_punycode = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/** Highest positive signed 32-bit float value */
	const maxInt = 2147483647;
	/** Bootstring parameters */
	const base = 36;
	const tMin = 1;
	const tMax = 26;
	const skew = 38;
	const damp = 700;
	const initialBias = 72;
	const initialN = 128;
	const delimiter = "-";
	/** Regular expressions */
	const regexPunycode = /^xn--/;
	const regexNonASCII = /[^\0-\x7F]/;
	const regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
	/** Error messages */
	const errors = {
		overflow: "Overflow: input needs wider integers to process",
		"not-basic": "Illegal input >= 0x80 (not a basic code point)",
		"invalid-input": "Invalid input"
	};
	/** Convenience shortcuts */
	const baseMinusTMin = base - tMin;
	const floor = Math.floor;
	const stringFromCharCode = String.fromCharCode;
	/**
	* A generic error utility function.
	* @private
	* @param {String} type The error type.
	* @returns {Error} Throws a `RangeError` with the applicable error message.
	*/
	function error(type) {
		throw new RangeError(errors[type]);
	}
	/**
	* A generic `Array#map` utility function.
	* @private
	* @param {Array} array The array to iterate over.
	* @param {Function} callback The function that gets called for every array
	* item.
	* @returns {Array} A new array of values returned by the callback function.
	*/
	function map(array$2, callback) {
		const result = [];
		let length = array$2.length;
		while (length--) result[length] = callback(array$2[length]);
		return result;
	}
	/**
	* A simple `Array#map`-like wrapper to work with domain name strings or email
	* addresses.
	* @private
	* @param {String} domain The domain name or email address.
	* @param {Function} callback The function that gets called for every
	* character.
	* @returns {String} A new string of characters returned by the callback
	* function.
	*/
	function mapDomain(domain, callback) {
		const parts = domain.split("@");
		let result = "";
		if (parts.length > 1) {
			result = parts[0] + "@";
			domain = parts[1];
		}
		domain = domain.replace(regexSeparators, ".");
		const encoded = map(domain.split("."), callback).join(".");
		return result + encoded;
	}
	/**
	* Creates an array containing the numeric code points of each Unicode
	* character in the string. While JavaScript uses UCS-2 internally,
	* this function will convert a pair of surrogate halves (each of which
	* UCS-2 exposes as separate characters) into a single code point,
	* matching UTF-16.
	* @see `punycode.ucs2.encode`
	* @see <https://mathiasbynens.be/notes/javascript-encoding>
	* @memberOf punycode.ucs2
	* @name decode
	* @param {String} string The Unicode input string (UCS-2).
	* @returns {Array} The new array of code points.
	*/
	function ucs2decode(string) {
		const output = [];
		let counter = 0;
		const length = string.length;
		while (counter < length) {
			const value = string.charCodeAt(counter++);
			if (value >= 55296 && value <= 56319 && counter < length) {
				const extra = string.charCodeAt(counter++);
				if ((extra & 64512) == 56320) output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
				else {
					output.push(value);
					counter--;
				}
			} else output.push(value);
		}
		return output;
	}
	/**
	* Creates a string based on an array of numeric code points.
	* @see `punycode.ucs2.decode`
	* @memberOf punycode.ucs2
	* @name encode
	* @param {Array} codePoints The array of numeric code points.
	* @returns {String} The new Unicode string (UCS-2).
	*/
	const ucs2encode = (codePoints) => String.fromCodePoint(...codePoints);
	/**
	* Converts a basic code point into a digit/integer.
	* @see `digitToBasic()`
	* @private
	* @param {Number} codePoint The basic numeric code point value.
	* @returns {Number} The numeric value of a basic code point (for use in
	* representing integers) in the range `0` to `base - 1`, or `base` if
	* the code point does not represent a value.
	*/
	const basicToDigit = function(codePoint) {
		if (codePoint >= 48 && codePoint < 58) return 26 + (codePoint - 48);
		if (codePoint >= 65 && codePoint < 91) return codePoint - 65;
		if (codePoint >= 97 && codePoint < 123) return codePoint - 97;
		return base;
	};
	/**
	* Converts a digit/integer into a basic code point.
	* @see `basicToDigit()`
	* @private
	* @param {Number} digit The numeric value of a basic code point.
	* @returns {Number} The basic code point whose value (when used for
	* representing integers) is `digit`, which needs to be in the range
	* `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	* used; else, the lowercase form is used. The behavior is undefined
	* if `flag` is non-zero and `digit` has no uppercase form.
	*/
	const digitToBasic = function(digit, flag) {
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	};
	/**
	* Bias adaptation function as per section 3.4 of RFC 3492.
	* https://tools.ietf.org/html/rfc3492#section-3.4
	* @private
	*/
	const adapt = function(delta, numPoints, firstTime) {
		let k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (; delta > baseMinusTMin * tMax >> 1; k += base) delta = floor(delta / baseMinusTMin);
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	};
	/**
	* Converts a Punycode string of ASCII-only symbols to a string of Unicode
	* symbols.
	* @memberOf punycode
	* @param {String} input The Punycode string of ASCII-only symbols.
	* @returns {String} The resulting string of Unicode symbols.
	*/
	const decode = function(input) {
		const output = [];
		const inputLength = input.length;
		let i = 0;
		let n = initialN;
		let bias = initialBias;
		let basic = input.lastIndexOf(delimiter);
		if (basic < 0) basic = 0;
		for (let j = 0; j < basic; ++j) {
			if (input.charCodeAt(j) >= 128) error("not-basic");
			output.push(input.charCodeAt(j));
		}
		for (let index$1 = basic > 0 ? basic + 1 : 0; index$1 < inputLength;) {
			const oldi = i;
			for (let w = 1, k = base;; k += base) {
				if (index$1 >= inputLength) error("invalid-input");
				const digit = basicToDigit(input.charCodeAt(index$1++));
				if (digit >= base) error("invalid-input");
				if (digit > floor((maxInt - i) / w)) error("overflow");
				i += digit * w;
				const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
				if (digit < t) break;
				const baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) error("overflow");
				w *= baseMinusT;
			}
			const out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);
			if (floor(i / out) > maxInt - n) error("overflow");
			n += floor(i / out);
			i %= out;
			output.splice(i++, 0, n);
		}
		return String.fromCodePoint(...output);
	};
	/**
	* Converts a string of Unicode symbols (e.g. a domain name label) to a
	* Punycode string of ASCII-only symbols.
	* @memberOf punycode
	* @param {String} input The string of Unicode symbols.
	* @returns {String} The resulting Punycode string of ASCII-only symbols.
	*/
	const encode$2 = function(input) {
		const output = [];
		input = ucs2decode(input);
		const inputLength = input.length;
		let n = initialN;
		let delta = 0;
		let bias = initialBias;
		for (const currentValue of input) if (currentValue < 128) output.push(stringFromCharCode(currentValue));
		const basicLength = output.length;
		let handledCPCount = basicLength;
		if (basicLength) output.push(delimiter);
		while (handledCPCount < inputLength) {
			let m = maxInt;
			for (const currentValue of input) if (currentValue >= n && currentValue < m) m = currentValue;
			const handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) error("overflow");
			delta += (m - n) * handledCPCountPlusOne;
			n = m;
			for (const currentValue of input) {
				if (currentValue < n && ++delta > maxInt) error("overflow");
				if (currentValue === n) {
					let q = delta;
					for (let k = base;; k += base) {
						const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
						if (q < t) break;
						const qMinusT = q - t;
						const baseMinusT = base - t;
						output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
						q = floor(qMinusT / baseMinusT);
					}
					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
					delta = 0;
					++handledCPCount;
				}
			}
			++delta;
			++n;
		}
		return output.join("");
	};
	/**
	* Converts a Punycode string representing a domain name or an email address
	* to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	* it doesn't matter if you call it on a string that has already been
	* converted to Unicode.
	* @memberOf punycode
	* @param {String} input The Punycoded domain name or email address to
	* convert to Unicode.
	* @returns {String} The Unicode representation of the given Punycode
	* string.
	*/
	const toUnicode = function(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
		});
	};
	/**
	* Converts a Unicode string representing a domain name or an email address to
	* Punycode. Only the non-ASCII parts of the domain name will be converted,
	* i.e. it doesn't matter if you call it with a domain that's already in
	* ASCII.
	* @memberOf punycode
	* @param {String} input The domain name or email address to convert, as a
	* Unicode string.
	* @returns {String} The Punycode representation of the given domain name or
	* email address.
	*/
	const toASCII = function(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string) ? "xn--" + encode$2(string) : string;
		});
	};
	/** Define the public API */
	const punycode$2 = {
		version: "2.3.1",
		ucs2: {
			decode: ucs2decode,
			encode: ucs2encode
		},
		decode,
		encode: encode$2,
		toASCII,
		toUnicode
	};
	module.exports = punycode$2;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/base64/index.js
var require_base64 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$7 = __require("stream").Transform;
	/**
	* Encodes a Buffer into a base64 encoded string
	*
	* @param {Buffer} buffer Buffer to convert
	* @returns {String} base64 encoded string
	*/
	function encode$1(buffer) {
		if (typeof buffer === "string") buffer = Buffer.from(buffer, "utf-8");
		return buffer.toString("base64");
	}
	/**
	* Adds soft line breaks to a base64 string
	*
	* @param {String} str base64 encoded string that might need line wrapping
	* @param {Number} [lineLength=76] Maximum allowed length for a line
	* @returns {String} Soft-wrapped base64 encoded string
	*/
	function wrap$1(str, lineLength) {
		str = (str || "").toString();
		lineLength = lineLength || 76;
		if (str.length <= lineLength) return str;
		let result = [];
		let pos = 0;
		let chunkLength = lineLength * 1024;
		while (pos < str.length) {
			let wrappedLines = str.substr(pos, chunkLength).replace(new RegExp(".{" + lineLength + "}", "g"), "$&\r\n");
			result.push(wrappedLines);
			pos += chunkLength;
		}
		return result.join("");
	}
	/**
	* Creates a transform stream for encoding data to base64 encoding
	*
	* @constructor
	* @param {Object} options Stream options
	* @param {Number} [options.lineLength=76] Maximum length for lines, set to false to disable wrapping
	*/
	var Encoder$1 = class extends Transform$7 {
		constructor(options) {
			super();
			this.options = options || {};
			if (this.options.lineLength !== false) this.options.lineLength = this.options.lineLength || 76;
			this._curLine = "";
			this._remainingBytes = false;
			this.inputBytes = 0;
			this.outputBytes = 0;
		}
		_transform(chunk, encoding, done) {
			if (encoding !== "buffer") chunk = Buffer.from(chunk, encoding);
			if (!chunk || !chunk.length) return setImmediate(done);
			this.inputBytes += chunk.length;
			if (this._remainingBytes && this._remainingBytes.length) {
				chunk = Buffer.concat([this._remainingBytes, chunk], this._remainingBytes.length + chunk.length);
				this._remainingBytes = false;
			}
			if (chunk.length % 3) {
				this._remainingBytes = chunk.slice(chunk.length - chunk.length % 3);
				chunk = chunk.slice(0, chunk.length - chunk.length % 3);
			} else this._remainingBytes = false;
			let b64 = this._curLine + encode$1(chunk);
			if (this.options.lineLength) {
				b64 = wrap$1(b64, this.options.lineLength);
				let lastLF = b64.lastIndexOf("\n");
				if (lastLF < 0) {
					this._curLine = b64;
					b64 = "";
				} else {
					this._curLine = b64.substring(lastLF + 1);
					b64 = b64.substring(0, lastLF + 1);
					if (b64 && !b64.endsWith("\r\n")) b64 += "\r\n";
				}
			} else this._curLine = "";
			if (b64) {
				this.outputBytes += b64.length;
				this.push(Buffer.from(b64, "ascii"));
			}
			setImmediate(done);
		}
		_flush(done) {
			if (this._remainingBytes && this._remainingBytes.length) this._curLine += encode$1(this._remainingBytes);
			if (this._curLine) {
				this.outputBytes += this._curLine.length;
				this.push(Buffer.from(this._curLine, "ascii"));
				this._curLine = "";
			}
			done();
		}
	};
	module.exports = {
		encode: encode$1,
		wrap: wrap$1,
		Encoder: Encoder$1
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/qp/index.js
var require_qp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$6 = __require("stream").Transform;
	/**
	* Encodes a Buffer into a Quoted-Printable encoded string
	*
	* @param {Buffer} buffer Buffer to convert
	* @returns {String} Quoted-Printable encoded string
	*/
	function encode(buffer) {
		if (typeof buffer === "string") buffer = Buffer.from(buffer, "utf-8");
		let ranges = [
			[9],
			[10],
			[13],
			[32, 60],
			[62, 126]
		];
		let result = "";
		let ord;
		for (let i = 0, len = buffer.length; i < len; i++) {
			ord = buffer[i];
			if (checkRanges(ord, ranges) && !((ord === 32 || ord === 9) && (i === len - 1 || buffer[i + 1] === 10 || buffer[i + 1] === 13))) {
				result += String.fromCharCode(ord);
				continue;
			}
			result += "=" + (ord < 16 ? "0" : "") + ord.toString(16).toUpperCase();
		}
		return result;
	}
	/**
	* Adds soft line breaks to a Quoted-Printable string
	*
	* @param {String} str Quoted-Printable encoded string that might need line wrapping
	* @param {Number} [lineLength=76] Maximum allowed length for a line
	* @returns {String} Soft-wrapped Quoted-Printable encoded string
	*/
	function wrap(str, lineLength) {
		str = (str || "").toString();
		lineLength = lineLength || 76;
		if (str.length <= lineLength) return str;
		let pos = 0;
		let len = str.length;
		let match, code, line;
		let lineMargin = Math.floor(lineLength / 3);
		let result = "";
		while (pos < len) {
			line = str.substr(pos, lineLength);
			if (match = line.match(/\r\n/)) {
				line = line.substr(0, match.index + match[0].length);
				result += line;
				pos += line.length;
				continue;
			}
			if (line.substr(-1) === "\n") {
				result += line;
				pos += line.length;
				continue;
			} else if (match = line.substr(-lineMargin).match(/\n.*?$/)) {
				line = line.substr(0, line.length - (match[0].length - 1));
				result += line;
				pos += line.length;
				continue;
			} else if (line.length > lineLength - lineMargin && (match = line.substr(-lineMargin).match(/[ \t.,!?][^ \t.,!?]*$/))) line = line.substr(0, line.length - (match[0].length - 1));
			else if (line.match(/[=][\da-f]{0,2}$/i)) {
				if (match = line.match(/[=][\da-f]{0,1}$/i)) line = line.substr(0, line.length - match[0].length);
				while (line.length > 3 && line.length < len - pos && !line.match(/^(?:=[\da-f]{2}){1,4}$/i) && (match = line.match(/[=][\da-f]{2}$/gi))) {
					code = parseInt(match[0].substr(1, 2), 16);
					if (code < 128) break;
					line = line.substr(0, line.length - 3);
					if (code >= 192) break;
				}
			}
			if (pos + line.length < len && line.substr(-1) !== "\n") {
				if (line.length === lineLength && line.match(/[=][\da-f]{2}$/i)) line = line.substr(0, line.length - 3);
				else if (line.length === lineLength) line = line.substr(0, line.length - 1);
				pos += line.length;
				line += "=\r\n";
			} else pos += line.length;
			result += line;
		}
		return result;
	}
	/**
	* Helper function to check if a number is inside provided ranges
	*
	* @param {Number} nr Number to check for
	* @param {Array} ranges An Array of allowed values
	* @returns {Boolean} True if the value was found inside allowed ranges, false otherwise
	*/
	function checkRanges(nr, ranges) {
		for (let i = ranges.length - 1; i >= 0; i--) {
			if (!ranges[i].length) continue;
			if (ranges[i].length === 1 && nr === ranges[i][0]) return true;
			if (ranges[i].length === 2 && nr >= ranges[i][0] && nr <= ranges[i][1]) return true;
		}
		return false;
	}
	/**
	* Creates a transform stream for encoding data to Quoted-Printable encoding
	*
	* @constructor
	* @param {Object} options Stream options
	* @param {Number} [options.lineLength=76] Maximum length for lines, set to false to disable wrapping
	*/
	var Encoder = class extends Transform$6 {
		constructor(options) {
			super();
			this.options = options || {};
			if (this.options.lineLength !== false) this.options.lineLength = this.options.lineLength || 76;
			this._curLine = "";
			this.inputBytes = 0;
			this.outputBytes = 0;
		}
		_transform(chunk, encoding, done) {
			let qp$2;
			if (encoding !== "buffer") chunk = Buffer.from(chunk, encoding);
			if (!chunk || !chunk.length) return done();
			this.inputBytes += chunk.length;
			if (this.options.lineLength) {
				qp$2 = this._curLine + encode(chunk);
				qp$2 = wrap(qp$2, this.options.lineLength);
				qp$2 = qp$2.replace(/(^|\n)([^\n]*)$/, (match, lineBreak, lastLine) => {
					this._curLine = lastLine;
					return lineBreak;
				});
				if (qp$2) {
					this.outputBytes += qp$2.length;
					this.push(qp$2);
				}
			} else {
				qp$2 = encode(chunk);
				this.outputBytes += qp$2.length;
				this.push(qp$2, "ascii");
			}
			done();
		}
		_flush(done) {
			if (this._curLine) {
				this.outputBytes += this._curLine.length;
				this.push(this._curLine, "ascii");
			}
			done();
		}
	};
	module.exports = {
		encode,
		wrap,
		Encoder
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mime-funcs/index.js
var require_mime_funcs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const base64$1 = require_base64();
	const qp$1 = require_qp();
	const mimeTypes$1 = require_mime_types();
	module.exports = {
		isPlainText(value, isParam) {
			if (typeof value !== "string" || (isParam ? /[\x00-\x08\x0b\x0c\x0e-\x1f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/).test(value)) return false;
			else return true;
		},
		hasLongerLines(str, lineLength) {
			if (str.length > 128 * 1024) return true;
			return new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
		},
		encodeWord(data, mimeWordEncoding, maxLength) {
			mimeWordEncoding = (mimeWordEncoding || "Q").toString().toUpperCase().trim().charAt(0);
			maxLength = maxLength || 0;
			let encodedStr;
			let toCharset = "UTF-8";
			if (maxLength && maxLength > 12) maxLength -= 12;
			if (mimeWordEncoding === "Q") encodedStr = qp$1.encode(data).replace(/[^a-z0-9!*+\-/=]/gi, (chr) => {
				let ord = chr.charCodeAt(0).toString(16).toUpperCase();
				if (chr === " ") return "_";
				else return "=" + (ord.length === 1 ? "0" + ord : ord);
			});
			else if (mimeWordEncoding === "B") {
				encodedStr = typeof data === "string" ? data : base64$1.encode(data);
				maxLength = maxLength ? Math.max(3, (maxLength - maxLength % 4) / 4 * 3) : 0;
			}
			if (maxLength && (mimeWordEncoding !== "B" ? encodedStr : base64$1.encode(data)).length > maxLength) if (mimeWordEncoding === "Q") encodedStr = this.splitMimeEncodedString(encodedStr, maxLength).join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
			else {
				let parts = [];
				let lpart = "";
				for (let i = 0, len = encodedStr.length; i < len; i++) {
					let chr = encodedStr.charAt(i);
					if (/[\ud83c\ud83d\ud83e]/.test(chr) && i < len - 1) chr += encodedStr.charAt(++i);
					if (Buffer.byteLength(lpart + chr) <= maxLength || i === 0) lpart += chr;
					else {
						parts.push(base64$1.encode(lpart));
						lpart = chr;
					}
				}
				if (lpart) parts.push(base64$1.encode(lpart));
				if (parts.length > 1) encodedStr = parts.join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
				else encodedStr = parts.join("");
			}
			else if (mimeWordEncoding === "B") encodedStr = base64$1.encode(data);
			return "=?" + toCharset + "?" + mimeWordEncoding + "?" + encodedStr + (encodedStr.substr(-2) === "?=" ? "" : "?=");
		},
		encodeWords(value, mimeWordEncoding, maxLength, encodeAll) {
			maxLength = maxLength || 0;
			let encodedValue;
			let firstMatch = value.match(/(?:^|\s)([^\s]*["\u0080-\uFFFF])/);
			if (!firstMatch) return value;
			if (encodeAll) return this.encodeWord(value, mimeWordEncoding, maxLength);
			let lastMatch = value.match(/(["\u0080-\uFFFF][^\s]*)[^"\u0080-\uFFFF]*$/);
			if (!lastMatch) return value;
			let startIndex = firstMatch.index + (firstMatch[0].match(/[^\s]/) || { index: 0 }).index;
			let endIndex = lastMatch.index + (lastMatch[1] || "").length;
			encodedValue = (startIndex ? value.substr(0, startIndex) : "") + this.encodeWord(value.substring(startIndex, endIndex), mimeWordEncoding || "Q", maxLength) + (endIndex < value.length ? value.substr(endIndex) : "");
			return encodedValue;
		},
		buildHeaderValue(structured) {
			let paramsArray = [];
			Object.keys(structured.params || {}).forEach((param) => {
				let value = structured.params[param];
				if (!this.isPlainText(value, true) || value.length >= 75) this.buildHeaderParam(param, value, 50).forEach((encodedParam) => {
					if (!/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(encodedParam.value) || encodedParam.key.substr(-1) === "*") paramsArray.push(encodedParam.key + "=" + encodedParam.value);
					else paramsArray.push(encodedParam.key + "=" + JSON.stringify(encodedParam.value));
				});
				else if (/[\s'"\\;:/=(),<>@[\]?]|^-/.test(value)) paramsArray.push(param + "=" + JSON.stringify(value));
				else paramsArray.push(param + "=" + value);
			});
			return structured.value + (paramsArray.length ? "; " + paramsArray.join("; ") : "");
		},
		buildHeaderParam(key, data, maxLength) {
			let list = [];
			let encodedStr = typeof data === "string" ? data : (data || "").toString();
			let encodedStrArr;
			let chr, ord;
			let line;
			let startPos = 0;
			let i, len;
			maxLength = maxLength || 50;
			if (this.isPlainText(data, true)) {
				if (encodedStr.length <= maxLength) return [{
					key,
					value: encodedStr
				}];
				encodedStr = encodedStr.replace(new RegExp(".{" + maxLength + "}", "g"), (str) => {
					list.push({ line: str });
					return "";
				});
				if (encodedStr) list.push({ line: encodedStr });
			} else {
				if (/[\uD800-\uDBFF]/.test(encodedStr)) {
					encodedStrArr = [];
					for (i = 0, len = encodedStr.length; i < len; i++) {
						chr = encodedStr.charAt(i);
						ord = chr.charCodeAt(0);
						if (ord >= 55296 && ord <= 56319 && i < len - 1) {
							chr += encodedStr.charAt(i + 1);
							encodedStrArr.push(chr);
							i++;
						} else encodedStrArr.push(chr);
					}
					encodedStr = encodedStrArr;
				}
				line = "utf-8''";
				let encoded = true;
				startPos = 0;
				for (i = 0, len = encodedStr.length; i < len; i++) {
					chr = encodedStr[i];
					if (encoded) chr = this.safeEncodeURIComponent(chr);
					else {
						chr = chr === " " ? chr : this.safeEncodeURIComponent(chr);
						if (chr !== encodedStr[i]) if ((this.safeEncodeURIComponent(line) + chr).length >= maxLength) {
							list.push({
								line,
								encoded
							});
							line = "";
							startPos = i - 1;
						} else {
							encoded = true;
							i = startPos;
							line = "";
							continue;
						}
					}
					if ((line + chr).length >= maxLength) {
						list.push({
							line,
							encoded
						});
						line = chr = encodedStr[i] === " " ? " " : this.safeEncodeURIComponent(encodedStr[i]);
						if (chr === encodedStr[i]) {
							encoded = false;
							startPos = i - 1;
						} else encoded = true;
					} else line += chr;
				}
				if (line) list.push({
					line,
					encoded
				});
			}
			return list.map((item, i$1) => ({
				key: key + "*" + i$1 + (item.encoded ? "*" : ""),
				value: item.line
			}));
		},
		parseHeaderValue(str) {
			let response = {
				value: false,
				params: {}
			};
			let key = false;
			let value = "";
			let type = "value";
			let quote = false;
			let escaped = false;
			let chr;
			for (let i = 0, len = str.length; i < len; i++) {
				chr = str.charAt(i);
				if (type === "key") {
					if (chr === "=") {
						key = value.trim().toLowerCase();
						type = "value";
						value = "";
						continue;
					}
					value += chr;
				} else {
					if (escaped) value += chr;
					else if (chr === "\\") {
						escaped = true;
						continue;
					} else if (quote && chr === quote) quote = false;
					else if (!quote && chr === "\"") quote = chr;
					else if (!quote && chr === ";") {
						if (key === false) response.value = value.trim();
						else response.params[key] = value.trim();
						type = "key";
						value = "";
					} else value += chr;
					escaped = false;
				}
			}
			if (type === "value") if (key === false) response.value = value.trim();
			else response.params[key] = value.trim();
			else if (value.trim()) response.params[value.trim().toLowerCase()] = "";
			Object.keys(response.params).forEach((key$1) => {
				let actualKey, nr, match, value$1;
				if (match = key$1.match(/(\*(\d+)|\*(\d+)\*|\*)$/)) {
					actualKey = key$1.substr(0, match.index);
					nr = Number(match[2] || match[3]) || 0;
					if (!response.params[actualKey] || typeof response.params[actualKey] !== "object") response.params[actualKey] = {
						charset: false,
						values: []
					};
					value$1 = response.params[key$1];
					if (nr === 0 && match[0].substr(-1) === "*" && (match = value$1.match(/^([^']*)'[^']*'(.*)$/))) {
						response.params[actualKey].charset = match[1] || "iso-8859-1";
						value$1 = match[2];
					}
					response.params[actualKey].values[nr] = value$1;
					delete response.params[key$1];
				}
			});
			Object.keys(response.params).forEach((key$1) => {
				let value$1;
				if (response.params[key$1] && Array.isArray(response.params[key$1].values)) {
					value$1 = response.params[key$1].values.map((val$1) => val$1 || "").join("");
					if (response.params[key$1].charset) response.params[key$1] = "=?" + response.params[key$1].charset + "?Q?" + value$1.replace(/[=?_\s]/g, (s) => {
						let c = s.charCodeAt(0).toString(16);
						if (s === " ") return "_";
						else return "%" + (c.length < 2 ? "0" : "") + c;
					}).replace(/%/g, "=") + "?=";
					else response.params[key$1] = value$1;
				}
			});
			return response;
		},
		detectExtension: (mimeType) => mimeTypes$1.detectExtension(mimeType),
		detectMimeType: (extension) => mimeTypes$1.detectMimeType(extension),
		foldLines(str, lineLength, afterSpace) {
			str = (str || "").toString();
			lineLength = lineLength || 76;
			let pos = 0, len = str.length, result = "", line, match;
			while (pos < len) {
				line = str.substr(pos, lineLength);
				if (line.length < lineLength) {
					result += line;
					break;
				}
				if (match = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
					line = match[0];
					result += line;
					pos += line.length;
					continue;
				} else if ((match = line.match(/(\s+)[^\s]*$/)) && match[0].length - (afterSpace ? (match[1] || "").length : 0) < line.length) line = line.substr(0, line.length - (match[0].length - (afterSpace ? (match[1] || "").length : 0)));
				else if (match = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) line = line + match[0].substr(0, match[0].length - (!afterSpace ? (match[1] || "").length : 0));
				result += line;
				pos += line.length;
				if (pos < len) result += "\r\n";
			}
			return result;
		},
		splitMimeEncodedString: (str, maxlen) => {
			let curLine, match, chr, done, lines = [];
			maxlen = Math.max(maxlen || 0, 12);
			while (str.length) {
				curLine = str.substr(0, maxlen);
				if (match = curLine.match(/[=][0-9A-F]?$/i)) curLine = curLine.substr(0, match.index);
				done = false;
				while (!done) {
					done = true;
					if (match = str.substr(curLine.length).match(/^[=]([0-9A-F]{2})/i)) {
						chr = parseInt(match[1], 16);
						if (chr < 194 && chr > 127) {
							curLine = curLine.substr(0, curLine.length - 3);
							done = false;
						}
					}
				}
				if (curLine.length) lines.push(curLine);
				str = str.substr(curLine.length);
			}
			return lines;
		},
		encodeURICharComponent: (chr) => {
			let res = "";
			let ord = chr.charCodeAt(0).toString(16).toUpperCase();
			if (ord.length % 2) ord = "0" + ord;
			if (ord.length > 2) for (let i = 0, len = ord.length / 2; i < len; i++) res += "%" + ord.substr(i, 2);
			else res += "%" + ord;
			return res;
		},
		safeEncodeURIComponent(str) {
			str = (str || "").toString();
			try {
				str = encodeURIComponent(str);
			} catch (_E) {
				return str.replace(/[^\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]+/g, "");
			}
			return str.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (chr) => this.encodeURICharComponent(chr));
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/addressparser/index.js
var require_addressparser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Converts tokens for a single address into an address object
	*
	* @param {Array} tokens Tokens object
	* @param {Number} depth Current recursion depth for nested group protection
	* @return {Object} Address object
	*/
	function _handleAddress(tokens, depth) {
		let isGroup = false;
		let state = "text";
		let address;
		let addresses = [];
		let data = {
			address: [],
			comment: [],
			group: [],
			text: [],
			textWasQuoted: []
		};
		let i;
		let len;
		let insideQuotes = false;
		for (i = 0, len = tokens.length; i < len; i++) {
			let token = tokens[i];
			let prevToken = i ? tokens[i - 1] : null;
			if (token.type === "operator") switch (token.value) {
				case "<":
					state = "address";
					insideQuotes = false;
					break;
				case "(":
					state = "comment";
					insideQuotes = false;
					break;
				case ":":
					state = "group";
					isGroup = true;
					insideQuotes = false;
					break;
				case "\"":
					insideQuotes = !insideQuotes;
					state = "text";
					break;
				default:
					state = "text";
					insideQuotes = false;
					break;
			}
			else if (token.value) {
				if (state === "address") token.value = token.value.replace(/^[^<]*<\s*/, "");
				if (prevToken && prevToken.noBreak && data[state].length) {
					data[state][data[state].length - 1] += token.value;
					if (state === "text" && insideQuotes) data.textWasQuoted[data.textWasQuoted.length - 1] = true;
				} else {
					data[state].push(token.value);
					if (state === "text") data.textWasQuoted.push(insideQuotes);
				}
			}
		}
		if (!data.text.length && data.comment.length) {
			data.text = data.comment;
			data.comment = [];
		}
		if (isGroup) {
			data.text = data.text.join(" ");
			let groupMembers = [];
			if (data.group.length) addressparser$1(data.group.join(","), { _depth: depth + 1 }).forEach((member) => {
				if (member.group) groupMembers = groupMembers.concat(member.group);
				else groupMembers.push(member);
			});
			addresses.push({
				name: data.text || address && address.name,
				group: groupMembers
			});
		} else {
			if (!data.address.length && data.text.length) {
				for (i = data.text.length - 1; i >= 0; i--) if (!data.textWasQuoted[i] && data.text[i].match(/^[^@\s]+@[^@\s]+$/)) {
					data.address = data.text.splice(i, 1);
					data.textWasQuoted.splice(i, 1);
					break;
				}
				let _regexHandler = function(address$1) {
					if (!data.address.length) {
						data.address = [address$1.trim()];
						return " ";
					} else return address$1;
				};
				if (!data.address.length) {
					for (i = data.text.length - 1; i >= 0; i--) if (!data.textWasQuoted[i]) {
						data.text[i] = data.text[i].replace(/\s*\b[^@\s]+@[^\s]+\b\s*/, _regexHandler).trim();
						if (data.address.length) break;
					}
				}
			}
			if (!data.text.length && data.comment.length) {
				data.text = data.comment;
				data.comment = [];
			}
			if (data.address.length > 1) data.text = data.text.concat(data.address.splice(1));
			data.text = data.text.join(" ");
			data.address = data.address.join(" ");
			if (!data.address && isGroup) return [];
			else {
				address = {
					address: data.address || data.text || "",
					name: data.text || data.address || ""
				};
				if (address.address === address.name) if ((address.address || "").match(/@/)) address.name = "";
				else address.address = "";
				addresses.push(address);
			}
		}
		return addresses;
	}
	/**
	* Creates a Tokenizer object for tokenizing address field strings
	*
	* @constructor
	* @param {String} str Address field string
	*/
	var Tokenizer = class {
		constructor(str) {
			this.str = (str || "").toString();
			this.operatorCurrent = "";
			this.operatorExpecting = "";
			this.node = null;
			this.escaped = false;
			this.list = [];
			/**
			* Operator tokens and which tokens are expected to end the sequence
			*/
			this.operators = {
				"\"": "\"",
				"(": ")",
				"<": ">",
				",": "",
				":": ";",
				";": ""
			};
		}
		/**
		* Tokenizes the original input string
		*
		* @return {Array} An array of operator|text tokens
		*/
		tokenize() {
			let list = [];
			for (let i = 0, len = this.str.length; i < len; i++) {
				let chr = this.str.charAt(i);
				let nextChr = i < len - 1 ? this.str.charAt(i + 1) : null;
				this.checkChar(chr, nextChr);
			}
			this.list.forEach((node) => {
				node.value = (node.value || "").toString().trim();
				if (node.value) list.push(node);
			});
			return list;
		}
		/**
		* Checks if a character is an operator or text and acts accordingly
		*
		* @param {String} chr Character from the address field
		*/
		checkChar(chr, nextChr) {
			if (this.escaped) {} else if (chr === this.operatorExpecting) {
				this.node = {
					type: "operator",
					value: chr
				};
				if (nextChr && ![
					" ",
					"	",
					"\r",
					"\n",
					",",
					";"
				].includes(nextChr)) this.node.noBreak = true;
				this.list.push(this.node);
				this.node = null;
				this.operatorExpecting = "";
				this.escaped = false;
				return;
			} else if (!this.operatorExpecting && chr in this.operators) {
				this.node = {
					type: "operator",
					value: chr
				};
				this.list.push(this.node);
				this.node = null;
				this.operatorExpecting = this.operators[chr];
				this.escaped = false;
				return;
			} else if (["\"", "'"].includes(this.operatorExpecting) && chr === "\\") {
				this.escaped = true;
				return;
			}
			if (!this.node) {
				this.node = {
					type: "text",
					value: ""
				};
				this.list.push(this.node);
			}
			if (chr === "\n") chr = " ";
			if (chr.charCodeAt(0) >= 33 || [" ", "	"].includes(chr)) this.node.value += chr;
			this.escaped = false;
		}
	};
	/**
	* Maximum recursion depth for parsing nested groups.
	* RFC 5322 doesn't allow nested groups, so this is a safeguard against
	* malicious input that could cause stack overflow.
	*/
	const MAX_NESTED_GROUP_DEPTH = 50;
	/**
	* Parses structured e-mail addresses from an address field
	*
	* Example:
	*
	*    'Name <address@domain>'
	*
	* will be converted to
	*
	*     [{name: 'Name', address: 'address@domain'}]
	*
	* @param {String} str Address field
	* @param {Object} options Optional options object
	* @param {Number} options._depth Internal recursion depth counter (do not set manually)
	* @return {Array} An array of address objects
	*/
	function addressparser$1(str, options) {
		options = options || {};
		let depth = options._depth || 0;
		if (depth > MAX_NESTED_GROUP_DEPTH) return [];
		let tokens = new Tokenizer(str).tokenize();
		let addresses = [];
		let address = [];
		let parsedAddresses = [];
		tokens.forEach((token) => {
			if (token.type === "operator" && (token.value === "," || token.value === ";")) {
				if (address.length) addresses.push(address);
				address = [];
			} else address.push(token);
		});
		if (address.length) addresses.push(address);
		addresses.forEach((address$1) => {
			address$1 = _handleAddress(address$1, depth);
			if (address$1.length) parsedAddresses = parsedAddresses.concat(address$1);
		});
		if (options.flatten) {
			let addresses$1 = [];
			let walkAddressList = (list) => {
				list.forEach((address$1) => {
					if (address$1.group) return walkAddressList(address$1.group);
					else addresses$1.push(address$1);
				});
			};
			walkAddressList(parsedAddresses);
			return addresses$1;
		}
		return parsedAddresses;
	}
	module.exports = addressparser$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mime-node/last-newline.js
var require_last_newline = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$5 = __require("stream").Transform;
	var LastNewline$1 = class extends Transform$5 {
		constructor() {
			super();
			this.lastByte = false;
		}
		_transform(chunk, encoding, done) {
			if (chunk.length) this.lastByte = chunk[chunk.length - 1];
			this.push(chunk);
			done();
		}
		_flush(done) {
			if (this.lastByte === 10) return done();
			if (this.lastByte === 13) {
				this.push(Buffer.from("\n"));
				return done();
			}
			this.push(Buffer.from("\r\n"));
			return done();
		}
	};
	module.exports = LastNewline$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mime-node/le-windows.js
var require_le_windows = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$4 = __require("stream").Transform;
	/**
	* Ensures that only <CR><LF> sequences are used for linebreaks
	*
	* @param {Object} options Stream options
	*/
	var LeWindows$3 = class extends Transform$4 {
		constructor(options) {
			super(options);
			this.options = options || {};
			this.lastByte = false;
		}
		/**
		* Escapes dots
		*/
		_transform(chunk, encoding, done) {
			let buf;
			let lastPos = 0;
			for (let i = 0, len = chunk.length; i < len; i++) if (chunk[i] === 10) {
				if (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) {
					if (i > lastPos) {
						buf = chunk.slice(lastPos, i);
						this.push(buf);
					}
					this.push(Buffer.from("\r\n"));
					lastPos = i + 1;
				}
			}
			if (lastPos && lastPos < chunk.length) {
				buf = chunk.slice(lastPos);
				this.push(buf);
			} else if (!lastPos) this.push(chunk);
			this.lastByte = chunk[chunk.length - 1];
			done();
		}
	};
	module.exports = LeWindows$3;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mime-node/le-unix.js
var require_le_unix = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$3 = __require("stream").Transform;
	/**
	* Ensures that only <LF> is used for linebreaks
	*
	* @param {Object} options Stream options
	*/
	var LeWindows$2 = class extends Transform$3 {
		constructor(options) {
			super(options);
			this.options = options || {};
		}
		/**
		* Escapes dots
		*/
		_transform(chunk, encoding, done) {
			let buf;
			let lastPos = 0;
			for (let i = 0, len = chunk.length; i < len; i++) if (chunk[i] === 13) {
				buf = chunk.slice(lastPos, i);
				lastPos = i + 1;
				this.push(buf);
			}
			if (lastPos && lastPos < chunk.length) {
				buf = chunk.slice(lastPos);
				this.push(buf);
			} else if (!lastPos) this.push(chunk);
			done();
		}
	};
	module.exports = LeWindows$2;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mime-node/index.js
var require_mime_node = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const crypto$7 = __require("crypto");
	const fs$1 = __require("fs");
	const punycode$1 = require_punycode();
	const PassThrough$2 = __require("stream").PassThrough;
	const shared$11 = require_shared();
	const mimeFuncs$3 = require_mime_funcs();
	const qp = require_qp();
	const base64 = require_base64();
	const addressparser = require_addressparser();
	const nmfetch$2 = require_fetch();
	const LastNewline = require_last_newline();
	const LeWindows$1 = require_le_windows();
	const LeUnix = require_le_unix();
	/**
	* Creates a new mime tree node. Assumes 'multipart/*' as the content type
	* if it is a branch, anything else counts as leaf. If rootNode is missing from
	* the options, assumes this is the root.
	*
	* @param {String} contentType Define the content type for the node. Can be left blank for attachments (derived from filename)
	* @param {Object} [options] optional options
	* @param {Object} [options.rootNode] root node for this tree
	* @param {Object} [options.parentNode] immediate parent for this node
	* @param {Object} [options.filename] filename for an attachment node
	* @param {String} [options.baseBoundary] shared part of the unique multipart boundary
	* @param {Boolean} [options.keepBcc] If true, do not exclude Bcc from the generated headers
	* @param {Function} [options.normalizeHeaderKey] method to normalize header keys for custom caseing
	* @param {String} [options.textEncoding] either 'Q' (the default) or 'B'
	*/
	var MimeNode$3 = class MimeNode$3 {
		constructor(contentType, options) {
			this.nodeCounter = 0;
			options = options || {};
			/**
			* shared part of the unique multipart boundary
			*/
			this.baseBoundary = options.baseBoundary || crypto$7.randomBytes(8).toString("hex");
			this.boundaryPrefix = options.boundaryPrefix || "--_NmP";
			this.disableFileAccess = !!options.disableFileAccess;
			this.disableUrlAccess = !!options.disableUrlAccess;
			this.normalizeHeaderKey = options.normalizeHeaderKey;
			/**
			* If date headers is missing and current node is the root, this value is used instead
			*/
			this.date = /* @__PURE__ */ new Date();
			/**
			* Root node for current mime tree
			*/
			this.rootNode = options.rootNode || this;
			/**
			* If true include Bcc in generated headers (if available)
			*/
			this.keepBcc = !!options.keepBcc;
			/**
			* If filename is specified but contentType is not (probably an attachment)
			* detect the content type from filename extension
			*/
			if (options.filename) {
				/**
				* Filename for this node. Useful with attachments
				*/
				this.filename = options.filename;
				if (!contentType) contentType = mimeFuncs$3.detectMimeType(this.filename.split(".").pop());
			}
			/**
			* Indicates which encoding should be used for header strings: "Q" or "B"
			*/
			this.textEncoding = (options.textEncoding || "").toString().trim().charAt(0).toUpperCase();
			/**
			* Immediate parent for this node (or undefined if not set)
			*/
			this.parentNode = options.parentNode;
			/**
			* Hostname for default message-id values
			*/
			this.hostname = options.hostname;
			/**
			* If set to 'win' then uses \r\n, if 'linux' then \n. If not set (or `raw` is used) then newlines are kept as is.
			*/
			this.newline = options.newline;
			/**
			* An array for possible child nodes
			*/
			this.childNodes = [];
			/**
			* Used for generating unique boundaries (prepended to the shared base)
			*/
			this._nodeId = ++this.rootNode.nodeCounter;
			/**
			* A list of header values for this node in the form of [{key:'', value:''}]
			*/
			this._headers = [];
			/**
			* True if the content only uses ASCII printable characters
			* @type {Boolean}
			*/
			this._isPlainText = false;
			/**
			* True if the content is plain text but has longer lines than allowed
			* @type {Boolean}
			*/
			this._hasLongLines = false;
			/**
			* If set, use instead this value for envelopes instead of generating one
			* @type {Boolean}
			*/
			this._envelope = false;
			/**
			* If set then use this value as the stream content instead of building it
			* @type {String|Buffer|Stream}
			*/
			this._raw = false;
			/**
			* Additional transform streams that the message will be piped before
			* exposing by createReadStream
			* @type {Array}
			*/
			this._transforms = [];
			/**
			* Additional process functions that the message will be piped through before
			* exposing by createReadStream. These functions are run after transforms
			* @type {Array}
			*/
			this._processFuncs = [];
			/**
			* If content type is set (or derived from the filename) add it to headers
			*/
			if (contentType) this.setHeader("Content-Type", contentType);
		}
		/**
		* Creates and appends a child node.Arguments provided are passed to MimeNode constructor
		*
		* @param {String} [contentType] Optional content type
		* @param {Object} [options] Optional options object
		* @return {Object} Created node object
		*/
		createChild(contentType, options) {
			if (!options && typeof contentType === "object") {
				options = contentType;
				contentType = void 0;
			}
			let node = new MimeNode$3(contentType, options);
			this.appendChild(node);
			return node;
		}
		/**
		* Appends an existing node to the mime tree. Removes the node from an existing
		* tree if needed
		*
		* @param {Object} childNode node to be appended
		* @return {Object} Appended node object
		*/
		appendChild(childNode) {
			if (childNode.rootNode !== this.rootNode) {
				childNode.rootNode = this.rootNode;
				childNode._nodeId = ++this.rootNode.nodeCounter;
			}
			childNode.parentNode = this;
			this.childNodes.push(childNode);
			return childNode;
		}
		/**
		* Replaces current node with another node
		*
		* @param {Object} node Replacement node
		* @return {Object} Replacement node
		*/
		replace(node) {
			if (node === this) return this;
			this.parentNode.childNodes.forEach((childNode, i) => {
				if (childNode === this) {
					node.rootNode = this.rootNode;
					node.parentNode = this.parentNode;
					node._nodeId = this._nodeId;
					this.rootNode = this;
					this.parentNode = void 0;
					node.parentNode.childNodes[i] = node;
				}
			});
			return node;
		}
		/**
		* Removes current node from the mime tree
		*
		* @return {Object} removed node
		*/
		remove() {
			if (!this.parentNode) return this;
			for (let i = this.parentNode.childNodes.length - 1; i >= 0; i--) if (this.parentNode.childNodes[i] === this) {
				this.parentNode.childNodes.splice(i, 1);
				this.parentNode = void 0;
				this.rootNode = this;
				return this;
			}
		}
		/**
		* Sets a header value. If the value for selected key exists, it is overwritten.
		* You can set multiple values as well by using [{key:'', value:''}] or
		* {key: 'value'} as the first argument.
		*
		* @param {String|Array|Object} key Header key or a list of key value pairs
		* @param {String} value Header value
		* @return {Object} current node
		*/
		setHeader(key, value) {
			let added = false, headerValue;
			if (!value && key && typeof key === "object") {
				if (key.key && "value" in key) this.setHeader(key.key, key.value);
				else if (Array.isArray(key)) key.forEach((i) => {
					this.setHeader(i.key, i.value);
				});
				else Object.keys(key).forEach((i) => {
					this.setHeader(i, key[i]);
				});
				return this;
			}
			key = this._normalizeHeaderKey(key);
			headerValue = {
				key,
				value
			};
			for (let i = 0, len = this._headers.length; i < len; i++) if (this._headers[i].key === key) if (!added) {
				this._headers[i] = headerValue;
				added = true;
			} else {
				this._headers.splice(i, 1);
				i--;
				len--;
			}
			if (!added) this._headers.push(headerValue);
			return this;
		}
		/**
		* Adds a header value. If the value for selected key exists, the value is appended
		* as a new field and old one is not touched.
		* You can set multiple values as well by using [{key:'', value:''}] or
		* {key: 'value'} as the first argument.
		*
		* @param {String|Array|Object} key Header key or a list of key value pairs
		* @param {String} value Header value
		* @return {Object} current node
		*/
		addHeader(key, value) {
			if (!value && key && typeof key === "object") {
				if (key.key && key.value) this.addHeader(key.key, key.value);
				else if (Array.isArray(key)) key.forEach((i) => {
					this.addHeader(i.key, i.value);
				});
				else Object.keys(key).forEach((i) => {
					this.addHeader(i, key[i]);
				});
				return this;
			} else if (Array.isArray(value)) {
				value.forEach((val$1) => {
					this.addHeader(key, val$1);
				});
				return this;
			}
			this._headers.push({
				key: this._normalizeHeaderKey(key),
				value
			});
			return this;
		}
		/**
		* Retrieves the first mathcing value of a selected key
		*
		* @param {String} key Key to search for
		* @retun {String} Value for the key
		*/
		getHeader(key) {
			key = this._normalizeHeaderKey(key);
			for (let i = 0, len = this._headers.length; i < len; i++) if (this._headers[i].key === key) return this._headers[i].value;
		}
		/**
		* Sets body content for current node. If the value is a string, charset is added automatically
		* to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
		* the charset yourself
		*
		* @param (String|Buffer) content Body content
		* @return {Object} current node
		*/
		setContent(content) {
			this.content = content;
			if (typeof this.content.pipe === "function") {
				this._contentErrorHandler = (err) => {
					this.content.removeListener("error", this._contentErrorHandler);
					this.content = err;
				};
				this.content.once("error", this._contentErrorHandler);
			} else if (typeof this.content === "string") {
				this._isPlainText = mimeFuncs$3.isPlainText(this.content);
				if (this._isPlainText && mimeFuncs$3.hasLongerLines(this.content, 76)) this._hasLongLines = true;
			}
			return this;
		}
		build(callback) {
			let promise;
			if (!callback) promise = new Promise((resolve$1, reject) => {
				callback = shared$11.callbackPromise(resolve$1, reject);
			});
			let stream = this.createReadStream();
			let buf = [];
			let buflen = 0;
			let returned = false;
			stream.on("readable", () => {
				let chunk;
				while ((chunk = stream.read()) !== null) {
					buf.push(chunk);
					buflen += chunk.length;
				}
			});
			stream.once("error", (err) => {
				if (returned) return;
				returned = true;
				return callback(err);
			});
			stream.once("end", (chunk) => {
				if (returned) return;
				returned = true;
				if (chunk && chunk.length) {
					buf.push(chunk);
					buflen += chunk.length;
				}
				return callback(null, Buffer.concat(buf, buflen));
			});
			return promise;
		}
		getTransferEncoding() {
			let transferEncoding = false;
			let contentType = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
			if (this.content) {
				transferEncoding = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim();
				if (!transferEncoding || !["base64", "quoted-printable"].includes(transferEncoding)) {
					if (/^text\//i.test(contentType)) if (this._isPlainText && !this._hasLongLines) transferEncoding = "7bit";
					else if (typeof this.content === "string" || this.content instanceof Buffer) transferEncoding = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64";
					else transferEncoding = this.textEncoding === "B" ? "base64" : "quoted-printable";
					else if (!/^(multipart|message)\//i.test(contentType)) transferEncoding = transferEncoding || "base64";
				}
			}
			return transferEncoding;
		}
		/**
		* Builds the header block for the mime node. Append \r\n\r\n before writing the content
		*
		* @returns {String} Headers
		*/
		buildHeaders() {
			let transferEncoding = this.getTransferEncoding();
			let headers = [];
			if (transferEncoding) this.setHeader("Content-Transfer-Encoding", transferEncoding);
			if (this.filename && !this.getHeader("Content-Disposition")) this.setHeader("Content-Disposition", "attachment");
			if (this.rootNode === this) {
				if (!this.getHeader("Date")) this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000"));
				this.messageId();
				if (!this.getHeader("MIME-Version")) this.setHeader("MIME-Version", "1.0");
				for (let i = this._headers.length - 2; i >= 0; i--) {
					let header = this._headers[i];
					if (header.key === "Content-Type") {
						this._headers.splice(i, 1);
						this._headers.push(header);
					}
				}
			}
			this._headers.forEach((header) => {
				let key = header.key;
				let value = header.value;
				let structured;
				let param;
				let options = {};
				if (value && typeof value === "object" && ![
					"From",
					"Sender",
					"To",
					"Cc",
					"Bcc",
					"Reply-To",
					"Date",
					"References"
				].includes(key)) {
					Object.keys(value).forEach((key$1) => {
						if (key$1 !== "value") options[key$1] = value[key$1];
					});
					value = (value.value || "").toString();
					if (!value.trim()) return;
				}
				if (options.prepared) {
					if (options.foldLines) headers.push(mimeFuncs$3.foldLines(key + ": " + value));
					else headers.push(key + ": " + value);
					return;
				}
				switch (header.key) {
					case "Content-Disposition":
						structured = mimeFuncs$3.parseHeaderValue(value);
						if (this.filename) structured.params.filename = this.filename;
						value = mimeFuncs$3.buildHeaderValue(structured);
						break;
					case "Content-Type":
						structured = mimeFuncs$3.parseHeaderValue(value);
						this._handleContentType(structured);
						if (structured.value.match(/^text\/plain\b/) && typeof this.content === "string" && /[\u0080-\uFFFF]/.test(this.content)) structured.params.charset = "utf-8";
						value = mimeFuncs$3.buildHeaderValue(structured);
						if (this.filename) {
							param = this._encodeWords(this.filename);
							if (param !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(param)) param = "\"" + param + "\"";
							value += "; name=" + param;
						}
						break;
					case "Bcc":
						if (!this.keepBcc) return;
						break;
				}
				value = this._encodeHeaderValue(key, value);
				if (!(value || "").toString().trim()) return;
				if (typeof this.normalizeHeaderKey === "function") {
					let normalized$1 = this.normalizeHeaderKey(key, value);
					if (normalized$1 && typeof normalized$1 === "string" && normalized$1.length) key = normalized$1;
				}
				headers.push(mimeFuncs$3.foldLines(key + ": " + value, 76));
			});
			return headers.join("\r\n");
		}
		/**
		* Streams the rfc2822 message from the current node. If this is a root node,
		* mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
		*
		* @return {String} Compiled message
		*/
		createReadStream(options) {
			options = options || {};
			let stream = new PassThrough$2(options);
			let outputStream = stream;
			let transform$1;
			this.stream(stream, options, (err) => {
				if (err) {
					outputStream.emit("error", err);
					return;
				}
				stream.end();
			});
			for (let i = 0, len = this._transforms.length; i < len; i++) {
				transform$1 = typeof this._transforms[i] === "function" ? this._transforms[i]() : this._transforms[i];
				outputStream.once("error", (err) => {
					transform$1.emit("error", err);
				});
				outputStream = outputStream.pipe(transform$1);
			}
			transform$1 = new LastNewline();
			outputStream.once("error", (err) => {
				transform$1.emit("error", err);
			});
			outputStream = outputStream.pipe(transform$1);
			for (let i = 0, len = this._processFuncs.length; i < len; i++) {
				transform$1 = this._processFuncs[i];
				outputStream = transform$1(outputStream);
			}
			if (this.newline) {
				const newlineTransform = [
					"win",
					"windows",
					"dos",
					"\r\n"
				].includes(this.newline.toString().toLowerCase()) ? new LeWindows$1() : new LeUnix();
				const stream$1 = outputStream.pipe(newlineTransform);
				outputStream.on("error", (err) => stream$1.emit("error", err));
				return stream$1;
			}
			return outputStream;
		}
		/**
		* Appends a transform stream object to the transforms list. Final output
		* is passed through this stream before exposing
		*
		* @param {Object} transform Read-Write stream
		*/
		transform(transform$1) {
			this._transforms.push(transform$1);
		}
		/**
		* Appends a post process function. The functon is run after transforms and
		* uses the following syntax
		*
		*   processFunc(input) -> outputStream
		*
		* @param {Object} processFunc Read-Write stream
		*/
		processFunc(processFunc) {
			this._processFuncs.push(processFunc);
		}
		stream(outputStream, options, done) {
			let transferEncoding = this.getTransferEncoding();
			let contentStream;
			let localStream;
			let returned = false;
			let callback = (err) => {
				if (returned) return;
				returned = true;
				done(err);
			};
			let finalize = () => {
				let childId = 0;
				let processChildNode = () => {
					if (childId >= this.childNodes.length) {
						outputStream.write("\r\n--" + this.boundary + "--\r\n");
						return callback();
					}
					let child = this.childNodes[childId++];
					outputStream.write((childId > 1 ? "\r\n" : "") + "--" + this.boundary + "\r\n");
					child.stream(outputStream, options, (err) => {
						if (err) return callback(err);
						setImmediate(processChildNode);
					});
				};
				if (this.multipart) setImmediate(processChildNode);
				else return callback();
			};
			let sendContent = () => {
				if (this.content) {
					if (Object.prototype.toString.call(this.content) === "[object Error]") return callback(this.content);
					if (typeof this.content.pipe === "function") {
						this.content.removeListener("error", this._contentErrorHandler);
						this._contentErrorHandler = (err) => callback(err);
						this.content.once("error", this._contentErrorHandler);
					}
					let createStream = () => {
						if (["quoted-printable", "base64"].includes(transferEncoding)) {
							contentStream = new (transferEncoding === "base64" ? base64 : qp).Encoder(options);
							contentStream.pipe(outputStream, { end: false });
							contentStream.once("end", finalize);
							contentStream.once("error", (err) => callback(err));
							localStream = this._getStream(this.content);
							localStream.pipe(contentStream);
						} else {
							localStream = this._getStream(this.content);
							localStream.pipe(outputStream, { end: false });
							localStream.once("end", finalize);
						}
						localStream.once("error", (err) => callback(err));
					};
					if (this.content._resolve) {
						let chunks = [];
						let chunklen = 0;
						let returned$1 = false;
						let sourceStream = this._getStream(this.content);
						sourceStream.on("error", (err) => {
							if (returned$1) return;
							returned$1 = true;
							callback(err);
						});
						sourceStream.on("readable", () => {
							let chunk;
							while ((chunk = sourceStream.read()) !== null) {
								chunks.push(chunk);
								chunklen += chunk.length;
							}
						});
						sourceStream.on("end", () => {
							if (returned$1) return;
							returned$1 = true;
							this.content._resolve = false;
							this.content._resolvedValue = Buffer.concat(chunks, chunklen);
							setImmediate(createStream);
						});
					} else setImmediate(createStream);
					return;
				} else return setImmediate(finalize);
			};
			if (this._raw) setImmediate(() => {
				if (Object.prototype.toString.call(this._raw) === "[object Error]") return callback(this._raw);
				if (typeof this._raw.pipe === "function") this._raw.removeListener("error", this._contentErrorHandler);
				let raw = this._getStream(this._raw);
				raw.pipe(outputStream, { end: false });
				raw.on("error", (err) => outputStream.emit("error", err));
				raw.on("end", finalize);
			});
			else {
				outputStream.write(this.buildHeaders() + "\r\n\r\n");
				setImmediate(sendContent);
			}
		}
		/**
		* Sets envelope to be used instead of the generated one
		*
		* @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
		*/
		setEnvelope(envelope) {
			let list;
			this._envelope = {
				from: false,
				to: []
			};
			if (envelope.from) {
				list = [];
				this._convertAddresses(this._parseAddresses(envelope.from), list);
				list = list.filter((address) => address && address.address);
				if (list.length && list[0]) this._envelope.from = list[0].address;
			}
			[
				"to",
				"cc",
				"bcc"
			].forEach((key) => {
				if (envelope[key]) this._convertAddresses(this._parseAddresses(envelope[key]), this._envelope.to);
			});
			this._envelope.to = this._envelope.to.map((to) => to.address).filter((address) => address);
			let standardFields = [
				"to",
				"cc",
				"bcc",
				"from"
			];
			Object.keys(envelope).forEach((key) => {
				if (!standardFields.includes(key)) this._envelope[key] = envelope[key];
			});
			return this;
		}
		/**
		* Generates and returns an object with parsed address fields
		*
		* @return {Object} Address object
		*/
		getAddresses() {
			let addresses = {};
			this._headers.forEach((header) => {
				let key = header.key.toLowerCase();
				if ([
					"from",
					"sender",
					"reply-to",
					"to",
					"cc",
					"bcc"
				].includes(key)) {
					if (!Array.isArray(addresses[key])) addresses[key] = [];
					this._convertAddresses(this._parseAddresses(header.value), addresses[key]);
				}
			});
			return addresses;
		}
		/**
		* Generates and returns SMTP envelope with the sender address and a list of recipients addresses
		*
		* @return {Object} SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
		*/
		getEnvelope() {
			if (this._envelope) return this._envelope;
			let envelope = {
				from: false,
				to: []
			};
			this._headers.forEach((header) => {
				let list = [];
				if (header.key === "From" || !envelope.from && ["Reply-To", "Sender"].includes(header.key)) {
					this._convertAddresses(this._parseAddresses(header.value), list);
					if (list.length && list[0]) envelope.from = list[0].address;
				} else if ([
					"To",
					"Cc",
					"Bcc"
				].includes(header.key)) this._convertAddresses(this._parseAddresses(header.value), envelope.to);
			});
			envelope.to = envelope.to.map((to) => to.address);
			return envelope;
		}
		/**
		* Returns Message-Id value. If it does not exist, then creates one
		*
		* @return {String} Message-Id value
		*/
		messageId() {
			let messageId = this.getHeader("Message-ID");
			if (!messageId) {
				messageId = this._generateMessageId();
				this.setHeader("Message-ID", messageId);
			}
			return messageId;
		}
		/**
		* Sets pregenerated content that will be used as the output of this node
		*
		* @param {String|Buffer|Stream} Raw MIME contents
		*/
		setRaw(raw) {
			this._raw = raw;
			if (this._raw && typeof this._raw.pipe === "function") {
				this._contentErrorHandler = (err) => {
					this._raw.removeListener("error", this._contentErrorHandler);
					this._raw = err;
				};
				this._raw.once("error", this._contentErrorHandler);
			}
			return this;
		}
		/**
		* Detects and returns handle to a stream related with the content.
		*
		* @param {Mixed} content Node content
		* @returns {Object} Stream object
		*/
		_getStream(content) {
			let contentStream;
			if (content._resolvedValue) {
				contentStream = new PassThrough$2();
				setImmediate(() => {
					try {
						contentStream.end(content._resolvedValue);
					} catch (_err) {
						contentStream.emit("error", _err);
					}
				});
				return contentStream;
			} else if (typeof content.pipe === "function") return content;
			else if (content && typeof content.path === "string" && !content.href) {
				if (this.disableFileAccess) {
					contentStream = new PassThrough$2();
					setImmediate(() => contentStream.emit("error", /* @__PURE__ */ new Error("File access rejected for " + content.path)));
					return contentStream;
				}
				return fs$1.createReadStream(content.path);
			} else if (content && typeof content.href === "string") {
				if (this.disableUrlAccess) {
					contentStream = new PassThrough$2();
					setImmediate(() => contentStream.emit("error", /* @__PURE__ */ new Error("Url access rejected for " + content.href)));
					return contentStream;
				}
				return nmfetch$2(content.href, { headers: content.httpHeaders });
			} else {
				contentStream = new PassThrough$2();
				setImmediate(() => {
					try {
						contentStream.end(content || "");
					} catch (_err) {
						contentStream.emit("error", _err);
					}
				});
				return contentStream;
			}
		}
		/**
		* Parses addresses. Takes in a single address or an array or an
		* array of address arrays (eg. To: [[first group], [second group],...])
		*
		* @param {Mixed} addresses Addresses to be parsed
		* @return {Array} An array of address objects
		*/
		_parseAddresses(addresses) {
			return [].concat.apply([], [].concat(addresses).map((address) => {
				if (address && address.address) {
					address.address = this._normalizeAddress(address.address);
					address.name = address.name || "";
					return [address];
				}
				return addressparser(address);
			}));
		}
		/**
		* Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
		*
		* @param {String} key Key to be normalized
		* @return {String} key in Camel-Case form
		*/
		_normalizeHeaderKey(key) {
			key = (key || "").toString().replace(/\r?\n|\r/g, " ").trim().toLowerCase().replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (c) => c.toUpperCase()).replace(/^Content-Features$/i, "Content-features");
			return key;
		}
		/**
		* Checks if the content type is multipart and defines boundary if needed.
		* Doesn't return anything, modifies object argument instead.
		*
		* @param {Object} structured Parsed header value for 'Content-Type' key
		*/
		_handleContentType(structured) {
			this.contentType = structured.value.trim().toLowerCase();
			this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : false;
			if (this.multipart) this.boundary = structured.params.boundary = structured.params.boundary || this.boundary || this._generateBoundary();
			else this.boundary = false;
		}
		/**
		* Generates a multipart boundary value
		*
		* @return {String} boundary value
		*/
		_generateBoundary() {
			return this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary + "-Part_" + this._nodeId;
		}
		/**
		* Encodes a header value for use in the generated rfc2822 email.
		*
		* @param {String} key Header key
		* @param {String} value Header value
		*/
		_encodeHeaderValue(key, value) {
			key = this._normalizeHeaderKey(key);
			switch (key) {
				case "From":
				case "Sender":
				case "To":
				case "Cc":
				case "Bcc":
				case "Reply-To": return this._convertAddresses(this._parseAddresses(value));
				case "Message-ID":
				case "In-Reply-To":
				case "Content-Id":
					value = (value || "").toString().replace(/\r?\n|\r/g, " ");
					if (value.charAt(0) !== "<") value = "<" + value;
					if (value.charAt(value.length - 1) !== ">") value = value + ">";
					return value;
				case "References":
					value = [].concat.apply([], [].concat(value || "").map((elm) => {
						elm = (elm || "").toString().replace(/\r?\n|\r/g, " ").trim();
						return elm.replace(/<[^>]*>/g, (str) => str.replace(/\s/g, "")).split(/\s+/);
					})).map((elm) => {
						if (elm.charAt(0) !== "<") elm = "<" + elm;
						if (elm.charAt(elm.length - 1) !== ">") elm = elm + ">";
						return elm;
					});
					return value.join(" ").trim();
				case "Date":
					if (Object.prototype.toString.call(value) === "[object Date]") return value.toUTCString().replace(/GMT/, "+0000");
					value = (value || "").toString().replace(/\r?\n|\r/g, " ");
					return this._encodeWords(value);
				case "Content-Type":
				case "Content-Disposition": return (value || "").toString().replace(/\r?\n|\r/g, " ");
				default:
					value = (value || "").toString().replace(/\r?\n|\r/g, " ");
					return this._encodeWords(value);
			}
		}
		/**
		* Rebuilds address object using punycode and other adjustments
		*
		* @param {Array} addresses An array of address objects
		* @param {Array} [uniqueList] An array to be populated with addresses
		* @return {String} address string
		*/
		_convertAddresses(addresses, uniqueList) {
			let values = [];
			uniqueList = uniqueList || [];
			[].concat(addresses || []).forEach((address) => {
				if (address.address) {
					address.address = this._normalizeAddress(address.address);
					if (!address.name) values.push(address.address.indexOf(" ") >= 0 ? `<${address.address}>` : `${address.address}`);
					else if (address.name) values.push(`${this._encodeAddressName(address.name)} <${address.address}>`);
					if (address.address) {
						if (!uniqueList.filter((a) => a.address === address.address).length) uniqueList.push(address);
					}
				} else if (address.group) {
					let groupListAddresses = (address.group.length ? this._convertAddresses(address.group, uniqueList) : "").trim();
					values.push(`${this._encodeAddressName(address.name)}:${groupListAddresses};`);
				}
			});
			return values.join(", ");
		}
		/**
		* Normalizes an email address
		*
		* @param {Array} address An array of address objects
		* @return {String} address string
		*/
		_normalizeAddress(address) {
			address = (address || "").toString().replace(/[\x00-\x1F<>]+/g, " ").trim();
			let lastAt = address.lastIndexOf("@");
			if (lastAt < 0) return address;
			let user$2 = address.substr(0, lastAt);
			let domain = address.substr(lastAt + 1);
			let encodedDomain;
			try {
				encodedDomain = punycode$1.toASCII(domain.toLowerCase());
			} catch (_err) {}
			if (user$2.indexOf(" ") >= 0) {
				if (user$2.charAt(0) !== "\"") user$2 = "\"" + user$2;
				if (user$2.substr(-1) !== "\"") user$2 = user$2 + "\"";
			}
			return `${user$2}@${encodedDomain}`;
		}
		/**
		* If needed, mime encodes the name part
		*
		* @param {String} name Name part of an address
		* @returns {String} Mime word encoded string if needed
		*/
		_encodeAddressName(name) {
			if (!/^[\w ]*$/.test(name)) if (/^[\x20-\x7e]*$/.test(name)) return "\"" + name.replace(/([\\"])/g, "\\$1") + "\"";
			else return mimeFuncs$3.encodeWord(name, this._getTextEncoding(name), 52);
			return name;
		}
		/**
		* If needed, mime encodes the name part
		*
		* @param {String} name Name part of an address
		* @returns {String} Mime word encoded string if needed
		*/
		_encodeWords(value) {
			return mimeFuncs$3.encodeWords(value, this._getTextEncoding(value), 52, true);
		}
		/**
		* Detects best mime encoding for a text value
		*
		* @param {String} value Value to check for
		* @return {String} either 'Q' or 'B'
		*/
		_getTextEncoding(value) {
			value = (value || "").toString();
			let encoding = this.textEncoding;
			let latinLen;
			let nonLatinLen;
			if (!encoding) {
				nonLatinLen = (value.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\u0080-\uFFFF]/g) || []).length;
				latinLen = (value.match(/[a-z]/gi) || []).length;
				encoding = nonLatinLen < latinLen ? "Q" : "B";
			}
			return encoding;
		}
		/**
		* Generates a message id
		*
		* @return {String} Random Message-ID value
		*/
		_generateMessageId() {
			return "<" + [
				2,
				2,
				2,
				6
			].reduce((prev, len) => prev + "-" + crypto$7.randomBytes(len).toString("hex"), crypto$7.randomBytes(4).toString("hex")) + "@" + (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
		}
	};
	module.exports = MimeNode$3;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mail-composer/index.js
var require_mail_composer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const MimeNode$2 = require_mime_node();
	const mimeFuncs$2 = require_mime_funcs();
	const parseDataURI = require_shared().parseDataURI;
	/**
	* Creates the object for composing a MimeNode instance out from the mail options
	*
	* @constructor
	* @param {Object} mail Mail options
	*/
	var MailComposer$1 = class {
		constructor(mail) {
			this.mail = mail || {};
			this.message = false;
		}
		/**
		* Builds MimeNode instance
		*/
		compile() {
			this._alternatives = this.getAlternatives();
			this._htmlNode = this._alternatives.filter((alternative) => /^text\/html\b/i.test(alternative.contentType)).pop();
			this._attachments = this.getAttachments(!!this._htmlNode);
			this._useRelated = !!(this._htmlNode && this._attachments.related.length);
			this._useAlternative = this._alternatives.length > 1;
			this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1;
			if (this.mail.raw) this.message = new MimeNode$2("message/rfc822", { newline: this.mail.newline }).setRaw(this.mail.raw);
			else if (this._useMixed) this.message = this._createMixed();
			else if (this._useAlternative) this.message = this._createAlternative();
			else if (this._useRelated) this.message = this._createRelated();
			else this.message = this._createContentNode(false, [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
				contentType: "text/plain",
				content: ""
			});
			if (this.mail.headers) this.message.addHeader(this.mail.headers);
			[
				"from",
				"sender",
				"to",
				"cc",
				"bcc",
				"reply-to",
				"in-reply-to",
				"references",
				"subject",
				"message-id",
				"date"
			].forEach((header) => {
				let key = header.replace(/-(\w)/g, (o, c) => c.toUpperCase());
				if (this.mail[key]) this.message.setHeader(header, this.mail[key]);
			});
			if (this.mail.envelope) this.message.setEnvelope(this.mail.envelope);
			this.message.messageId();
			return this.message;
		}
		/**
		* List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
		*
		* @param {Boolean} findRelated If true separate related attachments from attached ones
		* @returns {Object} An object of arrays (`related` and `attached`)
		*/
		getAttachments(findRelated) {
			let icalEvent, eventObject;
			let attachments = [].concat(this.mail.attachments || []).map((attachment, i) => {
				let data;
				if (/^data:/i.test(attachment.path || attachment.href)) attachment = this._processDataUrl(attachment);
				let contentType = attachment.contentType || mimeFuncs$2.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
				let isImage = /^image\//i.test(contentType);
				let isMessageNode = /^message\//i.test(contentType);
				let contentDisposition = attachment.contentDisposition || (isMessageNode || isImage && attachment.cid ? "inline" : "attachment");
				let contentTransferEncoding;
				if ("contentTransferEncoding" in attachment) contentTransferEncoding = attachment.contentTransferEncoding;
				else if (isMessageNode) contentTransferEncoding = "8bit";
				else contentTransferEncoding = "base64";
				data = {
					contentType,
					contentDisposition,
					contentTransferEncoding
				};
				if (attachment.filename) data.filename = attachment.filename;
				else if (!isMessageNode && attachment.filename !== false) {
					data.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1);
					if (data.filename.indexOf(".") < 0) data.filename += "." + mimeFuncs$2.detectExtension(data.contentType);
				}
				if (/^https?:\/\//i.test(attachment.path)) {
					attachment.href = attachment.path;
					attachment.path = void 0;
				}
				if (attachment.cid) data.cid = attachment.cid;
				if (attachment.raw) data.raw = attachment.raw;
				else if (attachment.path) data.content = { path: attachment.path };
				else if (attachment.href) data.content = {
					href: attachment.href,
					httpHeaders: attachment.httpHeaders
				};
				else data.content = attachment.content || "";
				if (attachment.encoding) data.encoding = attachment.encoding;
				if (attachment.headers) data.headers = attachment.headers;
				return data;
			});
			if (this.mail.icalEvent) {
				if (typeof this.mail.icalEvent === "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw)) icalEvent = this.mail.icalEvent;
				else icalEvent = { content: this.mail.icalEvent };
				eventObject = {};
				Object.keys(icalEvent).forEach((key) => {
					eventObject[key] = icalEvent[key];
				});
				eventObject.contentType = "application/ics";
				if (!eventObject.headers) eventObject.headers = {};
				eventObject.filename = eventObject.filename || "invite.ics";
				eventObject.headers["Content-Disposition"] = "attachment";
				eventObject.headers["Content-Transfer-Encoding"] = "base64";
			}
			if (!findRelated) return {
				attached: attachments.concat(eventObject || []),
				related: []
			};
			else return {
				attached: attachments.filter((attachment) => !attachment.cid).concat(eventObject || []),
				related: attachments.filter((attachment) => !!attachment.cid)
			};
		}
		/**
		* List alternatives. Resulting objects can be used as input for MimeNode nodes
		*
		* @returns {Array} An array of alternative elements. Includes the `text` and `html` values as well
		*/
		getAlternatives() {
			let alternatives = [], text$1, html, watchHtml, amp, icalEvent, eventObject;
			if (this.mail.text) {
				if (typeof this.mail.text === "object" && (this.mail.text.content || this.mail.text.path || this.mail.text.href || this.mail.text.raw)) text$1 = this.mail.text;
				else text$1 = { content: this.mail.text };
				text$1.contentType = "text/plain; charset=utf-8";
			}
			if (this.mail.watchHtml) {
				if (typeof this.mail.watchHtml === "object" && (this.mail.watchHtml.content || this.mail.watchHtml.path || this.mail.watchHtml.href || this.mail.watchHtml.raw)) watchHtml = this.mail.watchHtml;
				else watchHtml = { content: this.mail.watchHtml };
				watchHtml.contentType = "text/watch-html; charset=utf-8";
			}
			if (this.mail.amp) {
				if (typeof this.mail.amp === "object" && (this.mail.amp.content || this.mail.amp.path || this.mail.amp.href || this.mail.amp.raw)) amp = this.mail.amp;
				else amp = { content: this.mail.amp };
				amp.contentType = "text/x-amp-html; charset=utf-8";
			}
			if (this.mail.icalEvent) {
				if (typeof this.mail.icalEvent === "object" && (this.mail.icalEvent.content || this.mail.icalEvent.path || this.mail.icalEvent.href || this.mail.icalEvent.raw)) icalEvent = this.mail.icalEvent;
				else icalEvent = { content: this.mail.icalEvent };
				eventObject = {};
				Object.keys(icalEvent).forEach((key) => {
					eventObject[key] = icalEvent[key];
				});
				if (eventObject.content && typeof eventObject.content === "object") eventObject.content._resolve = true;
				eventObject.filename = false;
				eventObject.contentType = "text/calendar; charset=utf-8; method=" + (eventObject.method || "PUBLISH").toString().trim().toUpperCase();
				if (!eventObject.headers) eventObject.headers = {};
			}
			if (this.mail.html) {
				if (typeof this.mail.html === "object" && (this.mail.html.content || this.mail.html.path || this.mail.html.href || this.mail.html.raw)) html = this.mail.html;
				else html = { content: this.mail.html };
				html.contentType = "text/html; charset=utf-8";
			}
			[].concat(text$1 || []).concat(watchHtml || []).concat(amp || []).concat(html || []).concat(eventObject || []).concat(this.mail.alternatives || []).forEach((alternative) => {
				let data;
				if (/^data:/i.test(alternative.path || alternative.href)) alternative = this._processDataUrl(alternative);
				data = {
					contentType: alternative.contentType || mimeFuncs$2.detectMimeType(alternative.filename || alternative.path || alternative.href || "txt"),
					contentTransferEncoding: alternative.contentTransferEncoding
				};
				if (alternative.filename) data.filename = alternative.filename;
				if (/^https?:\/\//i.test(alternative.path)) {
					alternative.href = alternative.path;
					alternative.path = void 0;
				}
				if (alternative.raw) data.raw = alternative.raw;
				else if (alternative.path) data.content = { path: alternative.path };
				else if (alternative.href) data.content = { href: alternative.href };
				else data.content = alternative.content || "";
				if (alternative.encoding) data.encoding = alternative.encoding;
				if (alternative.headers) data.headers = alternative.headers;
				alternatives.push(data);
			});
			return alternatives;
		}
		/**
		* Builds multipart/mixed node. It should always contain different type of elements on the same level
		* eg. text + attachments
		*
		* @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
		* @returns {Object} MimeNode node element
		*/
		_createMixed(parentNode) {
			let node;
			if (!parentNode) node = new MimeNode$2("multipart/mixed", {
				baseBoundary: this.mail.baseBoundary,
				textEncoding: this.mail.textEncoding,
				boundaryPrefix: this.mail.boundaryPrefix,
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			else node = parentNode.createChild("multipart/mixed", {
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			if (this._useAlternative) this._createAlternative(node);
			else if (this._useRelated) this._createRelated(node);
			[].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((element) => {
				if (!this._useRelated || element !== this._htmlNode) this._createContentNode(node, element);
			});
			return node;
		}
		/**
		* Builds multipart/alternative node. It should always contain same type of elements on the same level
		* eg. text + html view of the same data
		*
		* @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
		* @returns {Object} MimeNode node element
		*/
		_createAlternative(parentNode) {
			let node;
			if (!parentNode) node = new MimeNode$2("multipart/alternative", {
				baseBoundary: this.mail.baseBoundary,
				textEncoding: this.mail.textEncoding,
				boundaryPrefix: this.mail.boundaryPrefix,
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			else node = parentNode.createChild("multipart/alternative", {
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			this._alternatives.forEach((alternative) => {
				if (this._useRelated && this._htmlNode === alternative) this._createRelated(node);
				else this._createContentNode(node, alternative);
			});
			return node;
		}
		/**
		* Builds multipart/related node. It should always contain html node with related attachments
		*
		* @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
		* @returns {Object} MimeNode node element
		*/
		_createRelated(parentNode) {
			let node;
			if (!parentNode) node = new MimeNode$2("multipart/related; type=\"text/html\"", {
				baseBoundary: this.mail.baseBoundary,
				textEncoding: this.mail.textEncoding,
				boundaryPrefix: this.mail.boundaryPrefix,
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			else node = parentNode.createChild("multipart/related; type=\"text/html\"", {
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			this._createContentNode(node, this._htmlNode);
			this._attachments.related.forEach((alternative) => this._createContentNode(node, alternative));
			return node;
		}
		/**
		* Creates a regular node with contents
		*
		* @param {Object} parentNode Parent for this note. If it does not exist, a root node is created
		* @param {Object} element Node data
		* @returns {Object} MimeNode node element
		*/
		_createContentNode(parentNode, element) {
			element = element || {};
			element.content = element.content || "";
			let node;
			let encoding = (element.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
			if (!parentNode) node = new MimeNode$2(element.contentType, {
				filename: element.filename,
				baseBoundary: this.mail.baseBoundary,
				textEncoding: this.mail.textEncoding,
				boundaryPrefix: this.mail.boundaryPrefix,
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			else node = parentNode.createChild(element.contentType, {
				filename: element.filename,
				textEncoding: this.mail.textEncoding,
				disableUrlAccess: this.mail.disableUrlAccess,
				disableFileAccess: this.mail.disableFileAccess,
				normalizeHeaderKey: this.mail.normalizeHeaderKey,
				newline: this.mail.newline
			});
			if (element.headers) node.addHeader(element.headers);
			if (element.cid) node.setHeader("Content-Id", "<" + element.cid.replace(/[<>]/g, "") + ">");
			if (element.contentTransferEncoding) node.setHeader("Content-Transfer-Encoding", element.contentTransferEncoding);
			else if (this.mail.encoding && /^text\//i.test(element.contentType)) node.setHeader("Content-Transfer-Encoding", this.mail.encoding);
			if (!/^text\//i.test(element.contentType) || element.contentDisposition) node.setHeader("Content-Disposition", element.contentDisposition || (element.cid && /^image\//i.test(element.contentType) ? "inline" : "attachment"));
			if (typeof element.content === "string" && ![
				"utf8",
				"usascii",
				"ascii"
			].includes(encoding)) element.content = Buffer.from(element.content, encoding);
			if (element.raw) node.setRaw(element.raw);
			else node.setContent(element.content);
			return node;
		}
		/**
		* Parses data uri and converts it to a Buffer
		*
		* @param {Object} element Content element
		* @return {Object} Parsed element
		*/
		_processDataUrl(element) {
			const dataUrl = element.path || element.href;
			if (!dataUrl || typeof dataUrl !== "string") return element;
			if (!dataUrl.startsWith("data:")) return element;
			if (dataUrl.length > 52428800) {
				let detectedType = "application/octet-stream";
				const commaPos = dataUrl.indexOf(",");
				if (commaPos > 0 && commaPos < 200) {
					const parts = dataUrl.substring(5, commaPos).split(";");
					if (parts[0] && parts[0].includes("/")) detectedType = parts[0].trim();
				}
				return Object.assign({}, element, {
					path: false,
					href: false,
					content: Buffer.alloc(0),
					contentType: element.contentType || detectedType
				});
			}
			let parsedDataUri;
			try {
				parsedDataUri = parseDataURI(dataUrl);
			} catch (_err) {
				return element;
			}
			if (!parsedDataUri) return element;
			element.content = parsedDataUri.data;
			element.contentType = element.contentType || parsedDataUri.contentType;
			if ("path" in element) element.path = false;
			if ("href" in element) element.href = false;
			return element;
		}
	};
	module.exports = MailComposer$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/dkim/message-parser.js
var require_message_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$2 = __require("stream").Transform;
	/**
	* MessageParser instance is a transform stream that separates message headers
	* from the rest of the body. Headers are emitted with the 'headers' event. Message
	* body is passed on as the resulting stream.
	*/
	var MessageParser$1 = class extends Transform$2 {
		constructor(options) {
			super(options);
			this.lastBytes = Buffer.alloc(4);
			this.headersParsed = false;
			this.headerBytes = 0;
			this.headerChunks = [];
			this.rawHeaders = false;
			this.bodySize = 0;
		}
		/**
		* Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
		*
		* @param {Buffer} data Next data chunk from the stream
		*/
		updateLastBytes(data) {
			let lblen = this.lastBytes.length;
			let nblen = Math.min(data.length, lblen);
			for (let i = 0, len = lblen - nblen; i < len; i++) this.lastBytes[i] = this.lastBytes[i + nblen];
			for (let i = 1; i <= nblen; i++) this.lastBytes[lblen - i] = data[data.length - i];
		}
		/**
		* Finds and removes message headers from the remaining body. We want to keep
		* headers separated until final delivery to be able to modify these
		*
		* @param {Buffer} data Next chunk of data
		* @return {Boolean} Returns true if headers are already found or false otherwise
		*/
		checkHeaders(data) {
			if (this.headersParsed) return true;
			let lblen = this.lastBytes.length;
			let headerPos = 0;
			this.curLinePos = 0;
			for (let i = 0, len = this.lastBytes.length + data.length; i < len; i++) {
				let chr;
				if (i < lblen) chr = this.lastBytes[i];
				else chr = data[i - lblen];
				if (chr === 10 && i) {
					let pr1 = i - 1 < lblen ? this.lastBytes[i - 1] : data[i - 1 - lblen];
					let pr2 = i > 1 ? i - 2 < lblen ? this.lastBytes[i - 2] : data[i - 2 - lblen] : false;
					if (pr1 === 10) {
						this.headersParsed = true;
						headerPos = i - lblen + 1;
						this.headerBytes += headerPos;
						break;
					} else if (pr1 === 13 && pr2 === 10) {
						this.headersParsed = true;
						headerPos = i - lblen + 1;
						this.headerBytes += headerPos;
						break;
					}
				}
			}
			if (this.headersParsed) {
				this.headerChunks.push(data.slice(0, headerPos));
				this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
				this.headerChunks = null;
				this.emit("headers", this.parseHeaders());
				if (data.length - 1 > headerPos) {
					let chunk = data.slice(headerPos);
					this.bodySize += chunk.length;
					setImmediate(() => this.push(chunk));
				}
				return false;
			} else {
				this.headerBytes += data.length;
				this.headerChunks.push(data);
			}
			this.updateLastBytes(data);
			return false;
		}
		_transform(chunk, encoding, callback) {
			if (!chunk || !chunk.length) return callback();
			if (typeof chunk === "string") chunk = Buffer.from(chunk, encoding);
			let headersFound;
			try {
				headersFound = this.checkHeaders(chunk);
			} catch (E) {
				return callback(E);
			}
			if (headersFound) {
				this.bodySize += chunk.length;
				this.push(chunk);
			}
			setImmediate(callback);
		}
		_flush(callback) {
			if (this.headerChunks) {
				let chunk = Buffer.concat(this.headerChunks, this.headerBytes);
				this.bodySize += chunk.length;
				this.push(chunk);
				this.headerChunks = null;
			}
			callback();
		}
		parseHeaders() {
			let lines = (this.rawHeaders || "").toString().split(/\r?\n/);
			for (let i = lines.length - 1; i > 0; i--) if (/^\s/.test(lines[i])) {
				lines[i - 1] += "\n" + lines[i];
				lines.splice(i, 1);
			}
			return lines.filter((line) => line.trim()).map((line) => ({
				key: line.substr(0, line.indexOf(":")).trim().toLowerCase(),
				line
			}));
		}
	};
	module.exports = MessageParser$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/dkim/relaxed-body.js
var require_relaxed_body = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform$1 = __require("stream").Transform;
	const crypto$6 = __require("crypto");
	var RelaxedBody$1 = class extends Transform$1 {
		constructor(options) {
			super();
			options = options || {};
			this.chunkBuffer = [];
			this.chunkBufferLen = 0;
			this.bodyHash = crypto$6.createHash(options.hashAlgo || "sha1");
			this.remainder = "";
			this.byteLength = 0;
			this.debug = options.debug;
			this._debugBody = options.debug ? [] : false;
		}
		updateHash(chunk) {
			let bodyStr;
			let nextRemainder = "";
			let state = "file";
			for (let i = chunk.length - 1; i >= 0; i--) {
				let c = chunk[i];
				if (state === "file" && (c === 10 || c === 13)) {} else if (state === "file" && (c === 9 || c === 32)) state = "line";
				else if (state === "line" && (c === 9 || c === 32)) {} else if (state === "file" || state === "line") {
					state = "body";
					if (i === chunk.length - 1) break;
				}
				if (i === 0) {
					if (state === "file" && (!this.remainder || /[\r\n]$/.test(this.remainder)) || state === "line" && (!this.remainder || /[ \t]$/.test(this.remainder))) {
						this.remainder += chunk.toString("binary");
						return;
					} else if (state === "line" || state === "file") {
						nextRemainder = chunk.toString("binary");
						chunk = false;
						break;
					}
				}
				if (state !== "body") continue;
				nextRemainder = chunk.slice(i + 1).toString("binary");
				chunk = chunk.slice(0, i + 1);
				break;
			}
			let needsFixing = !!this.remainder;
			if (chunk && !needsFixing) {
				for (let i = 0, len = chunk.length; i < len; i++) if (i && chunk[i] === 10 && chunk[i - 1] !== 13) {
					needsFixing = true;
					break;
				} else if (i && chunk[i] === 13 && chunk[i - 1] === 32) {
					needsFixing = true;
					break;
				} else if (i && chunk[i] === 32 && chunk[i - 1] === 32) {
					needsFixing = true;
					break;
				} else if (chunk[i] === 9) {
					needsFixing = true;
					break;
				}
			}
			if (needsFixing) {
				bodyStr = this.remainder + (chunk ? chunk.toString("binary") : "");
				this.remainder = nextRemainder;
				bodyStr = bodyStr.replace(/\r?\n/g, "\n").replace(/[ \t]*$/gm, "").replace(/[ \t]+/gm, " ").replace(/\n/g, "\r\n");
				chunk = Buffer.from(bodyStr, "binary");
			} else if (nextRemainder) this.remainder = nextRemainder;
			if (this.debug) this._debugBody.push(chunk);
			this.bodyHash.update(chunk);
		}
		_transform(chunk, encoding, callback) {
			if (!chunk || !chunk.length) return callback();
			if (typeof chunk === "string") chunk = Buffer.from(chunk, encoding);
			this.updateHash(chunk);
			this.byteLength += chunk.length;
			this.push(chunk);
			callback();
		}
		_flush(callback) {
			if (/[\r\n]$/.test(this.remainder) && this.byteLength > 2) this.bodyHash.update(Buffer.from("\r\n"));
			if (!this.byteLength) this.push(Buffer.from("\r\n"));
			this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : false);
			callback();
		}
	};
	module.exports = RelaxedBody$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/dkim/sign.js
var require_sign = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const punycode = require_punycode();
	const mimeFuncs$1 = require_mime_funcs();
	const crypto$5 = __require("crypto");
	/**
	* Returns DKIM signature header line
	*
	* @param {Object} headers Parsed headers object from MessageParser
	* @param {String} bodyHash Base64 encoded hash of the message
	* @param {Object} options DKIM options
	* @param {String} options.domainName Domain name to be signed for
	* @param {String} options.keySelector DKIM key selector to use
	* @param {String} options.privateKey DKIM private key to use
	* @return {String} Complete header line
	*/
	module.exports = (headers, hashAlgo, bodyHash, options) => {
		options = options || {};
		let canonicalizedHeaderData = relaxedHeaders(headers, options.headerFieldNames || "From:Sender:Reply-To:Subject:Date:Message-ID:To:Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:Content-Description:Resent-Date:Resent-From:Resent-Sender:Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:List-Owner:List-Archive", options.skipFields);
		let dkimHeader = generateDKIMHeader(options.domainName, options.keySelector, canonicalizedHeaderData.fieldNames, hashAlgo, bodyHash);
		let signer, signature;
		canonicalizedHeaderData.headers += "dkim-signature:" + relaxedHeaderLine(dkimHeader);
		signer = crypto$5.createSign(("rsa-" + hashAlgo).toUpperCase());
		signer.update(canonicalizedHeaderData.headers);
		try {
			signature = signer.sign(options.privateKey, "base64");
		} catch (_E) {
			return false;
		}
		return dkimHeader + signature.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, "$&\r\n ").trim();
	};
	module.exports.relaxedHeaders = relaxedHeaders;
	function generateDKIMHeader(domainName, keySelector, fieldNames$1, hashAlgo, bodyHash) {
		let dkim = [
			"v=1",
			"a=rsa-" + hashAlgo,
			"c=relaxed/relaxed",
			"d=" + punycode.toASCII(domainName),
			"q=dns/txt",
			"s=" + keySelector,
			"bh=" + bodyHash,
			"h=" + fieldNames$1
		].join("; ");
		return mimeFuncs$1.foldLines("DKIM-Signature: " + dkim, 76) + ";\r\n b=";
	}
	function relaxedHeaders(headers, fieldNames$1, skipFields) {
		let includedFields = /* @__PURE__ */ new Set();
		let skip = /* @__PURE__ */ new Set();
		let headerFields = /* @__PURE__ */ new Map();
		(skipFields || "").toLowerCase().split(":").forEach((field) => {
			skip.add(field.trim());
		});
		(fieldNames$1 || "").toLowerCase().split(":").filter((field) => !skip.has(field.trim())).forEach((field) => {
			includedFields.add(field.trim());
		});
		for (let i = headers.length - 1; i >= 0; i--) {
			let line = headers[i];
			if (includedFields.has(line.key) && !headerFields.has(line.key)) headerFields.set(line.key, relaxedHeaderLine(line.line));
		}
		let headersList = [];
		let fields = [];
		includedFields.forEach((field) => {
			if (headerFields.has(field)) {
				fields.push(field);
				headersList.push(field + ":" + headerFields.get(field));
			}
		});
		return {
			headers: headersList.join("\r\n") + "\r\n",
			fieldNames: fields.join(":")
		};
	}
	function relaxedHeaderLine(line) {
		return line.substr(line.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/\s+/g, " ").trim();
	}
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/dkim/index.js
var require_dkim = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const MessageParser = require_message_parser();
	const RelaxedBody = require_relaxed_body();
	const sign = require_sign();
	const PassThrough$1 = __require("stream").PassThrough;
	const fs = __require("fs");
	const path = __require("path");
	const crypto$4 = __require("crypto");
	const DKIM_ALGO = "sha256";
	const MAX_MESSAGE_SIZE = 2 * 1024 * 1024;
	var DKIMSigner = class {
		constructor(options, keys, input, output) {
			this.options = options || {};
			this.keys = keys;
			this.cacheTreshold = Number(this.options.cacheTreshold) || MAX_MESSAGE_SIZE;
			this.hashAlgo = this.options.hashAlgo || DKIM_ALGO;
			this.cacheDir = this.options.cacheDir || false;
			this.chunks = [];
			this.chunklen = 0;
			this.readPos = 0;
			this.cachePath = this.cacheDir ? path.join(this.cacheDir, "message." + Date.now() + "-" + crypto$4.randomBytes(14).toString("hex")) : false;
			this.cache = false;
			this.headers = false;
			this.bodyHash = false;
			this.parser = false;
			this.relaxedBody = false;
			this.input = input;
			this.output = output;
			this.output.usingCache = false;
			this.hasErrored = false;
			this.input.on("error", (err) => {
				this.hasErrored = true;
				this.cleanup();
				output.emit("error", err);
			});
		}
		cleanup() {
			if (!this.cache || !this.cachePath) return;
			fs.unlink(this.cachePath, () => false);
		}
		createReadCache() {
			this.cache = fs.createReadStream(this.cachePath);
			this.cache.once("error", (err) => {
				this.cleanup();
				this.output.emit("error", err);
			});
			this.cache.once("close", () => {
				this.cleanup();
			});
			this.cache.pipe(this.output);
		}
		sendNextChunk() {
			if (this.hasErrored) return;
			if (this.readPos >= this.chunks.length) {
				if (!this.cache) return this.output.end();
				return this.createReadCache();
			}
			let chunk = this.chunks[this.readPos++];
			if (this.output.write(chunk) === false) return this.output.once("drain", () => {
				this.sendNextChunk();
			});
			setImmediate(() => this.sendNextChunk());
		}
		sendSignedOutput() {
			let keyPos = 0;
			let signNextKey = () => {
				if (keyPos >= this.keys.length) {
					this.output.write(this.parser.rawHeaders);
					return setImmediate(() => this.sendNextChunk());
				}
				let key = this.keys[keyPos++];
				let dkimField = sign(this.headers, this.hashAlgo, this.bodyHash, {
					domainName: key.domainName,
					keySelector: key.keySelector,
					privateKey: key.privateKey,
					headerFieldNames: this.options.headerFieldNames,
					skipFields: this.options.skipFields
				});
				if (dkimField) this.output.write(Buffer.from(dkimField + "\r\n"));
				return setImmediate(signNextKey);
			};
			if (this.bodyHash && this.headers) return signNextKey();
			this.output.write(this.parser.rawHeaders);
			this.sendNextChunk();
		}
		createWriteCache() {
			this.output.usingCache = true;
			this.cache = fs.createWriteStream(this.cachePath);
			this.cache.once("error", (err) => {
				this.cleanup();
				this.relaxedBody.unpipe(this.cache);
				this.relaxedBody.on("readable", () => {
					while (this.relaxedBody.read() !== null);
				});
				this.hasErrored = true;
				this.output.emit("error", err);
			});
			this.cache.once("close", () => {
				this.sendSignedOutput();
			});
			this.relaxedBody.removeAllListeners("readable");
			this.relaxedBody.pipe(this.cache);
		}
		signStream() {
			this.parser = new MessageParser();
			this.relaxedBody = new RelaxedBody({ hashAlgo: this.hashAlgo });
			this.parser.on("headers", (value) => {
				this.headers = value;
			});
			this.relaxedBody.on("hash", (value) => {
				this.bodyHash = value;
			});
			this.relaxedBody.on("readable", () => {
				let chunk;
				if (this.cache) return;
				while ((chunk = this.relaxedBody.read()) !== null) {
					this.chunks.push(chunk);
					this.chunklen += chunk.length;
					if (this.chunklen >= this.cacheTreshold && this.cachePath) return this.createWriteCache();
				}
			});
			this.relaxedBody.on("end", () => {
				if (this.cache) return;
				this.sendSignedOutput();
			});
			this.parser.pipe(this.relaxedBody);
			setImmediate(() => this.input.pipe(this.parser));
		}
	};
	var DKIM$1 = class {
		constructor(options) {
			this.options = options || {};
			this.keys = [].concat(this.options.keys || {
				domainName: options.domainName,
				keySelector: options.keySelector,
				privateKey: options.privateKey
			});
		}
		sign(input, extraOptions) {
			let output = new PassThrough$1();
			let inputStream = input;
			let writeValue = false;
			if (Buffer.isBuffer(input)) {
				writeValue = input;
				inputStream = new PassThrough$1();
			} else if (typeof input === "string") {
				writeValue = Buffer.from(input);
				inputStream = new PassThrough$1();
			}
			let options = this.options;
			if (extraOptions && Object.keys(extraOptions).length) {
				options = {};
				Object.keys(this.options || {}).forEach((key) => {
					options[key] = this.options[key];
				});
				Object.keys(extraOptions || {}).forEach((key) => {
					if (!(key in options)) options[key] = extraOptions[key];
				});
			}
			let signer = new DKIMSigner(options, this.keys, inputStream, output);
			setImmediate(() => {
				signer.signStream();
				if (writeValue) setImmediate(() => {
					inputStream.end(writeValue);
				});
			});
			return output;
		}
	};
	module.exports = DKIM$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/smtp-connection/http-proxy-client.js
var require_http_proxy_client = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Minimal HTTP/S proxy client
	*/
	const net$2 = __require("net");
	const tls$1 = __require("tls");
	const urllib$1 = __require("url");
	/**
	* Establishes proxied connection to destinationPort
	*
	* httpProxyClient("http://localhost:3128/", 80, "google.com", function(err, socket){
	*     socket.write("GET / HTTP/1.0\r\n\r\n");
	* });
	*
	* @param {String} proxyUrl proxy configuration, etg "http://proxy.host:3128/"
	* @param {Number} destinationPort Port to open in destination host
	* @param {String} destinationHost Destination hostname
	* @param {Function} callback Callback to run with the rocket object once connection is established
	*/
	function httpProxyClient$1(proxyUrl, destinationPort, destinationHost, callback) {
		let proxy = urllib$1.parse(proxyUrl);
		let options;
		let connect;
		let socket;
		options = {
			host: proxy.hostname,
			port: Number(proxy.port) ? Number(proxy.port) : proxy.protocol === "https:" ? 443 : 80
		};
		if (proxy.protocol === "https:") {
			options.rejectUnauthorized = false;
			connect = tls$1.connect.bind(tls$1);
		} else connect = net$2.connect.bind(net$2);
		let finished = false;
		let tempSocketErr = (err) => {
			if (finished) return;
			finished = true;
			try {
				socket.destroy();
			} catch (_E) {}
			callback(err);
		};
		let timeoutErr = () => {
			let err = /* @__PURE__ */ new Error("Proxy socket timed out");
			err.code = "ETIMEDOUT";
			tempSocketErr(err);
		};
		socket = connect(options, () => {
			if (finished) return;
			let reqHeaders = {
				Host: destinationHost + ":" + destinationPort,
				Connection: "close"
			};
			if (proxy.auth) reqHeaders["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");
			socket.write("CONNECT " + destinationHost + ":" + destinationPort + " HTTP/1.1\r\n" + Object.keys(reqHeaders).map((key) => key + ": " + reqHeaders[key]).join("\r\n") + "\r\n\r\n");
			let headers = "";
			let onSocketData = (chunk) => {
				let match;
				let remainder;
				if (finished) return;
				headers += chunk.toString("binary");
				if (match = headers.match(/\r\n\r\n/)) {
					socket.removeListener("data", onSocketData);
					remainder = headers.substr(match.index + match[0].length);
					headers = headers.substr(0, match.index);
					if (remainder) socket.unshift(Buffer.from(remainder, "binary"));
					finished = true;
					match = headers.match(/^HTTP\/\d+\.\d+ (\d+)/i);
					if (!match || (match[1] || "").charAt(0) !== "2") {
						try {
							socket.destroy();
						} catch (_E) {}
						return callback(/* @__PURE__ */ new Error("Invalid response from proxy" + (match && ": " + match[1] || "")));
					}
					socket.removeListener("error", tempSocketErr);
					socket.removeListener("timeout", timeoutErr);
					socket.setTimeout(0);
					return callback(null, socket);
				}
			};
			socket.on("data", onSocketData);
		});
		socket.setTimeout(httpProxyClient$1.timeout || 30 * 1e3);
		socket.on("timeout", timeoutErr);
		socket.once("error", tempSocketErr);
	}
	module.exports = httpProxyClient$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mailer/mail-message.js
var require_mail_message = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const shared$10 = require_shared();
	const MimeNode$1 = require_mime_node();
	const mimeFuncs = require_mime_funcs();
	var MailMessage$1 = class {
		constructor(mailer, data) {
			this.mailer = mailer;
			this.data = {};
			this.message = null;
			data = data || {};
			let options = mailer.options || {};
			let defaults$5 = mailer._defaults || {};
			Object.keys(data).forEach((key) => {
				this.data[key] = data[key];
			});
			this.data.headers = this.data.headers || {};
			Object.keys(defaults$5).forEach((key) => {
				if (!(key in this.data)) this.data[key] = defaults$5[key];
				else if (key === "headers") Object.keys(defaults$5.headers).forEach((key$1) => {
					if (!(key$1 in this.data.headers)) this.data.headers[key$1] = defaults$5.headers[key$1];
				});
			});
			[
				"disableFileAccess",
				"disableUrlAccess",
				"normalizeHeaderKey"
			].forEach((key) => {
				if (key in options) this.data[key] = options[key];
			});
		}
		resolveContent(...args) {
			return shared$10.resolveContent(...args);
		}
		resolveAll(callback) {
			let keys = [
				[this.data, "html"],
				[this.data, "text"],
				[this.data, "watchHtml"],
				[this.data, "amp"],
				[this.data, "icalEvent"]
			];
			if (this.data.alternatives && this.data.alternatives.length) this.data.alternatives.forEach((alternative, i) => {
				keys.push([this.data.alternatives, i]);
			});
			if (this.data.attachments && this.data.attachments.length) this.data.attachments.forEach((attachment, i) => {
				if (!attachment.filename) {
					attachment.filename = (attachment.path || attachment.href || "").split("/").pop().split("?").shift() || "attachment-" + (i + 1);
					if (attachment.filename.indexOf(".") < 0) attachment.filename += "." + mimeFuncs.detectExtension(attachment.contentType);
				}
				if (!attachment.contentType) attachment.contentType = mimeFuncs.detectMimeType(attachment.filename || attachment.path || attachment.href || "bin");
				keys.push([this.data.attachments, i]);
			});
			let mimeNode = new MimeNode$1();
			[
				"from",
				"to",
				"cc",
				"bcc",
				"sender",
				"replyTo"
			].forEach((address) => {
				let value;
				if (this.message) value = [].concat(mimeNode._parseAddresses(this.message.getHeader(address === "replyTo" ? "reply-to" : address)) || []);
				else if (this.data[address]) value = [].concat(mimeNode._parseAddresses(this.data[address]) || []);
				if (value && value.length) this.data[address] = value;
				else if (address in this.data) this.data[address] = null;
			});
			["from", "sender"].forEach((address) => {
				if (this.data[address]) this.data[address] = this.data[address].shift();
			});
			let pos = 0;
			let resolveNext = () => {
				if (pos >= keys.length) return callback(null, this.data);
				let args = keys[pos++];
				if (!args[0] || !args[0][args[1]]) return resolveNext();
				shared$10.resolveContent(...args, (err, value) => {
					if (err) return callback(err);
					let node = { content: value };
					if (args[0][args[1]] && typeof args[0][args[1]] === "object" && !Buffer.isBuffer(args[0][args[1]])) Object.keys(args[0][args[1]]).forEach((key) => {
						if (!(key in node) && ![
							"content",
							"path",
							"href",
							"raw"
						].includes(key)) node[key] = args[0][args[1]][key];
					});
					args[0][args[1]] = node;
					resolveNext();
				});
			};
			setImmediate(() => resolveNext());
		}
		normalize(callback) {
			let envelope = this.data.envelope || this.message.getEnvelope();
			let messageId = this.message.messageId();
			this.resolveAll((err, data) => {
				if (err) return callback(err);
				data.envelope = envelope;
				data.messageId = messageId;
				[
					"html",
					"text",
					"watchHtml",
					"amp"
				].forEach((key) => {
					if (data[key] && data[key].content) {
						if (typeof data[key].content === "string") data[key] = data[key].content;
						else if (Buffer.isBuffer(data[key].content)) data[key] = data[key].content.toString();
					}
				});
				if (data.icalEvent && Buffer.isBuffer(data.icalEvent.content)) {
					data.icalEvent.content = data.icalEvent.content.toString("base64");
					data.icalEvent.encoding = "base64";
				}
				if (data.alternatives && data.alternatives.length) data.alternatives.forEach((alternative) => {
					if (alternative && alternative.content && Buffer.isBuffer(alternative.content)) {
						alternative.content = alternative.content.toString("base64");
						alternative.encoding = "base64";
					}
				});
				if (data.attachments && data.attachments.length) data.attachments.forEach((attachment) => {
					if (attachment && attachment.content && Buffer.isBuffer(attachment.content)) {
						attachment.content = attachment.content.toString("base64");
						attachment.encoding = "base64";
					}
				});
				data.normalizedHeaders = {};
				Object.keys(data.headers || {}).forEach((key) => {
					let value = [].concat(data.headers[key] || []).shift();
					value = value && value.value || value;
					if (value) {
						if ([
							"references",
							"in-reply-to",
							"message-id",
							"content-id"
						].includes(key)) value = this.message._encodeHeaderValue(key, value);
						data.normalizedHeaders[key] = value;
					}
				});
				if (data.list && typeof data.list === "object") this._getListHeaders(data.list).forEach((entry) => {
					data.normalizedHeaders[entry.key] = entry.value.map((val$1) => val$1 && val$1.value || val$1).join(", ");
				});
				if (data.references) data.normalizedHeaders.references = this.message._encodeHeaderValue("references", data.references);
				if (data.inReplyTo) data.normalizedHeaders["in-reply-to"] = this.message._encodeHeaderValue("in-reply-to", data.inReplyTo);
				return callback(null, data);
			});
		}
		setMailerHeader() {
			if (!this.message || !this.data.xMailer) return;
			this.message.setHeader("X-Mailer", this.data.xMailer);
		}
		setPriorityHeaders() {
			if (!this.message || !this.data.priority) return;
			switch ((this.data.priority || "").toString().toLowerCase()) {
				case "high":
					this.message.setHeader("X-Priority", "1 (Highest)");
					this.message.setHeader("X-MSMail-Priority", "High");
					this.message.setHeader("Importance", "High");
					break;
				case "low":
					this.message.setHeader("X-Priority", "5 (Lowest)");
					this.message.setHeader("X-MSMail-Priority", "Low");
					this.message.setHeader("Importance", "Low");
					break;
				default:
			}
		}
		setListHeaders() {
			if (!this.message || !this.data.list || typeof this.data.list !== "object") return;
			if (this.data.list && typeof this.data.list === "object") this._getListHeaders(this.data.list).forEach((listHeader) => {
				listHeader.value.forEach((value) => {
					this.message.addHeader(listHeader.key, value);
				});
			});
		}
		_getListHeaders(listData) {
			return Object.keys(listData).map((key) => ({
				key: "list-" + key.toLowerCase().trim(),
				value: [].concat(listData[key] || []).map((value) => ({
					prepared: true,
					foldLines: true,
					value: [].concat(value || []).map((value$1) => {
						if (typeof value$1 === "string") value$1 = { url: value$1 };
						if (value$1 && value$1.url) {
							if (key.toLowerCase().trim() === "id") {
								let comment$1 = value$1.comment || "";
								if (mimeFuncs.isPlainText(comment$1)) comment$1 = "\"" + comment$1 + "\"";
								else comment$1 = mimeFuncs.encodeWord(comment$1);
								return (value$1.comment ? comment$1 + " " : "") + this._formatListUrl(value$1.url).replace(/^<[^:]+\/{,2}/, "");
							}
							let comment = value$1.comment || "";
							if (!mimeFuncs.isPlainText(comment)) comment = mimeFuncs.encodeWord(comment);
							return this._formatListUrl(value$1.url) + (value$1.comment ? " (" + comment + ")" : "");
						}
						return "";
					}).filter((value$1) => value$1).join(", ")
				}))
			}));
		}
		_formatListUrl(url) {
			url = url.replace(/[\s<]+|[\s>]+/g, "");
			if (/^(https?|mailto|ftp):/.test(url)) return "<" + url + ">";
			if (/^[^@]+@[^@]+$/.test(url)) return "<mailto:" + url + ">";
			return "<http://" + url + ">";
		}
	};
	module.exports = MailMessage$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/mailer/index.js
var require_mailer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$5 = __require("events");
	const shared$9 = require_shared();
	const mimeTypes = require_mime_types();
	const MailComposer = require_mail_composer();
	const DKIM = require_dkim();
	const httpProxyClient = require_http_proxy_client();
	const util = __require("util");
	const urllib = __require("url");
	const packageData$7 = require_package();
	const MailMessage = require_mail_message();
	const net$1 = __require("net");
	const dns = __require("dns");
	const crypto$3 = __require("crypto");
	/**
	* Creates an object for exposing the Mail API
	*
	* @constructor
	* @param {Object} transporter Transport object instance to pass the mails to
	*/
	var Mail = class extends EventEmitter$5 {
		constructor(transporter$1, options, defaults$5) {
			super();
			this.options = options || {};
			this._defaults = defaults$5 || {};
			this._defaultPlugins = {
				compile: [(...args) => this._convertDataImages(...args)],
				stream: []
			};
			this._userPlugins = {
				compile: [],
				stream: []
			};
			this.meta = /* @__PURE__ */ new Map();
			this.dkim = this.options.dkim ? new DKIM(this.options.dkim) : false;
			this.transporter = transporter$1;
			this.transporter.mailer = this;
			this.logger = shared$9.getLogger(this.options, { component: this.options.component || "mail" });
			this.logger.debug({ tnx: "create" }, "Creating transport: %s", this.getVersionString());
			if (typeof this.transporter.on === "function") {
				this.transporter.on("log", (log) => {
					this.logger.debug({ tnx: "transport" }, "%s: %s", log.type, log.message);
				});
				this.transporter.on("error", (err) => {
					this.logger.error({
						err,
						tnx: "transport"
					}, "Transport Error: %s", err.message);
					this.emit("error", err);
				});
				this.transporter.on("idle", (...args) => {
					this.emit("idle", ...args);
				});
				this.transporter.on("clear", (...args) => {
					this.emit("clear", ...args);
				});
			}
			/**
			* Optional methods passed to the underlying transport object
			*/
			[
				"close",
				"isIdle",
				"verify"
			].forEach((method) => {
				this[method] = (...args) => {
					if (typeof this.transporter[method] === "function") {
						if (method === "verify" && typeof this.getSocket === "function") {
							this.transporter.getSocket = this.getSocket;
							this.getSocket = false;
						}
						return this.transporter[method](...args);
					} else {
						this.logger.warn({
							tnx: "transport",
							methodName: method
						}, "Non existing method %s called for transport", method);
						return false;
					}
				};
			});
			if (this.options.proxy && typeof this.options.proxy === "string") this.setupProxy(this.options.proxy);
		}
		use(step, plugin) {
			step = (step || "").toString();
			if (!this._userPlugins.hasOwnProperty(step)) this._userPlugins[step] = [plugin];
			else this._userPlugins[step].push(plugin);
			return this;
		}
		/**
		* Sends an email using the preselected transport object
		*
		* @param {Object} data E-data description
		* @param {Function?} callback Callback to run once the sending succeeded or failed
		*/
		sendMail(data, callback = null) {
			let promise;
			if (!callback) promise = new Promise((resolve$1, reject) => {
				callback = shared$9.callbackPromise(resolve$1, reject);
			});
			if (typeof this.getSocket === "function") {
				this.transporter.getSocket = this.getSocket;
				this.getSocket = false;
			}
			let mail = new MailMessage(this, data);
			this.logger.debug({
				tnx: "transport",
				name: this.transporter.name,
				version: this.transporter.version,
				action: "send"
			}, "Sending mail using %s/%s", this.transporter.name, this.transporter.version);
			this._processPlugins("compile", mail, (err) => {
				if (err) {
					this.logger.error({
						err,
						tnx: "plugin",
						action: "compile"
					}, "PluginCompile Error: %s", err.message);
					return callback(err);
				}
				mail.message = new MailComposer(mail.data).compile();
				mail.setMailerHeader();
				mail.setPriorityHeaders();
				mail.setListHeaders();
				this._processPlugins("stream", mail, (err$1) => {
					if (err$1) {
						this.logger.error({
							err: err$1,
							tnx: "plugin",
							action: "stream"
						}, "PluginStream Error: %s", err$1.message);
						return callback(err$1);
					}
					if (mail.data.dkim || this.dkim) mail.message.processFunc((input) => {
						let dkim = mail.data.dkim ? new DKIM(mail.data.dkim) : this.dkim;
						this.logger.debug({
							tnx: "DKIM",
							messageId: mail.message.messageId(),
							dkimDomains: dkim.keys.map((key) => key.keySelector + "." + key.domainName).join(", ")
						}, "Signing outgoing message with %s keys", dkim.keys.length);
						return dkim.sign(input, mail.data._dkim);
					});
					this.transporter.send(mail, (...args) => {
						if (args[0]) this.logger.error({
							err: args[0],
							tnx: "transport",
							action: "send"
						}, "Send Error: %s", args[0].message);
						callback(...args);
					});
				});
			});
			return promise;
		}
		getVersionString() {
			return util.format("%s (%s; +%s; %s/%s)", packageData$7.name, packageData$7.version, packageData$7.homepage, this.transporter.name, this.transporter.version);
		}
		_processPlugins(step, mail, callback) {
			step = (step || "").toString();
			if (!this._userPlugins.hasOwnProperty(step)) return callback();
			let userPlugins = this._userPlugins[step] || [];
			let defaultPlugins = this._defaultPlugins[step] || [];
			if (userPlugins.length) this.logger.debug({
				tnx: "transaction",
				pluginCount: userPlugins.length,
				step
			}, "Using %s plugins for %s", userPlugins.length, step);
			if (userPlugins.length + defaultPlugins.length === 0) return callback();
			let pos = 0;
			let block = "default";
			let processPlugins = () => {
				let curplugins = block === "default" ? defaultPlugins : userPlugins;
				if (pos >= curplugins.length) if (block === "default" && userPlugins.length) {
					block = "user";
					pos = 0;
					curplugins = userPlugins;
				} else return callback();
				let plugin = curplugins[pos++];
				plugin(mail, (err) => {
					if (err) return callback(err);
					processPlugins();
				});
			};
			processPlugins();
		}
		/**
		* Sets up proxy handler for a Nodemailer object
		*
		* @param {String} proxyUrl Proxy configuration url
		*/
		setupProxy(proxyUrl) {
			let proxy = urllib.parse(proxyUrl);
			this.getSocket = (options, callback) => {
				let protocol = proxy.protocol.replace(/:$/, "").toLowerCase();
				if (this.meta.has("proxy_handler_" + protocol)) return this.meta.get("proxy_handler_" + protocol)(proxy, options, callback);
				switch (protocol) {
					case "http":
					case "https":
						httpProxyClient(proxy.href, options.port, options.host, (err, socket) => {
							if (err) return callback(err);
							return callback(null, { connection: socket });
						});
						return;
					case "socks":
					case "socks5":
					case "socks4":
					case "socks4a": {
						if (!this.meta.has("proxy_socks_module")) return callback(/* @__PURE__ */ new Error("Socks module not loaded"));
						let connect = (ipaddress) => {
							let proxyV2 = !!this.meta.get("proxy_socks_module").SocksClient;
							let socksClient = proxyV2 ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module");
							let proxyType = Number(proxy.protocol.replace(/\D/g, "")) || 5;
							let connectionOpts = {
								proxy: {
									ipaddress,
									port: Number(proxy.port),
									type: proxyType
								},
								[proxyV2 ? "destination" : "target"]: {
									host: options.host,
									port: options.port
								},
								command: "connect"
							};
							if (proxy.auth) {
								let username = decodeURIComponent(proxy.auth.split(":").shift());
								let password$1 = decodeURIComponent(proxy.auth.split(":").pop());
								if (proxyV2) {
									connectionOpts.proxy.userId = username;
									connectionOpts.proxy.password = password$1;
								} else if (proxyType === 4) connectionOpts.userid = username;
								else connectionOpts.authentication = {
									username,
									password: password$1
								};
							}
							socksClient.createConnection(connectionOpts, (err, info) => {
								if (err) return callback(err);
								return callback(null, { connection: info.socket || info });
							});
						};
						if (net$1.isIP(proxy.hostname)) return connect(proxy.hostname);
						return dns.resolve(proxy.hostname, (err, address) => {
							if (err) return callback(err);
							connect(Array.isArray(address) ? address[0] : address);
						});
					}
				}
				callback(/* @__PURE__ */ new Error("Unknown proxy configuration"));
			};
		}
		_convertDataImages(mail, callback) {
			if (!this.options.attachDataUrls && !mail.data.attachDataUrls || !mail.data.html) return callback();
			mail.resolveContent(mail.data, "html", (err, html) => {
				if (err) return callback(err);
				let cidCounter = 0;
				html = (html || "").toString().replace(/(<img\b[^<>]{0,1024} src\s{0,20}=[\s"']{0,20})(data:([^;]+);[^"'>\s]+)/gi, (match, prefix, dataUri, mimeType) => {
					let cid = crypto$3.randomBytes(10).toString("hex") + "@localhost";
					if (!mail.data.attachments) mail.data.attachments = [];
					if (!Array.isArray(mail.data.attachments)) mail.data.attachments = [].concat(mail.data.attachments || []);
					mail.data.attachments.push({
						path: dataUri,
						cid,
						filename: "image-" + ++cidCounter + "." + mimeTypes.detectExtension(mimeType)
					});
					return prefix + "cid:" + cid;
				});
				mail.data.html = html;
				callback();
			});
		}
		set(key, value) {
			return this.meta.set(key, value);
		}
		get(key) {
			return this.meta.get(key);
		}
	};
	module.exports = Mail;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/smtp-connection/data-stream.js
var require_data_stream = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Transform = __require("stream").Transform;
	/**
	* Escapes dots in the beginning of lines. Ends the stream with <CR><LF>.<CR><LF>
	* Also makes sure that only <CR><LF> sequences are used for linebreaks
	*
	* @param {Object} options Stream options
	*/
	var DataStream$1 = class extends Transform {
		constructor(options) {
			super(options);
			this.options = options || {};
			this._curLine = "";
			this.inByteCount = 0;
			this.outByteCount = 0;
			this.lastByte = false;
		}
		/**
		* Escapes dots
		*/
		_transform(chunk, encoding, done) {
			let chunks = [];
			let chunklen = 0;
			let i, len, lastPos = 0;
			let buf;
			if (!chunk || !chunk.length) return done();
			if (typeof chunk === "string") chunk = Buffer.from(chunk);
			this.inByteCount += chunk.length;
			for (i = 0, len = chunk.length; i < len; i++) if (chunk[i] === 46) {
				if (i && chunk[i - 1] === 10 || !i && (!this.lastByte || this.lastByte === 10)) {
					buf = chunk.slice(lastPos, i + 1);
					chunks.push(buf);
					chunks.push(Buffer.from("."));
					chunklen += buf.length + 1;
					lastPos = i + 1;
				}
			} else if (chunk[i] === 10) {
				if (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) {
					if (i > lastPos) {
						buf = chunk.slice(lastPos, i);
						chunks.push(buf);
						chunklen += buf.length + 2;
					} else chunklen += 2;
					chunks.push(Buffer.from("\r\n"));
					lastPos = i + 1;
				}
			}
			if (chunklen) {
				if (lastPos < chunk.length) {
					buf = chunk.slice(lastPos);
					chunks.push(buf);
					chunklen += buf.length;
				}
				this.outByteCount += chunklen;
				this.push(Buffer.concat(chunks, chunklen));
			} else {
				this.outByteCount += chunk.length;
				this.push(chunk);
			}
			this.lastByte = chunk[chunk.length - 1];
			done();
		}
		/**
		* Finalizes the stream with a dot on a single line
		*/
		_flush(done) {
			let buf;
			if (this.lastByte === 10) buf = Buffer.from(".\r\n");
			else if (this.lastByte === 13) buf = Buffer.from("\n.\r\n");
			else buf = Buffer.from("\r\n.\r\n");
			this.outByteCount += buf.length;
			this.push(buf);
			done();
		}
	};
	module.exports = DataStream$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/smtp-connection/index.js
var require_smtp_connection = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const packageInfo = require_package();
	const EventEmitter$4 = __require("events").EventEmitter;
	const net = __require("net");
	const tls = __require("tls");
	const os = __require("os");
	const crypto$2 = __require("crypto");
	const DataStream = require_data_stream();
	const PassThrough = __require("stream").PassThrough;
	const shared$8 = require_shared();
	const CONNECTION_TIMEOUT = 120 * 1e3;
	const SOCKET_TIMEOUT = 600 * 1e3;
	const GREETING_TIMEOUT = 30 * 1e3;
	const DNS_TIMEOUT = 30 * 1e3;
	/**
	* Generates a SMTP connection object
	*
	* Optional options object takes the following possible properties:
	*
	*  * **port** - is the port to connect to (defaults to 587 or 465)
	*  * **host** - is the hostname or IP address to connect to (defaults to 'localhost')
	*  * **secure** - use SSL
	*  * **ignoreTLS** - ignore server support for STARTTLS
	*  * **requireTLS** - forces the client to use STARTTLS
	*  * **name** - the name of the client server
	*  * **localAddress** - outbound address to bind to (see: http://nodejs.org/api/net.html#net_net_connect_options_connectionlistener)
	*  * **greetingTimeout** - Time to wait in ms until greeting message is received from the server (defaults to 10000)
	*  * **connectionTimeout** - how many milliseconds to wait for the connection to establish
	*  * **socketTimeout** - Time of inactivity until the connection is closed (defaults to 1 hour)
	*  * **dnsTimeout** - Time to wait in ms for the DNS requests to be resolved (defaults to 30 seconds)
	*  * **lmtp** - if true, uses LMTP instead of SMTP protocol
	*  * **logger** - bunyan compatible logger interface
	*  * **debug** - if true pass SMTP traffic to the logger
	*  * **tls** - options for createCredentials
	*  * **socket** - existing socket to use instead of creating a new one (see: http://nodejs.org/api/net.html#net_class_net_socket)
	*  * **secured** - boolean indicates that the provided socket has already been upgraded to tls
	*
	* @constructor
	* @namespace SMTP Client module
	* @param {Object} [options] Option properties
	*/
	var SMTPConnection$3 = class extends EventEmitter$4 {
		constructor(options) {
			super(options);
			this.id = crypto$2.randomBytes(8).toString("base64").replace(/\W/g, "");
			this.stage = "init";
			this.options = options || {};
			this.secureConnection = !!this.options.secure;
			this.alreadySecured = !!this.options.secured;
			this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587);
			this.host = this.options.host || "localhost";
			this.servername = this.options.servername ? this.options.servername : !net.isIP(this.host) ? this.host : false;
			this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || false;
			if (typeof this.options.secure === "undefined" && this.port === 465) this.secureConnection = true;
			this.name = this.options.name || this._getHostname();
			this.logger = shared$8.getLogger(this.options, {
				component: this.options.component || "smtp-connection",
				sid: this.id
			});
			this.customAuth = /* @__PURE__ */ new Map();
			Object.keys(this.options.customAuth || {}).forEach((key) => {
				let mapKey = (key || "").toString().trim().toUpperCase();
				if (!mapKey) return;
				this.customAuth.set(mapKey, this.options.customAuth[key]);
			});
			/**
			* Expose version nr, just for the reference
			* @type {String}
			*/
			this.version = packageInfo.version;
			/**
			* If true, then the user is authenticated
			* @type {Boolean}
			*/
			this.authenticated = false;
			/**
			* If set to true, this instance is no longer active
			* @private
			*/
			this.destroyed = false;
			/**
			* Defines if the current connection is secure or not. If not,
			* STARTTLS can be used if available
			* @private
			*/
			this.secure = !!this.secureConnection;
			/**
			* Store incomplete messages coming from the server
			* @private
			*/
			this._remainder = "";
			/**
			* Unprocessed responses from the server
			* @type {Array}
			*/
			this._responseQueue = [];
			this.lastServerResponse = false;
			/**
			* The socket connecting to the server
			* @public
			*/
			this._socket = false;
			/**
			* Lists supported auth mechanisms
			* @private
			*/
			this._supportedAuth = [];
			/**
			* Set to true, if EHLO response includes "AUTH".
			* If false then authentication is not tried
			*/
			this.allowsAuth = false;
			/**
			* Includes current envelope (from, to)
			* @private
			*/
			this._envelope = false;
			/**
			* Lists supported extensions
			* @private
			*/
			this._supportedExtensions = [];
			/**
			* Defines the maximum allowed size for a single message
			* @private
			*/
			this._maxAllowedSize = 0;
			/**
			* Function queue to run if a data chunk comes from the server
			* @private
			*/
			this._responseActions = [];
			this._recipientQueue = [];
			/**
			* Timeout variable for waiting the greeting
			* @private
			*/
			this._greetingTimeout = false;
			/**
			* Timeout variable for waiting the connection to start
			* @private
			*/
			this._connectionTimeout = false;
			/**
			* If the socket is deemed already closed
			* @private
			*/
			this._destroyed = false;
			/**
			* If the socket is already being closed
			* @private
			*/
			this._closing = false;
			/**
			* Callbacks for socket's listeners
			*/
			this._onSocketData = (chunk) => this._onData(chunk);
			this._onSocketError = (error$1) => this._onError(error$1, "ESOCKET", false, "CONN");
			this._onSocketClose = () => this._onClose();
			this._onSocketEnd = () => this._onEnd();
			this._onSocketTimeout = () => this._onTimeout();
		}
		/**
		* Creates a connection to a SMTP server and sets up connection
		* listener
		*/
		connect(connectCallback) {
			if (typeof connectCallback === "function") {
				this.once("connect", () => {
					this.logger.debug({ tnx: "smtp" }, "SMTP handshake finished");
					connectCallback();
				});
				const isDestroyedMessage = this._isDestroyedMessage("connect");
				if (isDestroyedMessage) return connectCallback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "CONN"));
			}
			let opts = {
				port: this.port,
				host: this.host,
				allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
				timeout: this.options.dnsTimeout || DNS_TIMEOUT
			};
			if (this.options.localAddress) opts.localAddress = this.options.localAddress;
			let setupConnectionHandlers = () => {
				this._connectionTimeout = setTimeout(() => {
					this._onError("Connection timeout", "ETIMEDOUT", false, "CONN");
				}, this.options.connectionTimeout || CONNECTION_TIMEOUT);
				this._socket.on("error", this._onSocketError);
			};
			if (this.options.connection) {
				this._socket = this.options.connection;
				setupConnectionHandlers();
				if (this.secureConnection && !this.alreadySecured) setImmediate(() => this._upgradeConnection((err) => {
					if (err) {
						this._onError(/* @__PURE__ */ new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
						return;
					}
					this._onConnect();
				}));
				else setImmediate(() => this._onConnect());
				return;
			} else if (this.options.socket) {
				this._socket = this.options.socket;
				return shared$8.resolveHostname(opts, (err, resolved) => {
					if (err) return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
					this.logger.debug({
						tnx: "dns",
						source: opts.host,
						resolved: resolved.host,
						cached: !!resolved.cached
					}, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
					Object.keys(resolved).forEach((key) => {
						if (key.charAt(0) !== "_" && resolved[key]) opts[key] = resolved[key];
					});
					try {
						this._socket.connect(this.port, this.host, () => {
							this._socket.setKeepAlive(true);
							this._onConnect();
						});
						setupConnectionHandlers();
					} catch (E) {
						return setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
					}
				});
			} else if (this.secureConnection) {
				if (this.options.tls) Object.keys(this.options.tls).forEach((key) => {
					opts[key] = this.options.tls[key];
				});
				if (this.servername && !opts.servername) opts.servername = this.servername;
				return shared$8.resolveHostname(opts, (err, resolved) => {
					if (err) return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
					this.logger.debug({
						tnx: "dns",
						source: opts.host,
						resolved: resolved.host,
						cached: !!resolved.cached
					}, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
					Object.keys(resolved).forEach((key) => {
						if (key.charAt(0) !== "_" && resolved[key]) opts[key] = resolved[key];
					});
					try {
						this._socket = tls.connect(opts, () => {
							this._socket.setKeepAlive(true);
							this._onConnect();
						});
						setupConnectionHandlers();
					} catch (E) {
						return setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
					}
				});
			} else return shared$8.resolveHostname(opts, (err, resolved) => {
				if (err) return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
				this.logger.debug({
					tnx: "dns",
					source: opts.host,
					resolved: resolved.host,
					cached: !!resolved.cached
				}, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
				Object.keys(resolved).forEach((key) => {
					if (key.charAt(0) !== "_" && resolved[key]) opts[key] = resolved[key];
				});
				try {
					this._socket = net.connect(opts, () => {
						this._socket.setKeepAlive(true);
						this._onConnect();
					});
					setupConnectionHandlers();
				} catch (E) {
					return setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
				}
			});
		}
		/**
		* Sends QUIT
		*/
		quit() {
			this._sendCommand("QUIT");
			this._responseActions.push(this.close);
		}
		/**
		* Closes the connection to the server
		*/
		close() {
			clearTimeout(this._connectionTimeout);
			clearTimeout(this._greetingTimeout);
			this._responseActions = [];
			if (this._closing) return;
			this._closing = true;
			let closeMethod = "end";
			if (this.stage === "init") closeMethod = "destroy";
			this.logger.debug({ tnx: "smtp" }, "Closing connection to the server using \"%s\"", closeMethod);
			let socket = this._socket && this._socket.socket || this._socket;
			if (socket && !socket.destroyed) try {
				socket[closeMethod]();
			} catch (_E) {}
			this._destroy();
		}
		/**
		* Authenticate user
		*/
		login(authData, callback) {
			const isDestroyedMessage = this._isDestroyedMessage("login");
			if (isDestroyedMessage) return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
			this._auth = authData || {};
			this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || false;
			if (!this._authMethod && this._auth.oauth2 && !this._auth.credentials) this._authMethod = "XOAUTH2";
			else if (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) this._authMethod = (this._supportedAuth[0] || "PLAIN").toUpperCase().trim();
			if (this._authMethod !== "XOAUTH2" && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass)) if (this._auth.user && this._auth.pass || this.customAuth.has(this._authMethod)) this._auth.credentials = {
				user: this._auth.user,
				pass: this._auth.pass,
				options: this._auth.options
			};
			else return callback(this._formatError("Missing credentials for \"" + this._authMethod + "\"", "EAUTH", false, "API"));
			if (this.customAuth.has(this._authMethod)) {
				let handler = this.customAuth.get(this._authMethod);
				let lastResponse;
				let returned = false;
				let resolve$1 = () => {
					if (returned) return;
					returned = true;
					this.logger.info({
						tnx: "smtp",
						username: this._auth.user,
						action: "authenticated",
						method: this._authMethod
					}, "User %s authenticated", JSON.stringify(this._auth.user));
					this.authenticated = true;
					callback(null, true);
				};
				let reject = (err) => {
					if (returned) return;
					returned = true;
					callback(this._formatError(err, "EAUTH", lastResponse, "AUTH " + this._authMethod));
				};
				let handlerResponse = handler({
					auth: this._auth,
					method: this._authMethod,
					extensions: [].concat(this._supportedExtensions),
					authMethods: [].concat(this._supportedAuth),
					maxAllowedSize: this._maxAllowedSize || false,
					sendCommand: (cmd, done) => {
						let promise;
						if (!done) promise = new Promise((resolve$2, reject$1) => {
							done = shared$8.callbackPromise(resolve$2, reject$1);
						});
						this._responseActions.push((str) => {
							lastResponse = str;
							let codes = str.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/);
							let data = {
								command: cmd,
								response: str
							};
							if (codes) {
								data.status = Number(codes[1]) || 0;
								if (codes[2]) data.code = codes[2];
								data.text = str.substr(codes[0].length);
							} else {
								data.text = str;
								data.status = 0;
							}
							done(null, data);
						});
						setImmediate(() => this._sendCommand(cmd));
						return promise;
					},
					resolve: resolve$1,
					reject
				});
				if (handlerResponse && typeof handlerResponse.catch === "function") handlerResponse.then(resolve$1).catch(reject);
				return;
			}
			switch (this._authMethod) {
				case "XOAUTH2":
					this._handleXOauth2Token(false, callback);
					return;
				case "LOGIN":
					this._responseActions.push((str) => {
						this._actionAUTH_LOGIN_USER(str, callback);
					});
					this._sendCommand("AUTH LOGIN");
					return;
				case "PLAIN":
					this._responseActions.push((str) => {
						this._actionAUTHComplete(str, callback);
					});
					this._sendCommand("AUTH PLAIN " + Buffer.from("\0" + this._auth.credentials.user + "\0" + this._auth.credentials.pass, "utf-8").toString("base64"), "AUTH PLAIN " + Buffer.from("\0" + this._auth.credentials.user + "\0/* secret */", "utf-8").toString("base64"));
					return;
				case "CRAM-MD5":
					this._responseActions.push((str) => {
						this._actionAUTH_CRAM_MD5(str, callback);
					});
					this._sendCommand("AUTH CRAM-MD5");
					return;
			}
			return callback(this._formatError("Unknown authentication method \"" + this._authMethod + "\"", "EAUTH", false, "API"));
		}
		/**
		* Sends a message
		*
		* @param {Object} envelope Envelope object, {from: addr, to: [addr]}
		* @param {Object} message String, Buffer or a Stream
		* @param {Function} callback Callback to return once sending is completed
		*/
		send(envelope, message, done) {
			if (!message) return done(this._formatError("Empty message", "EMESSAGE", false, "API"));
			const isDestroyedMessage = this._isDestroyedMessage("send message");
			if (isDestroyedMessage) return done(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
			if (this._maxAllowedSize && envelope.size > this._maxAllowedSize) return setImmediate(() => {
				done(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", false, "MAIL FROM"));
			});
			let returned = false;
			let callback = function() {
				if (returned) return;
				returned = true;
				done(...arguments);
			};
			if (typeof message.on === "function") message.on("error", (err) => callback(this._formatError(err, "ESTREAM", false, "API")));
			let startTime = Date.now();
			this._setEnvelope(envelope, (err, info) => {
				if (err) {
					let stream$1 = new PassThrough();
					if (typeof message.pipe === "function") message.pipe(stream$1);
					else {
						stream$1.write(message);
						stream$1.end();
					}
					return callback(err);
				}
				let envelopeTime = Date.now();
				let stream = this._createSendStream((err$1, str) => {
					if (err$1) return callback(err$1);
					info.envelopeTime = envelopeTime - startTime;
					info.messageTime = Date.now() - envelopeTime;
					info.messageSize = stream.outByteCount;
					info.response = str;
					return callback(null, info);
				});
				if (typeof message.pipe === "function") message.pipe(stream);
				else {
					stream.write(message);
					stream.end();
				}
			});
		}
		/**
		* Resets connection state
		*
		* @param {Function} callback Callback to return once connection is reset
		*/
		reset(callback) {
			this._sendCommand("RSET");
			this._responseActions.push((str) => {
				if (str.charAt(0) !== "2") return callback(this._formatError("Could not reset session state. response=" + str, "EPROTOCOL", str, "RSET"));
				this._envelope = false;
				return callback(null, true);
			});
		}
		/**
		* Connection listener that is run when the connection to
		* the server is opened
		*
		* @event
		*/
		_onConnect() {
			clearTimeout(this._connectionTimeout);
			this.logger.info({
				tnx: "network",
				localAddress: this._socket.localAddress,
				localPort: this._socket.localPort,
				remoteAddress: this._socket.remoteAddress,
				remotePort: this._socket.remotePort
			}, "%s established to %s:%s", this.secure ? "Secure connection" : "Connection", this._socket.remoteAddress, this._socket.remotePort);
			if (this._destroyed) {
				this.close();
				return;
			}
			this.stage = "connected";
			this._socket.removeListener("data", this._onSocketData);
			this._socket.removeListener("timeout", this._onSocketTimeout);
			this._socket.removeListener("close", this._onSocketClose);
			this._socket.removeListener("end", this._onSocketEnd);
			this._socket.on("data", this._onSocketData);
			this._socket.once("close", this._onSocketClose);
			this._socket.once("end", this._onSocketEnd);
			this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
			this._socket.on("timeout", this._onSocketTimeout);
			this._greetingTimeout = setTimeout(() => {
				if (this._socket && !this._destroyed && this._responseActions[0] === this._actionGreeting) this._onError("Greeting never received", "ETIMEDOUT", false, "CONN");
			}, this.options.greetingTimeout || GREETING_TIMEOUT);
			this._responseActions.push(this._actionGreeting);
			this._socket.resume();
		}
		/**
		* 'data' listener for data coming from the server
		*
		* @event
		* @param {Buffer} chunk Data chunk coming from the server
		*/
		_onData(chunk) {
			if (this._destroyed || !chunk || !chunk.length) return;
			let data = (chunk || "").toString("binary");
			let lines = (this._remainder + data).split(/\r?\n/);
			let lastline;
			this._remainder = lines.pop();
			for (let i = 0, len = lines.length; i < len; i++) {
				if (this._responseQueue.length) {
					lastline = this._responseQueue[this._responseQueue.length - 1];
					if (/^\d+-/.test(lastline.split("\n").pop())) {
						this._responseQueue[this._responseQueue.length - 1] += "\n" + lines[i];
						continue;
					}
				}
				this._responseQueue.push(lines[i]);
			}
			if (this._responseQueue.length) {
				lastline = this._responseQueue[this._responseQueue.length - 1];
				if (/^\d+-/.test(lastline.split("\n").pop())) return;
			}
			this._processResponse();
		}
		/**
		* 'error' listener for the socket
		*
		* @event
		* @param {Error} err Error object
		* @param {String} type Error name
		*/
		_onError(err, type, data, command) {
			clearTimeout(this._connectionTimeout);
			clearTimeout(this._greetingTimeout);
			if (this._destroyed) return;
			err = this._formatError(err, type, data, command);
			if ([
				"ETIMEDOUT",
				"ESOCKET",
				"ECONNECTION"
			].includes(err.code)) this.logger.warn(data, err.message);
			else this.logger.error(data, err.message);
			this.emit("error", err);
			this.close();
		}
		_formatError(message, type, response, command) {
			let err;
			if (/Error\]$/i.test(Object.prototype.toString.call(message))) err = message;
			else err = new Error(message);
			if (type && type !== "Error") err.code = type;
			if (response) {
				err.response = response;
				err.message += ": " + response;
			}
			let responseCode = typeof response === "string" && Number((response.match(/^\d+/) || [])[0]) || false;
			if (responseCode) err.responseCode = responseCode;
			if (command) err.command = command;
			return err;
		}
		/**
		* 'close' listener for the socket
		*
		* @event
		*/
		_onClose() {
			let serverResponse = false;
			if (this._remainder && this._remainder.trim()) {
				if (this.options.debug || this.options.transactionLog) this.logger.debug({ tnx: "server" }, this._remainder.replace(/\r?\n$/, ""));
				this.lastServerResponse = serverResponse = this._remainder.trim();
			}
			this.logger.info({ tnx: "network" }, "Connection closed");
			if (this.upgrading && !this._destroyed) return this._onError(/* @__PURE__ */ new Error("Connection closed unexpectedly"), "ETLS", serverResponse, "CONN");
			else if (![this._actionGreeting, this.close].includes(this._responseActions[0]) && !this._destroyed) return this._onError(/* @__PURE__ */ new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
			else if (/^[45]\d{2}\b/.test(serverResponse)) return this._onError(/* @__PURE__ */ new Error("Connection closed unexpectedly"), "ECONNECTION", serverResponse, "CONN");
			this._destroy();
		}
		/**
		* 'end' listener for the socket
		*
		* @event
		*/
		_onEnd() {
			if (this._socket && !this._socket.destroyed) this._socket.destroy();
		}
		/**
		* 'timeout' listener for the socket
		*
		* @event
		*/
		_onTimeout() {
			return this._onError(/* @__PURE__ */ new Error("Timeout"), "ETIMEDOUT", false, "CONN");
		}
		/**
		* Destroys the client, emits 'end'
		*/
		_destroy() {
			if (this._destroyed) return;
			this._destroyed = true;
			this.emit("end");
		}
		/**
		* Upgrades the connection to TLS
		*
		* @param {Function} callback Callback function to run when the connection
		*        has been secured
		*/
		_upgradeConnection(callback) {
			this._socket.removeListener("data", this._onSocketData);
			this._socket.removeListener("timeout", this._onSocketTimeout);
			let socketPlain = this._socket;
			let opts = {
				socket: this._socket,
				host: this.host
			};
			Object.keys(this.options.tls || {}).forEach((key) => {
				opts[key] = this.options.tls[key];
			});
			if (this.servername && !opts.servername) opts.servername = this.servername;
			this.upgrading = true;
			try {
				this._socket = tls.connect(opts, () => {
					this.secure = true;
					this.upgrading = false;
					this._socket.on("data", this._onSocketData);
					socketPlain.removeListener("close", this._onSocketClose);
					socketPlain.removeListener("end", this._onSocketEnd);
					return callback(null, true);
				});
			} catch (err) {
				return callback(err);
			}
			this._socket.on("error", this._onSocketError);
			this._socket.once("close", this._onSocketClose);
			this._socket.once("end", this._onSocketEnd);
			this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
			this._socket.on("timeout", this._onSocketTimeout);
			socketPlain.resume();
		}
		/**
		* Processes queued responses from the server
		*
		* @param {Boolean} force If true, ignores _processing flag
		*/
		_processResponse() {
			if (!this._responseQueue.length) return false;
			let str = this.lastServerResponse = (this._responseQueue.shift() || "").toString();
			if (/^\d+-/.test(str.split("\n").pop())) return;
			if (this.options.debug || this.options.transactionLog) this.logger.debug({ tnx: "server" }, str.replace(/\r?\n$/, ""));
			if (!str.trim()) setImmediate(() => this._processResponse());
			let action = this._responseActions.shift();
			if (typeof action === "function") {
				action.call(this, str);
				setImmediate(() => this._processResponse());
			} else return this._onError(/* @__PURE__ */ new Error("Unexpected Response"), "EPROTOCOL", str, "CONN");
		}
		/**
		* Send a command to the server, append \r\n
		*
		* @param {String} str String to be sent to the server
		* @param {String} logStr Optional string to be used for logging instead of the actual string
		*/
		_sendCommand(str, logStr) {
			if (this._destroyed) return;
			if (this._socket.destroyed) return this.close();
			if (this.options.debug || this.options.transactionLog) this.logger.debug({ tnx: "client" }, (logStr || str || "").toString().replace(/\r?\n$/, ""));
			this._socket.write(Buffer.from(str + "\r\n", "utf-8"));
		}
		/**
		* Initiates a new message by submitting envelope data, starting with
		* MAIL FROM: command
		*
		* @param {Object} envelope Envelope object in the form of
		*        {from:'...', to:['...']}
		*        or
		*        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
		*/
		_setEnvelope(envelope, callback) {
			let args = [];
			let useSmtpUtf8 = false;
			this._envelope = envelope || {};
			this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim();
			this._envelope.to = [].concat(this._envelope.to || []).map((to) => (to && to.address || to || "").toString().trim());
			if (!this._envelope.to.length) return callback(this._formatError("No recipients defined", "EENVELOPE", false, "API"));
			if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from)) return callback(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", false, "API"));
			if (/[\x80-\uFFFF]/.test(this._envelope.from)) useSmtpUtf8 = true;
			for (let i = 0, len = this._envelope.to.length; i < len; i++) {
				if (!this._envelope.to[i] || /[\r\n<>]/.test(this._envelope.to[i])) return callback(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[i]), "EENVELOPE", false, "API"));
				if (/[\x80-\uFFFF]/.test(this._envelope.to[i])) useSmtpUtf8 = true;
			}
			this._envelope.rcptQueue = JSON.parse(JSON.stringify(this._envelope.to || []));
			this._envelope.rejected = [];
			this._envelope.rejectedErrors = [];
			this._envelope.accepted = [];
			if (this._envelope.dsn) try {
				this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
			} catch (err) {
				return callback(this._formatError("Invalid DSN " + err.message, "EENVELOPE", false, "API"));
			}
			this._responseActions.push((str) => {
				this._actionMAIL(str, callback);
			});
			if (useSmtpUtf8 && this._supportedExtensions.includes("SMTPUTF8")) {
				args.push("SMTPUTF8");
				this._usingSmtpUtf8 = true;
			}
			if (this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME")) {
				args.push("BODY=8BITMIME");
				this._using8BitMime = true;
			}
			if (this._envelope.size && this._supportedExtensions.includes("SIZE")) args.push("SIZE=" + this._envelope.size);
			if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
				if (this._envelope.dsn.ret) args.push("RET=" + shared$8.encodeXText(this._envelope.dsn.ret));
				if (this._envelope.dsn.envid) args.push("ENVID=" + shared$8.encodeXText(this._envelope.dsn.envid));
			}
			if (this._envelope.requireTLSExtensionEnabled) {
				if (!this.secure) return callback(this._formatError("REQUIRETLS can only be used over TLS connections (RFC 8689)", "EREQUIRETLS", false, "MAIL FROM"));
				if (!this._supportedExtensions.includes("REQUIRETLS")) return callback(this._formatError("Server does not support REQUIRETLS extension (RFC 8689)", "EREQUIRETLS", false, "MAIL FROM"));
				args.push("REQUIRETLS");
			}
			this._sendCommand("MAIL FROM:<" + this._envelope.from + ">" + (args.length ? " " + args.join(" ") : ""));
		}
		_setDsnEnvelope(params) {
			let ret = (params.ret || params.return || "").toString().toUpperCase() || null;
			if (ret) switch (ret) {
				case "HDRS":
				case "HEADERS":
					ret = "HDRS";
					break;
				case "FULL":
				case "BODY":
					ret = "FULL";
					break;
			}
			if (ret && !["FULL", "HDRS"].includes(ret)) throw new Error("ret: " + JSON.stringify(ret));
			let envid = (params.envid || params.id || "").toString() || null;
			let notify$1 = params.notify || null;
			if (notify$1) {
				if (typeof notify$1 === "string") notify$1 = notify$1.split(",");
				notify$1 = notify$1.map((n) => n.trim().toUpperCase());
				let validNotify = [
					"NEVER",
					"SUCCESS",
					"FAILURE",
					"DELAY"
				];
				if (notify$1.filter((n) => !validNotify.includes(n)).length || notify$1.length > 1 && notify$1.includes("NEVER")) throw new Error("notify: " + JSON.stringify(notify$1.join(",")));
				notify$1 = notify$1.join(",");
			}
			let orcpt = (params.recipient || params.orcpt || "").toString() || null;
			if (orcpt && orcpt.indexOf(";") < 0) orcpt = "rfc822;" + orcpt;
			return {
				ret,
				envid,
				notify: notify$1,
				orcpt
			};
		}
		_getDsnRcptToArgs() {
			let args = [];
			if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
				if (this._envelope.dsn.notify) args.push("NOTIFY=" + shared$8.encodeXText(this._envelope.dsn.notify));
				if (this._envelope.dsn.orcpt) args.push("ORCPT=" + shared$8.encodeXText(this._envelope.dsn.orcpt));
			}
			return args.length ? " " + args.join(" ") : "";
		}
		_createSendStream(callback) {
			let dataStream = new DataStream();
			let logStream;
			if (this.options.lmtp) this._envelope.accepted.forEach((recipient, i) => {
				let final = i === this._envelope.accepted.length - 1;
				this._responseActions.push((str) => {
					this._actionLMTPStream(recipient, final, str, callback);
				});
			});
			else this._responseActions.push((str) => {
				this._actionSMTPStream(str, callback);
			});
			dataStream.pipe(this._socket, { end: false });
			if (this.options.debug) {
				logStream = new PassThrough();
				logStream.on("readable", () => {
					let chunk;
					while (chunk = logStream.read()) this.logger.debug({ tnx: "message" }, chunk.toString("binary").replace(/\r?\n$/, ""));
				});
				dataStream.pipe(logStream);
			}
			dataStream.once("end", () => {
				this.logger.info({
					tnx: "message",
					inByteCount: dataStream.inByteCount,
					outByteCount: dataStream.outByteCount
				}, "<%s bytes encoded mime message (source size %s bytes)>", dataStream.outByteCount, dataStream.inByteCount);
			});
			return dataStream;
		}
		/** ACTIONS **/
		/**
		* Will be run after the connection is created and the server sends
		* a greeting. If the incoming message starts with 220 initiate
		* SMTP session by sending EHLO command
		*
		* @param {String} str Message from the server
		*/
		_actionGreeting(str) {
			clearTimeout(this._greetingTimeout);
			if (str.substr(0, 3) !== "220") {
				this._onError(/* @__PURE__ */ new Error("Invalid greeting. response=" + str), "EPROTOCOL", str, "CONN");
				return;
			}
			if (this.options.lmtp) {
				this._responseActions.push(this._actionLHLO);
				this._sendCommand("LHLO " + this.name);
			} else {
				this._responseActions.push(this._actionEHLO);
				this._sendCommand("EHLO " + this.name);
			}
		}
		/**
		* Handles server response for LHLO command. If it yielded in
		* error, emit 'error', otherwise treat this as an EHLO response
		*
		* @param {String} str Message from the server
		*/
		_actionLHLO(str) {
			if (str.charAt(0) !== "2") {
				this._onError(/* @__PURE__ */ new Error("Invalid LHLO. response=" + str), "EPROTOCOL", str, "LHLO");
				return;
			}
			this._actionEHLO(str);
		}
		/**
		* Handles server response for EHLO command. If it yielded in
		* error, try HELO instead, otherwise initiate TLS negotiation
		* if STARTTLS is supported by the server or move into the
		* authentication phase.
		*
		* @param {String} str Message from the server
		*/
		_actionEHLO(str) {
			let match;
			if (str.substr(0, 3) === "421") {
				this._onError(/* @__PURE__ */ new Error("Server terminates connection. response=" + str), "ECONNECTION", str, "EHLO");
				return;
			}
			if (str.charAt(0) !== "2") {
				if (this.options.requireTLS) {
					this._onError(/* @__PURE__ */ new Error("EHLO failed but HELO does not support required STARTTLS. response=" + str), "ECONNECTION", str, "EHLO");
					return;
				}
				this._responseActions.push(this._actionHELO);
				this._sendCommand("HELO " + this.name);
				return;
			}
			this._ehloLines = str.split(/\r?\n/).map((line) => line.replace(/^\d+[ -]/, "").trim()).filter((line) => line).slice(1);
			if (!this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(str) || this.options.requireTLS)) {
				this._sendCommand("STARTTLS");
				this._responseActions.push(this._actionSTARTTLS);
				return;
			}
			if (/[ -]SMTPUTF8\b/im.test(str)) this._supportedExtensions.push("SMTPUTF8");
			if (/[ -]DSN\b/im.test(str)) this._supportedExtensions.push("DSN");
			if (/[ -]8BITMIME\b/im.test(str)) this._supportedExtensions.push("8BITMIME");
			if (/[ -]REQUIRETLS\b/im.test(str)) this._supportedExtensions.push("REQUIRETLS");
			if (/[ -]PIPELINING\b/im.test(str)) this._supportedExtensions.push("PIPELINING");
			if (/[ -]AUTH\b/i.test(str)) this.allowsAuth = true;
			if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)PLAIN/i.test(str)) this._supportedAuth.push("PLAIN");
			if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)LOGIN/i.test(str)) this._supportedAuth.push("LOGIN");
			if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)CRAM-MD5/i.test(str)) this._supportedAuth.push("CRAM-MD5");
			if (/[ -]AUTH(?:(\s+|=)[^\n]*\s+|\s+|=)XOAUTH2/i.test(str)) this._supportedAuth.push("XOAUTH2");
			if (match = str.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) {
				this._supportedExtensions.push("SIZE");
				this._maxAllowedSize = Number(match[1]) || 0;
			}
			this.emit("connect");
		}
		/**
		* Handles server response for HELO command. If it yielded in
		* error, emit 'error', otherwise move into the authentication phase.
		*
		* @param {String} str Message from the server
		*/
		_actionHELO(str) {
			if (str.charAt(0) !== "2") {
				this._onError(/* @__PURE__ */ new Error("Invalid HELO. response=" + str), "EPROTOCOL", str, "HELO");
				return;
			}
			this.allowsAuth = true;
			this.emit("connect");
		}
		/**
		* Handles server response for STARTTLS command. If there's an error
		* try HELO instead, otherwise initiate TLS upgrade. If the upgrade
		* succeedes restart the EHLO
		*
		* @param {String} str Message from the server
		*/
		_actionSTARTTLS(str) {
			if (str.charAt(0) !== "2") {
				if (this.options.opportunisticTLS) {
					this.logger.info({ tnx: "smtp" }, "Failed STARTTLS upgrade, continuing unencrypted");
					return this.emit("connect");
				}
				this._onError(/* @__PURE__ */ new Error("Error upgrading connection with STARTTLS"), "ETLS", str, "STARTTLS");
				return;
			}
			this._upgradeConnection((err, secured) => {
				if (err) {
					this._onError(/* @__PURE__ */ new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "STARTTLS");
					return;
				}
				this.logger.info({ tnx: "smtp" }, "Connection upgraded with STARTTLS");
				if (secured) if (this.options.lmtp) {
					this._responseActions.push(this._actionLHLO);
					this._sendCommand("LHLO " + this.name);
				} else {
					this._responseActions.push(this._actionEHLO);
					this._sendCommand("EHLO " + this.name);
				}
				else this.emit("connect");
			});
		}
		/**
		* Handle the response for AUTH LOGIN command. We are expecting
		* '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
		* response needs to be base64 encoded username. We do not need
		* exact match but settle with 334 response in general as some
		* hosts invalidly use a longer message than VXNlcm5hbWU6
		*
		* @param {String} str Message from the server
		*/
		_actionAUTH_LOGIN_USER(str, callback) {
			if (!/^334[ -]/.test(str)) {
				callback(this._formatError("Invalid login sequence while waiting for \"334 VXNlcm5hbWU6\"", "EAUTH", str, "AUTH LOGIN"));
				return;
			}
			this._responseActions.push((str$1) => {
				this._actionAUTH_LOGIN_PASS(str$1, callback);
			});
			this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
		}
		/**
		* Handle the response for AUTH CRAM-MD5 command. We are expecting
		* '334 <challenge string>'. Data to be sent as response needs to be
		* base64 decoded challenge string, MD5 hashed using the password as
		* a HMAC key, prefixed by the username and a space, and finally all
		* base64 encoded again.
		*
		* @param {String} str Message from the server
		*/
		_actionAUTH_CRAM_MD5(str, callback) {
			let challengeMatch = str.match(/^334\s+(.+)$/);
			let challengeString = "";
			if (!challengeMatch) return callback(this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", str, "AUTH CRAM-MD5"));
			else challengeString = challengeMatch[1];
			let base64decoded = Buffer.from(challengeString, "base64").toString("ascii"), hmacMD5 = crypto$2.createHmac("md5", this._auth.credentials.pass);
			hmacMD5.update(base64decoded);
			let prepended = this._auth.credentials.user + " " + hmacMD5.digest("hex");
			this._responseActions.push((str$1) => {
				this._actionAUTH_CRAM_MD5_PASS(str$1, callback);
			});
			this._sendCommand(Buffer.from(prepended).toString("base64"), Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64"));
		}
		/**
		* Handles the response to CRAM-MD5 authentication, if there's no error,
		* the user can be considered logged in. Start waiting for a message to send
		*
		* @param {String} str Message from the server
		*/
		_actionAUTH_CRAM_MD5_PASS(str, callback) {
			if (!str.match(/^235\s+/)) return callback(this._formatError("Invalid login sequence while waiting for \"235\"", "EAUTH", str, "AUTH CRAM-MD5"));
			this.logger.info({
				tnx: "smtp",
				username: this._auth.user,
				action: "authenticated",
				method: this._authMethod
			}, "User %s authenticated", JSON.stringify(this._auth.user));
			this.authenticated = true;
			callback(null, true);
		}
		/**
		* Handle the response for AUTH LOGIN command. We are expecting
		* '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
		* response needs to be base64 encoded password.
		*
		* @param {String} str Message from the server
		*/
		_actionAUTH_LOGIN_PASS(str, callback) {
			if (!/^334[ -]/.test(str)) return callback(this._formatError("Invalid login sequence while waiting for \"334 UGFzc3dvcmQ6\"", "EAUTH", str, "AUTH LOGIN"));
			this._responseActions.push((str$1) => {
				this._actionAUTHComplete(str$1, callback);
			});
			this._sendCommand(Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"), Buffer.from("/* secret */", "utf-8").toString("base64"));
		}
		/**
		* Handles the response for authentication, if there's no error,
		* the user can be considered logged in. Start waiting for a message to send
		*
		* @param {String} str Message from the server
		*/
		_actionAUTHComplete(str, isRetry, callback) {
			if (!callback && typeof isRetry === "function") {
				callback = isRetry;
				isRetry = false;
			}
			if (str.substr(0, 3) === "334") {
				this._responseActions.push((str$1) => {
					if (isRetry || this._authMethod !== "XOAUTH2") this._actionAUTHComplete(str$1, true, callback);
					else setImmediate(() => this._handleXOauth2Token(true, callback));
				});
				this._sendCommand("");
				return;
			}
			if (str.charAt(0) !== "2") {
				this.logger.info({
					tnx: "smtp",
					username: this._auth.user,
					action: "authfail",
					method: this._authMethod
				}, "User %s failed to authenticate", JSON.stringify(this._auth.user));
				return callback(this._formatError("Invalid login", "EAUTH", str, "AUTH " + this._authMethod));
			}
			this.logger.info({
				tnx: "smtp",
				username: this._auth.user,
				action: "authenticated",
				method: this._authMethod
			}, "User %s authenticated", JSON.stringify(this._auth.user));
			this.authenticated = true;
			callback(null, true);
		}
		/**
		* Handle response for a MAIL FROM: command
		*
		* @param {String} str Message from the server
		*/
		_actionMAIL(str, callback) {
			let message, curRecipient;
			if (Number(str.charAt(0)) !== 2) {
				if (this._usingSmtpUtf8 && /^550 /.test(str) && /[\x80-\uFFFF]/.test(this._envelope.from)) message = "Internationalized mailbox name not allowed";
				else message = "Mail command failed";
				return callback(this._formatError(message, "EENVELOPE", str, "MAIL FROM"));
			}
			if (!this._envelope.rcptQueue.length) return callback(this._formatError("Can't send mail - no recipients defined", "EENVELOPE", false, "API"));
			else {
				this._recipientQueue = [];
				if (this._supportedExtensions.includes("PIPELINING")) while (this._envelope.rcptQueue.length) {
					curRecipient = this._envelope.rcptQueue.shift();
					this._recipientQueue.push(curRecipient);
					this._responseActions.push((str$1) => {
						this._actionRCPT(str$1, callback);
					});
					this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
				}
				else {
					curRecipient = this._envelope.rcptQueue.shift();
					this._recipientQueue.push(curRecipient);
					this._responseActions.push((str$1) => {
						this._actionRCPT(str$1, callback);
					});
					this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
				}
			}
		}
		/**
		* Handle response for a RCPT TO: command
		*
		* @param {String} str Message from the server
		*/
		_actionRCPT(str, callback) {
			let message, err, curRecipient = this._recipientQueue.shift();
			if (Number(str.charAt(0)) !== 2) {
				if (this._usingSmtpUtf8 && /^553 /.test(str) && /[\x80-\uFFFF]/.test(curRecipient)) message = "Internationalized mailbox name not allowed";
				else message = "Recipient command failed";
				this._envelope.rejected.push(curRecipient);
				err = this._formatError(message, "EENVELOPE", str, "RCPT TO");
				err.recipient = curRecipient;
				this._envelope.rejectedErrors.push(err);
			} else this._envelope.accepted.push(curRecipient);
			if (!this._envelope.rcptQueue.length && !this._recipientQueue.length) if (this._envelope.rejected.length < this._envelope.to.length) {
				this._responseActions.push((str$1) => {
					this._actionDATA(str$1, callback);
				});
				this._sendCommand("DATA");
			} else {
				err = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", str, "RCPT TO");
				err.rejected = this._envelope.rejected;
				err.rejectedErrors = this._envelope.rejectedErrors;
				return callback(err);
			}
			else if (this._envelope.rcptQueue.length) {
				curRecipient = this._envelope.rcptQueue.shift();
				this._recipientQueue.push(curRecipient);
				this._responseActions.push((str$1) => {
					this._actionRCPT(str$1, callback);
				});
				this._sendCommand("RCPT TO:<" + curRecipient + ">" + this._getDsnRcptToArgs());
			}
		}
		/**
		* Handle response for a DATA command
		*
		* @param {String} str Message from the server
		*/
		_actionDATA(str, callback) {
			if (!/^[23]/.test(str)) return callback(this._formatError("Data command failed", "EENVELOPE", str, "DATA"));
			let response = {
				accepted: this._envelope.accepted,
				rejected: this._envelope.rejected
			};
			if (this._ehloLines && this._ehloLines.length) response.ehlo = this._ehloLines;
			if (this._envelope.rejectedErrors.length) response.rejectedErrors = this._envelope.rejectedErrors;
			callback(null, response);
		}
		/**
		* Handle response for a DATA stream when using SMTP
		* We expect a single response that defines if the sending succeeded or failed
		*
		* @param {String} str Message from the server
		*/
		_actionSMTPStream(str, callback) {
			if (Number(str.charAt(0)) !== 2) return callback(this._formatError("Message failed", "EMESSAGE", str, "DATA"));
			else return callback(null, str);
		}
		/**
		* Handle response for a DATA stream
		* We expect a separate response for every recipient. All recipients can either
		* succeed or fail separately
		*
		* @param {String} recipient The recipient this response applies to
		* @param {Boolean} final Is this the final recipient?
		* @param {String} str Message from the server
		*/
		_actionLMTPStream(recipient, final, str, callback) {
			let err;
			if (Number(str.charAt(0)) !== 2) {
				err = this._formatError("Message failed for recipient " + recipient, "EMESSAGE", str, "DATA");
				err.recipient = recipient;
				this._envelope.rejected.push(recipient);
				this._envelope.rejectedErrors.push(err);
				for (let i = 0, len = this._envelope.accepted.length; i < len; i++) if (this._envelope.accepted[i] === recipient) this._envelope.accepted.splice(i, 1);
			}
			if (final) return callback(null, str);
		}
		_handleXOauth2Token(isRetry, callback) {
			this._auth.oauth2.getToken(isRetry, (err, accessToken) => {
				if (err) {
					this.logger.info({
						tnx: "smtp",
						username: this._auth.user,
						action: "authfail",
						method: this._authMethod
					}, "User %s failed to authenticate", JSON.stringify(this._auth.user));
					return callback(this._formatError(err, "EAUTH", false, "AUTH XOAUTH2"));
				}
				this._responseActions.push((str) => {
					this._actionAUTHComplete(str, isRetry, callback);
				});
				this._sendCommand("AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(accessToken), "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */"));
			});
		}
		/**
		*
		* @param {string} command
		* @private
		*/
		_isDestroyedMessage(command) {
			if (this._destroyed) return "Cannot " + command + " - smtp connection is already destroyed.";
			if (this._socket) {
				if (this._socket.destroyed) return "Cannot " + command + " - smtp connection socket is already destroyed.";
				if (!this._socket.writable) return "Cannot " + command + " - smtp connection socket is already half-closed.";
			}
		}
		_getHostname() {
			let defaultHostname;
			try {
				defaultHostname = os.hostname() || "";
			} catch (_err) {
				defaultHostname = "localhost";
			}
			if (!defaultHostname || defaultHostname.indexOf(".") < 0) defaultHostname = "[127.0.0.1]";
			if (defaultHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) defaultHostname = "[" + defaultHostname + "]";
			return defaultHostname;
		}
	};
	module.exports = SMTPConnection$3;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/xoauth2/index.js
var require_xoauth2 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Stream = __require("stream").Stream;
	const nmfetch$1 = require_fetch();
	const crypto$1 = __require("crypto");
	const shared$7 = require_shared();
	/**
	* XOAUTH2 access_token generator for Gmail.
	* Create client ID for web applications in Google API console to use it.
	* See Offline Access for receiving the needed refreshToken for an user
	* https://developers.google.com/accounts/docs/OAuth2WebServer#offline
	*
	* Usage for generating access tokens with a custom method using provisionCallback:
	* provisionCallback(user, renew, callback)
	*   * user is the username to get the token for
	*   * renew is a boolean that if true indicates that existing token failed and needs to be renewed
	*   * callback is the callback to run with (error, accessToken [, expires])
	*     * accessToken is a string
	*     * expires is an optional expire time in milliseconds
	* If provisionCallback is used, then Nodemailer does not try to attempt generating the token by itself
	*
	* @constructor
	* @param {Object} options Client information for token generation
	* @param {String} options.user User e-mail address
	* @param {String} options.clientId Client ID value
	* @param {String} options.clientSecret Client secret value
	* @param {String} options.refreshToken Refresh token for an user
	* @param {String} options.accessUrl Endpoint for token generation, defaults to 'https://accounts.google.com/o/oauth2/token'
	* @param {String} options.accessToken An existing valid accessToken
	* @param {String} options.privateKey Private key for JSW
	* @param {Number} options.expires Optional Access Token expire time in ms
	* @param {Number} options.timeout Optional TTL for Access Token in seconds
	* @param {Function} options.provisionCallback Function to run when a new access token is required
	*/
	var XOAuth2$2 = class extends Stream {
		constructor(options, logger$1) {
			super();
			this.options = options || {};
			if (options && options.serviceClient) {
				if (!options.privateKey || !options.user) {
					setImmediate(() => this.emit("error", /* @__PURE__ */ new Error("Options \"privateKey\" and \"user\" are required for service account!")));
					return;
				}
				let serviceRequestTimeout = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
				this.options.serviceRequestTimeout = serviceRequestTimeout || 300;
			}
			this.logger = shared$7.getLogger({ logger: logger$1 }, { component: this.options.component || "OAuth2" });
			this.provisionCallback = typeof this.options.provisionCallback === "function" ? this.options.provisionCallback : false;
			this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token";
			this.options.customHeaders = this.options.customHeaders || {};
			this.options.customParams = this.options.customParams || {};
			this.accessToken = this.options.accessToken || false;
			if (this.options.expires && Number(this.options.expires)) this.expires = this.options.expires;
			else {
				let timeout = Math.max(Number(this.options.timeout) || 0, 0);
				this.expires = timeout && Date.now() + timeout * 1e3 || 0;
			}
			this.renewing = false;
			this.renewalQueue = [];
		}
		/**
		* Returns or generates (if previous has expired) a XOAuth2 token
		*
		* @param {Boolean} renew If false then use cached access token (if available)
		* @param {Function} callback Callback function with error object and token string
		*/
		getToken(renew, callback) {
			if (!renew && this.accessToken && (!this.expires || this.expires > Date.now())) {
				this.logger.debug({
					tnx: "OAUTH2",
					user: this.options.user,
					action: "reuse"
				}, "Reusing existing access token for %s", this.options.user);
				return callback(null, this.accessToken);
			}
			if (!this.provisionCallback && !this.options.refreshToken && !this.options.serviceClient) {
				if (this.accessToken) {
					this.logger.debug({
						tnx: "OAUTH2",
						user: this.options.user,
						action: "reuse"
					}, "Reusing existing access token (no refresh capability) for %s", this.options.user);
					return callback(null, this.accessToken);
				}
				this.logger.error({
					tnx: "OAUTH2",
					user: this.options.user,
					action: "renew"
				}, "Cannot renew access token for %s: No refresh mechanism available", this.options.user);
				return callback(/* @__PURE__ */ new Error("Can't create new access token for user"));
			}
			if (this.renewing) return this.renewalQueue.push({
				renew,
				callback
			});
			this.renewing = true;
			const generateCallback = (err, accessToken) => {
				this.renewalQueue.forEach((item) => item.callback(err, accessToken));
				this.renewalQueue = [];
				this.renewing = false;
				if (err) this.logger.error({
					err,
					tnx: "OAUTH2",
					user: this.options.user,
					action: "renew"
				}, "Failed generating new Access Token for %s", this.options.user);
				else this.logger.info({
					tnx: "OAUTH2",
					user: this.options.user,
					action: "renew"
				}, "Generated new Access Token for %s", this.options.user);
				callback(err, accessToken);
			};
			if (this.provisionCallback) this.provisionCallback(this.options.user, !!renew, (err, accessToken, expires) => {
				if (!err && accessToken) {
					this.accessToken = accessToken;
					this.expires = expires || 0;
				}
				generateCallback(err, accessToken);
			});
			else this.generateToken(generateCallback);
		}
		/**
		* Updates token values
		*
		* @param {String} accessToken New access token
		* @param {Number} timeout Access token lifetime in seconds
		*
		* Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
		*/
		updateToken(accessToken, timeout) {
			this.accessToken = accessToken;
			timeout = Math.max(Number(timeout) || 0, 0);
			this.expires = timeout && Date.now() + timeout * 1e3 || 0;
			this.emit("token", {
				user: this.options.user,
				accessToken: accessToken || "",
				expires: this.expires
			});
		}
		/**
		* Generates a new XOAuth2 token with the credentials provided at initialization
		*
		* @param {Function} callback Callback function with error object and token string
		*/
		generateToken(callback) {
			let urlOptions;
			let loggedUrlOptions;
			if (this.options.serviceClient) {
				let iat = Math.floor(Date.now() / 1e3);
				let tokenData = {
					iss: this.options.serviceClient,
					scope: this.options.scope || "https://mail.google.com/",
					sub: this.options.user,
					aud: this.options.accessUrl,
					iat,
					exp: iat + this.options.serviceRequestTimeout
				};
				let token;
				try {
					token = this.jwtSignRS256(tokenData);
				} catch (_err) {
					return callback(/* @__PURE__ */ new Error("Can't generate token. Check your auth options"));
				}
				urlOptions = {
					grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
					assertion: token
				};
				loggedUrlOptions = {
					grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
					assertion: tokenData
				};
			} else {
				if (!this.options.refreshToken) return callback(/* @__PURE__ */ new Error("Can't create new access token for user"));
				urlOptions = {
					client_id: this.options.clientId || "",
					client_secret: this.options.clientSecret || "",
					refresh_token: this.options.refreshToken,
					grant_type: "refresh_token"
				};
				loggedUrlOptions = {
					client_id: this.options.clientId || "",
					client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
					refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
					grant_type: "refresh_token"
				};
			}
			Object.keys(this.options.customParams).forEach((key) => {
				urlOptions[key] = this.options.customParams[key];
				loggedUrlOptions[key] = this.options.customParams[key];
			});
			this.logger.debug({
				tnx: "OAUTH2",
				user: this.options.user,
				action: "generate"
			}, "Requesting token using: %s", JSON.stringify(loggedUrlOptions));
			this.postRequest(this.options.accessUrl, urlOptions, this.options, (error$1, body) => {
				let data;
				if (error$1) return callback(error$1);
				try {
					data = JSON.parse(body.toString());
				} catch (E) {
					return callback(E);
				}
				if (!data || typeof data !== "object") {
					this.logger.debug({
						tnx: "OAUTH2",
						user: this.options.user,
						action: "post"
					}, "Response: %s", (body || "").toString());
					return callback(/* @__PURE__ */ new Error("Invalid authentication response"));
				}
				let logData = {};
				Object.keys(data).forEach((key) => {
					if (key !== "access_token") logData[key] = data[key];
					else logData[key] = (data[key] || "").toString().substr(0, 6) + "...";
				});
				this.logger.debug({
					tnx: "OAUTH2",
					user: this.options.user,
					action: "post"
				}, "Response: %s", JSON.stringify(logData));
				if (data.error) {
					let errorMessage = data.error;
					if (data.error_description) errorMessage += ": " + data.error_description;
					if (data.error_uri) errorMessage += " (" + data.error_uri + ")";
					return callback(new Error(errorMessage));
				}
				if (data.access_token) {
					this.updateToken(data.access_token, data.expires_in);
					return callback(null, this.accessToken);
				}
				return callback(/* @__PURE__ */ new Error("No access token"));
			});
		}
		/**
		* Converts an access_token and user id into a base64 encoded XOAuth2 token
		*
		* @param {String} [accessToken] Access token string
		* @return {String} Base64 encoded token for IMAP or SMTP login
		*/
		buildXOAuth2Token(accessToken) {
			let authData = [
				"user=" + (this.options.user || ""),
				"auth=Bearer " + (accessToken || this.accessToken),
				"",
				""
			];
			return Buffer.from(authData.join(""), "utf-8").toString("base64");
		}
		/**
		* Custom POST request handler.
		* This is only needed to keep paths short in Windows – usually this module
		* is a dependency of a dependency and if it tries to require something
		* like the request module the paths get way too long to handle for Windows.
		* As we do only a simple POST request we do not actually require complicated
		* logic support (no redirects, no nothing) anyway.
		*
		* @param {String} url Url to POST to
		* @param {String|Buffer} payload Payload to POST
		* @param {Function} callback Callback function with (err, buff)
		*/
		postRequest(url, payload, params, callback) {
			let returned = false;
			let chunks = [];
			let chunklen = 0;
			let req = nmfetch$1(url, {
				method: "post",
				headers: params.customHeaders,
				body: payload,
				allowErrorResponse: true
			});
			req.on("readable", () => {
				let chunk;
				while ((chunk = req.read()) !== null) {
					chunks.push(chunk);
					chunklen += chunk.length;
				}
			});
			req.once("error", (err) => {
				if (returned) return;
				returned = true;
				return callback(err);
			});
			req.once("end", () => {
				if (returned) return;
				returned = true;
				return callback(null, Buffer.concat(chunks, chunklen));
			});
		}
		/**
		* Encodes a buffer or a string into Base64url format
		*
		* @param {Buffer|String} data The data to convert
		* @return {String} The encoded string
		*/
		toBase64URL(data) {
			if (typeof data === "string") data = Buffer.from(data);
			return data.toString("base64").replace(/[=]+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
		}
		/**
		* Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
		*
		* @param {Object} payload The payload to include in the generated token
		* @return {String} The generated and signed token
		*/
		jwtSignRS256(payload) {
			payload = ["{\"alg\":\"RS256\",\"typ\":\"JWT\"}", JSON.stringify(payload)].map((val$1) => this.toBase64URL(val$1)).join(".");
			let signature = crypto$1.createSign("RSA-SHA256").update(payload).sign(this.options.privateKey);
			return payload + "." + this.toBase64URL(signature);
		}
	};
	module.exports = XOAuth2$2;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/smtp-pool/pool-resource.js
var require_pool_resource = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const SMTPConnection$2 = require_smtp_connection();
	const assign = require_shared().assign;
	const XOAuth2$1 = require_xoauth2();
	const EventEmitter$3 = __require("events");
	/**
	* Creates an element for the pool
	*
	* @constructor
	* @param {Object} options SMTPPool instance
	*/
	var PoolResource$1 = class extends EventEmitter$3 {
		constructor(pool$1) {
			super();
			this.pool = pool$1;
			this.options = pool$1.options;
			this.logger = this.pool.logger;
			if (this.options.auth) switch ((this.options.auth.type || "").toString().toUpperCase()) {
				case "OAUTH2": {
					let oauth2 = new XOAuth2$1(this.options.auth, this.logger);
					oauth2.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
					this.auth = {
						type: "OAUTH2",
						user: this.options.auth.user,
						oauth2,
						method: "XOAUTH2"
					};
					oauth2.on("token", (token) => this.pool.mailer.emit("token", token));
					oauth2.on("error", (err) => this.emit("error", err));
					break;
				}
				default:
					if (!this.options.auth.user && !this.options.auth.pass) break;
					this.auth = {
						type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
						user: this.options.auth.user,
						credentials: {
							user: this.options.auth.user || "",
							pass: this.options.auth.pass,
							options: this.options.auth.options
						},
						method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || false
					};
			}
			this._connection = false;
			this._connected = false;
			this.messages = 0;
			this.available = true;
		}
		/**
		* Initiates a connection to the SMTP server
		*
		* @param {Function} callback Callback function to run once the connection is established or failed
		*/
		connect(callback) {
			this.pool.getSocket(this.options, (err, socketOptions) => {
				if (err) return callback(err);
				let returned = false;
				let options = this.options;
				if (socketOptions && socketOptions.connection) {
					this.logger.info({
						tnx: "proxy",
						remoteAddress: socketOptions.connection.remoteAddress,
						remotePort: socketOptions.connection.remotePort,
						destHost: options.host || "",
						destPort: options.port || "",
						action: "connected"
					}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
					options = assign(false, options);
					Object.keys(socketOptions).forEach((key) => {
						options[key] = socketOptions[key];
					});
				}
				this.connection = new SMTPConnection$2(options);
				this.connection.once("error", (err$1) => {
					this.emit("error", err$1);
					if (returned) return;
					returned = true;
					return callback(err$1);
				});
				this.connection.once("end", () => {
					this.close();
					if (returned) return;
					returned = true;
					let timer = setTimeout(() => {
						if (returned) return;
						let err$1 = /* @__PURE__ */ new Error("Unexpected socket close");
						if (this.connection && this.connection._socket && this.connection._socket.upgrading) err$1.code = "ETLS";
						callback(err$1);
					}, 1e3);
					try {
						timer.unref();
					} catch (_E) {}
				});
				this.connection.connect(() => {
					if (returned) return;
					if (this.auth && (this.connection.allowsAuth || options.forceAuth)) this.connection.login(this.auth, (err$1) => {
						if (returned) return;
						returned = true;
						if (err$1) {
							this.connection.close();
							this.emit("error", err$1);
							return callback(err$1);
						}
						this._connected = true;
						callback(null, true);
					});
					else {
						returned = true;
						this._connected = true;
						return callback(null, true);
					}
				});
			});
		}
		/**
		* Sends an e-mail to be sent using the selected settings
		*
		* @param {Object} mail Mail object
		* @param {Function} callback Callback function
		*/
		send(mail, callback) {
			if (!this._connected) return this.connect((err) => {
				if (err) return callback(err);
				return this.send(mail, callback);
			});
			let envelope = mail.message.getEnvelope();
			let messageId = mail.message.messageId();
			let recipients = [].concat(envelope.to || []);
			if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
			this.logger.info({
				tnx: "send",
				messageId,
				cid: this.id
			}, "Sending message %s using #%s to <%s>", messageId, this.id, recipients.join(", "));
			if (mail.data.dsn) envelope.dsn = mail.data.dsn;
			if (mail.data.requireTLSExtensionEnabled) envelope.requireTLSExtensionEnabled = mail.data.requireTLSExtensionEnabled;
			this.connection.send(envelope, mail.message.createReadStream(), (err, info) => {
				this.messages++;
				if (err) {
					this.connection.close();
					this.emit("error", err);
					return callback(err);
				}
				info.envelope = {
					from: envelope.from,
					to: envelope.to
				};
				info.messageId = messageId;
				setImmediate(() => {
					let err$1;
					if (this.messages >= this.options.maxMessages) {
						err$1 = /* @__PURE__ */ new Error("Resource exhausted");
						err$1.code = "EMAXLIMIT";
						this.connection.close();
						this.emit("error", err$1);
					} else this.pool._checkRateLimit(() => {
						this.available = true;
						this.emit("available");
					});
				});
				callback(null, info);
			});
		}
		/**
		* Closes the connection
		*/
		close() {
			this._connected = false;
			if (this.auth && this.auth.oauth2) this.auth.oauth2.removeAllListeners();
			if (this.connection) this.connection.close();
			this.emit("close");
		}
	};
	module.exports = PoolResource$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/well-known/services.json
var require_services = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		"1und1": {
			"description": "1&1 Mail (German hosting provider)",
			"host": "smtp.1und1.de",
			"port": 465,
			"secure": true,
			"authMethod": "LOGIN"
		},
		"126": {
			"description": "126 Mail (NetEase)",
			"host": "smtp.126.com",
			"port": 465,
			"secure": true
		},
		"163": {
			"description": "163 Mail (NetEase)",
			"host": "smtp.163.com",
			"port": 465,
			"secure": true
		},
		"Aliyun": {
			"description": "Alibaba Cloud Mail",
			"domains": ["aliyun.com"],
			"host": "smtp.aliyun.com",
			"port": 465,
			"secure": true
		},
		"AliyunQiye": {
			"description": "Alibaba Cloud Enterprise Mail",
			"host": "smtp.qiye.aliyun.com",
			"port": 465,
			"secure": true
		},
		"AOL": {
			"description": "AOL Mail",
			"domains": ["aol.com"],
			"host": "smtp.aol.com",
			"port": 587
		},
		"Aruba": {
			"description": "Aruba PEC (Italian email provider)",
			"domains": ["aruba.it", "pec.aruba.it"],
			"aliases": ["Aruba PEC"],
			"host": "smtps.aruba.it",
			"port": 465,
			"secure": true,
			"authMethod": "LOGIN"
		},
		"Bluewin": {
			"description": "Bluewin (Swiss email provider)",
			"host": "smtpauths.bluewin.ch",
			"domains": ["bluewin.ch"],
			"port": 465
		},
		"BOL": {
			"description": "BOL Mail (Brazilian provider)",
			"domains": ["bol.com.br"],
			"host": "smtp.bol.com.br",
			"port": 587,
			"requireTLS": true
		},
		"DebugMail": {
			"description": "DebugMail (email testing service)",
			"host": "debugmail.io",
			"port": 25
		},
		"Disroot": {
			"description": "Disroot (privacy-focused provider)",
			"domains": ["disroot.org"],
			"host": "disroot.org",
			"port": 587,
			"secure": false,
			"authMethod": "LOGIN"
		},
		"DynectEmail": {
			"description": "Dyn Email Delivery",
			"aliases": ["Dynect"],
			"host": "smtp.dynect.net",
			"port": 25
		},
		"ElasticEmail": {
			"description": "Elastic Email",
			"aliases": ["Elastic Email"],
			"host": "smtp.elasticemail.com",
			"port": 465,
			"secure": true
		},
		"Ethereal": {
			"description": "Ethereal Email (email testing service)",
			"aliases": ["ethereal.email"],
			"host": "smtp.ethereal.email",
			"port": 587
		},
		"FastMail": {
			"description": "FastMail",
			"domains": ["fastmail.fm"],
			"host": "smtp.fastmail.com",
			"port": 465,
			"secure": true
		},
		"Feishu Mail": {
			"description": "Feishu Mail (Lark)",
			"aliases": ["Feishu", "FeishuMail"],
			"domains": ["www.feishu.cn"],
			"host": "smtp.feishu.cn",
			"port": 465,
			"secure": true
		},
		"Forward Email": {
			"description": "Forward Email (email forwarding service)",
			"aliases": ["FE", "ForwardEmail"],
			"domains": ["forwardemail.net"],
			"host": "smtp.forwardemail.net",
			"port": 465,
			"secure": true
		},
		"GandiMail": {
			"description": "Gandi Mail",
			"aliases": ["Gandi", "Gandi Mail"],
			"host": "mail.gandi.net",
			"port": 587
		},
		"Gmail": {
			"description": "Gmail",
			"aliases": ["Google Mail"],
			"domains": ["gmail.com", "googlemail.com"],
			"host": "smtp.gmail.com",
			"port": 465,
			"secure": true
		},
		"GMX": {
			"description": "GMX Mail",
			"domains": [
				"gmx.com",
				"gmx.net",
				"gmx.de"
			],
			"host": "mail.gmx.com",
			"port": 587
		},
		"Godaddy": {
			"description": "GoDaddy Email (US)",
			"host": "smtpout.secureserver.net",
			"port": 25
		},
		"GodaddyAsia": {
			"description": "GoDaddy Email (Asia)",
			"host": "smtp.asia.secureserver.net",
			"port": 25
		},
		"GodaddyEurope": {
			"description": "GoDaddy Email (Europe)",
			"host": "smtp.europe.secureserver.net",
			"port": 25
		},
		"hot.ee": {
			"description": "Hot.ee (Estonian email provider)",
			"host": "mail.hot.ee"
		},
		"Hotmail": {
			"description": "Outlook.com / Hotmail",
			"aliases": [
				"Outlook",
				"Outlook.com",
				"Hotmail.com"
			],
			"domains": ["hotmail.com", "outlook.com"],
			"host": "smtp-mail.outlook.com",
			"port": 587
		},
		"iCloud": {
			"description": "iCloud Mail",
			"aliases": ["Me", "Mac"],
			"domains": ["me.com", "mac.com"],
			"host": "smtp.mail.me.com",
			"port": 587
		},
		"Infomaniak": {
			"description": "Infomaniak Mail (Swiss hosting provider)",
			"host": "mail.infomaniak.com",
			"domains": [
				"ik.me",
				"ikmail.com",
				"etik.com"
			],
			"port": 587
		},
		"KolabNow": {
			"description": "KolabNow (secure email service)",
			"domains": ["kolabnow.com"],
			"aliases": ["Kolab"],
			"host": "smtp.kolabnow.com",
			"port": 465,
			"secure": true,
			"authMethod": "LOGIN"
		},
		"Loopia": {
			"description": "Loopia (Swedish hosting provider)",
			"host": "mailcluster.loopia.se",
			"port": 465
		},
		"Loops": {
			"description": "Loops",
			"host": "smtp.loops.so",
			"port": 587
		},
		"mail.ee": {
			"description": "Mail.ee (Estonian email provider)",
			"host": "smtp.mail.ee"
		},
		"Mail.ru": {
			"description": "Mail.ru",
			"host": "smtp.mail.ru",
			"port": 465,
			"secure": true
		},
		"Mailcatch.app": {
			"description": "Mailcatch (email testing service)",
			"host": "sandbox-smtp.mailcatch.app",
			"port": 2525
		},
		"Maildev": {
			"description": "MailDev (local email testing)",
			"port": 1025,
			"ignoreTLS": true
		},
		"MailerSend": {
			"description": "MailerSend",
			"host": "smtp.mailersend.net",
			"port": 587
		},
		"Mailgun": {
			"description": "Mailgun",
			"host": "smtp.mailgun.org",
			"port": 465,
			"secure": true
		},
		"Mailjet": {
			"description": "Mailjet",
			"host": "in.mailjet.com",
			"port": 587
		},
		"Mailosaur": {
			"description": "Mailosaur (email testing service)",
			"host": "mailosaur.io",
			"port": 25
		},
		"Mailtrap": {
			"description": "Mailtrap",
			"host": "live.smtp.mailtrap.io",
			"port": 587
		},
		"Mandrill": {
			"description": "Mandrill (by Mailchimp)",
			"host": "smtp.mandrillapp.com",
			"port": 587
		},
		"Naver": {
			"description": "Naver Mail (Korean email provider)",
			"host": "smtp.naver.com",
			"port": 587
		},
		"OhMySMTP": {
			"description": "OhMySMTP (email delivery service)",
			"host": "smtp.ohmysmtp.com",
			"port": 587,
			"secure": false
		},
		"One": {
			"description": "One.com Email",
			"host": "send.one.com",
			"port": 465,
			"secure": true
		},
		"OpenMailBox": {
			"description": "OpenMailBox",
			"aliases": ["OMB", "openmailbox.org"],
			"host": "smtp.openmailbox.org",
			"port": 465,
			"secure": true
		},
		"Outlook365": {
			"description": "Microsoft 365 / Office 365",
			"host": "smtp.office365.com",
			"port": 587,
			"secure": false
		},
		"Postmark": {
			"description": "Postmark",
			"aliases": ["PostmarkApp"],
			"host": "smtp.postmarkapp.com",
			"port": 2525
		},
		"Proton": {
			"description": "Proton Mail",
			"aliases": [
				"ProtonMail",
				"Proton.me",
				"Protonmail.com",
				"Protonmail.ch"
			],
			"domains": [
				"proton.me",
				"protonmail.com",
				"pm.me",
				"protonmail.ch"
			],
			"host": "smtp.protonmail.ch",
			"port": 587,
			"requireTLS": true
		},
		"qiye.aliyun": {
			"description": "Alibaba Mail Enterprise Edition",
			"host": "smtp.mxhichina.com",
			"port": "465",
			"secure": true
		},
		"QQ": {
			"description": "QQ Mail",
			"domains": ["qq.com"],
			"host": "smtp.qq.com",
			"port": 465,
			"secure": true
		},
		"QQex": {
			"description": "QQ Enterprise Mail",
			"aliases": ["QQ Enterprise"],
			"domains": ["exmail.qq.com"],
			"host": "smtp.exmail.qq.com",
			"port": 465,
			"secure": true
		},
		"Resend": {
			"description": "Resend",
			"host": "smtp.resend.com",
			"port": 465,
			"secure": true
		},
		"Runbox": {
			"description": "Runbox (Norwegian email provider)",
			"domains": ["runbox.com"],
			"host": "smtp.runbox.com",
			"port": 465,
			"secure": true
		},
		"SendCloud": {
			"description": "SendCloud (Chinese email delivery)",
			"host": "smtp.sendcloud.net",
			"port": 2525
		},
		"SendGrid": {
			"description": "SendGrid",
			"host": "smtp.sendgrid.net",
			"port": 587
		},
		"SendinBlue": {
			"description": "Brevo (formerly Sendinblue)",
			"aliases": ["Brevo"],
			"host": "smtp-relay.brevo.com",
			"port": 587
		},
		"SendPulse": {
			"description": "SendPulse",
			"host": "smtp-pulse.com",
			"port": 465,
			"secure": true
		},
		"SES": {
			"description": "AWS SES US East (N. Virginia)",
			"host": "email-smtp.us-east-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-AP-NORTHEAST-1": {
			"description": "AWS SES Asia Pacific (Tokyo)",
			"host": "email-smtp.ap-northeast-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-AP-NORTHEAST-2": {
			"description": "AWS SES Asia Pacific (Seoul)",
			"host": "email-smtp.ap-northeast-2.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-AP-NORTHEAST-3": {
			"description": "AWS SES Asia Pacific (Osaka)",
			"host": "email-smtp.ap-northeast-3.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-AP-SOUTH-1": {
			"description": "AWS SES Asia Pacific (Mumbai)",
			"host": "email-smtp.ap-south-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-AP-SOUTHEAST-1": {
			"description": "AWS SES Asia Pacific (Singapore)",
			"host": "email-smtp.ap-southeast-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-AP-SOUTHEAST-2": {
			"description": "AWS SES Asia Pacific (Sydney)",
			"host": "email-smtp.ap-southeast-2.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-CA-CENTRAL-1": {
			"description": "AWS SES Canada (Central)",
			"host": "email-smtp.ca-central-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-EU-CENTRAL-1": {
			"description": "AWS SES Europe (Frankfurt)",
			"host": "email-smtp.eu-central-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-EU-NORTH-1": {
			"description": "AWS SES Europe (Stockholm)",
			"host": "email-smtp.eu-north-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-EU-WEST-1": {
			"description": "AWS SES Europe (Ireland)",
			"host": "email-smtp.eu-west-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-EU-WEST-2": {
			"description": "AWS SES Europe (London)",
			"host": "email-smtp.eu-west-2.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-EU-WEST-3": {
			"description": "AWS SES Europe (Paris)",
			"host": "email-smtp.eu-west-3.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-SA-EAST-1": {
			"description": "AWS SES South America (São Paulo)",
			"host": "email-smtp.sa-east-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-US-EAST-1": {
			"description": "AWS SES US East (N. Virginia)",
			"host": "email-smtp.us-east-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-US-EAST-2": {
			"description": "AWS SES US East (Ohio)",
			"host": "email-smtp.us-east-2.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-US-GOV-EAST-1": {
			"description": "AWS SES GovCloud (US-East)",
			"host": "email-smtp.us-gov-east-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-US-GOV-WEST-1": {
			"description": "AWS SES GovCloud (US-West)",
			"host": "email-smtp.us-gov-west-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-US-WEST-1": {
			"description": "AWS SES US West (N. California)",
			"host": "email-smtp.us-west-1.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"SES-US-WEST-2": {
			"description": "AWS SES US West (Oregon)",
			"host": "email-smtp.us-west-2.amazonaws.com",
			"port": 465,
			"secure": true
		},
		"Seznam": {
			"description": "Seznam Email (Czech email provider)",
			"aliases": ["Seznam Email"],
			"domains": [
				"seznam.cz",
				"email.cz",
				"post.cz",
				"spoluzaci.cz"
			],
			"host": "smtp.seznam.cz",
			"port": 465,
			"secure": true
		},
		"SMTP2GO": {
			"description": "SMTP2GO",
			"host": "mail.smtp2go.com",
			"port": 2525
		},
		"Sparkpost": {
			"description": "SparkPost",
			"aliases": ["SparkPost", "SparkPost Mail"],
			"domains": ["sparkpost.com"],
			"host": "smtp.sparkpostmail.com",
			"port": 587,
			"secure": false
		},
		"Tipimail": {
			"description": "Tipimail (email delivery service)",
			"host": "smtp.tipimail.com",
			"port": 587
		},
		"Tutanota": {
			"description": "Tutanota (Tuta Mail)",
			"domains": [
				"tutanota.com",
				"tuta.com",
				"tutanota.de",
				"tuta.io"
			],
			"host": "smtp.tutanota.com",
			"port": 465,
			"secure": true
		},
		"Yahoo": {
			"description": "Yahoo Mail",
			"domains": ["yahoo.com"],
			"host": "smtp.mail.yahoo.com",
			"port": 465,
			"secure": true
		},
		"Yandex": {
			"description": "Yandex Mail",
			"domains": ["yandex.ru"],
			"host": "smtp.yandex.ru",
			"port": 465,
			"secure": true
		},
		"Zimbra": {
			"description": "Zimbra Mail Server",
			"aliases": ["Zimbra Collaboration"],
			"host": "smtp.zimbra.com",
			"port": 587,
			"requireTLS": true
		},
		"Zoho": {
			"description": "Zoho Mail",
			"host": "smtp.zoho.com",
			"port": 465,
			"secure": true,
			"authMethod": "LOGIN"
		}
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/well-known/index.js
var require_well_known = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const services = require_services();
	const normalized = {};
	Object.keys(services).forEach((key) => {
		let service = services[key];
		normalized[normalizeKey(key)] = normalizeService(service);
		[].concat(service.aliases || []).forEach((alias$1) => {
			normalized[normalizeKey(alias$1)] = normalizeService(service);
		});
		[].concat(service.domains || []).forEach((domain) => {
			normalized[normalizeKey(domain)] = normalizeService(service);
		});
	});
	function normalizeKey(key) {
		return key.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
	}
	function normalizeService(service) {
		let filter = ["domains", "aliases"];
		let response = {};
		Object.keys(service).forEach((key) => {
			if (filter.indexOf(key) < 0) response[key] = service[key];
		});
		return response;
	}
	/**
	* Resolves SMTP config for given key. Key can be a name (like 'Gmail'), alias (like 'Google Mail') or
	* an email address (like 'test@googlemail.com').
	*
	* @param {String} key [description]
	* @returns {Object} SMTP config or false if not found
	*/
	module.exports = function(key) {
		key = normalizeKey(key.split("@").pop());
		return normalized[key] || false;
	};
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/smtp-pool/index.js
var require_smtp_pool = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$2 = __require("events");
	const PoolResource = require_pool_resource();
	const SMTPConnection$1 = require_smtp_connection();
	const wellKnown$1 = require_well_known();
	const shared$6 = require_shared();
	const packageData$6 = require_package();
	/**
	* Creates a SMTP pool transport object for Nodemailer
	*
	* @constructor
	* @param {Object} options SMTP Connection options
	*/
	var SMTPPool$1 = class extends EventEmitter$2 {
		constructor(options) {
			super();
			options = options || {};
			if (typeof options === "string") options = { url: options };
			let urlData;
			let service = options.service;
			if (typeof options.getSocket === "function") this.getSocket = options.getSocket;
			if (options.url) {
				urlData = shared$6.parseConnectionUrl(options.url);
				service = service || urlData.service;
			}
			this.options = shared$6.assign(false, options, urlData, service && wellKnown$1(service));
			this.options.maxConnections = this.options.maxConnections || 5;
			this.options.maxMessages = this.options.maxMessages || 100;
			this.logger = shared$6.getLogger(this.options, { component: this.options.component || "smtp-pool" });
			let connection = new SMTPConnection$1(this.options);
			this.name = "SMTP (pool)";
			this.version = packageData$6.version + "[client:" + connection.version + "]";
			this._rateLimit = {
				counter: 0,
				timeout: null,
				waiting: [],
				checkpoint: false,
				delta: Number(this.options.rateDelta) || 1e3,
				limit: Number(this.options.rateLimit) || 0
			};
			this._closed = false;
			this._queue = [];
			this._connections = [];
			this._connectionCounter = 0;
			this.idling = true;
			setImmediate(() => {
				if (this.idling) this.emit("idle");
			});
		}
		/**
		* Placeholder function for creating proxy sockets. This method immediatelly returns
		* without a socket
		*
		* @param {Object} options Connection options
		* @param {Function} callback Callback function to run with the socket keys
		*/
		getSocket(options, callback) {
			return setImmediate(() => callback(null, false));
		}
		/**
		* Queues an e-mail to be sent using the selected settings
		*
		* @param {Object} mail Mail object
		* @param {Function} callback Callback function
		*/
		send(mail, callback) {
			if (this._closed) return false;
			this._queue.push({
				mail,
				requeueAttempts: 0,
				callback
			});
			if (this.idling && this._queue.length >= this.options.maxConnections) this.idling = false;
			setImmediate(() => this._processMessages());
			return true;
		}
		/**
		* Closes all connections in the pool. If there is a message being sent, the connection
		* is closed later
		*/
		close() {
			let connection;
			let len = this._connections.length;
			this._closed = true;
			clearTimeout(this._rateLimit.timeout);
			if (!len && !this._queue.length) return;
			for (let i = len - 1; i >= 0; i--) if (this._connections[i] && this._connections[i].available) {
				connection = this._connections[i];
				connection.close();
				this.logger.info({
					tnx: "connection",
					cid: connection.id,
					action: "removed"
				}, "Connection #%s removed", connection.id);
			}
			if (len && !this._connections.length) this.logger.debug({ tnx: "connection" }, "All connections removed");
			if (!this._queue.length) return;
			let invokeCallbacks = () => {
				if (!this._queue.length) {
					this.logger.debug({ tnx: "connection" }, "Pending queue entries cleared");
					return;
				}
				let entry = this._queue.shift();
				if (entry && typeof entry.callback === "function") try {
					entry.callback(/* @__PURE__ */ new Error("Connection pool was closed"));
				} catch (E) {
					this.logger.error({
						err: E,
						tnx: "callback",
						cid: connection.id
					}, "Callback error for #%s: %s", connection.id, E.message);
				}
				setImmediate(invokeCallbacks);
			};
			setImmediate(invokeCallbacks);
		}
		/**
		* Check the queue and available connections. If there is a message to be sent and there is
		* an available connection, then use this connection to send the mail
		*/
		_processMessages() {
			let connection;
			let i, len;
			if (this._closed) return;
			if (!this._queue.length) {
				if (!this.idling) {
					this.idling = true;
					this.emit("idle");
				}
				return;
			}
			for (i = 0, len = this._connections.length; i < len; i++) if (this._connections[i].available) {
				connection = this._connections[i];
				break;
			}
			if (!connection && this._connections.length < this.options.maxConnections) connection = this._createConnection();
			if (!connection) {
				this.idling = false;
				return;
			}
			if (!this.idling && this._queue.length < this.options.maxConnections) {
				this.idling = true;
				this.emit("idle");
			}
			let entry = connection.queueEntry = this._queue.shift();
			entry.messageId = (connection.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, "");
			connection.available = false;
			this.logger.debug({
				tnx: "pool",
				cid: connection.id,
				messageId: entry.messageId,
				action: "assign"
			}, "Assigned message <%s> to #%s (%s)", entry.messageId, connection.id, connection.messages + 1);
			if (this._rateLimit.limit) {
				this._rateLimit.counter++;
				if (!this._rateLimit.checkpoint) this._rateLimit.checkpoint = Date.now();
			}
			connection.send(entry.mail, (err, info) => {
				if (entry === connection.queueEntry) {
					try {
						entry.callback(err, info);
					} catch (E) {
						this.logger.error({
							err: E,
							tnx: "callback",
							cid: connection.id
						}, "Callback error for #%s: %s", connection.id, E.message);
					}
					connection.queueEntry = false;
				}
			});
		}
		/**
		* Creates a new pool resource
		*/
		_createConnection() {
			let connection = new PoolResource(this);
			connection.id = ++this._connectionCounter;
			this.logger.info({
				tnx: "pool",
				cid: connection.id,
				action: "conection"
			}, "Created new pool resource #%s", connection.id);
			connection.on("available", () => {
				this.logger.debug({
					tnx: "connection",
					cid: connection.id,
					action: "available"
				}, "Connection #%s became available", connection.id);
				if (this._closed) this.close();
				else this._processMessages();
			});
			connection.once("error", (err) => {
				if (err.code !== "EMAXLIMIT") this.logger.warn({
					err,
					tnx: "pool",
					cid: connection.id
				}, "Pool Error for #%s: %s", connection.id, err.message);
				else this.logger.debug({
					tnx: "pool",
					cid: connection.id,
					action: "maxlimit"
				}, "Max messages limit exchausted for #%s", connection.id);
				if (connection.queueEntry) {
					try {
						connection.queueEntry.callback(err);
					} catch (E) {
						this.logger.error({
							err: E,
							tnx: "callback",
							cid: connection.id
						}, "Callback error for #%s: %s", connection.id, E.message);
					}
					connection.queueEntry = false;
				}
				this._removeConnection(connection);
				this._continueProcessing();
			});
			connection.once("close", () => {
				this.logger.info({
					tnx: "connection",
					cid: connection.id,
					action: "closed"
				}, "Connection #%s was closed", connection.id);
				this._removeConnection(connection);
				if (connection.queueEntry) setTimeout(() => {
					if (connection.queueEntry) if (this._shouldRequeuOnConnectionClose(connection.queueEntry)) this._requeueEntryOnConnectionClose(connection);
					else this._failDeliveryOnConnectionClose(connection);
					this._continueProcessing();
				}, 50);
				else {
					if (!this._closed && this.idling && !this._connections.length) this.emit("clear");
					this._continueProcessing();
				}
			});
			this._connections.push(connection);
			return connection;
		}
		_shouldRequeuOnConnectionClose(queueEntry) {
			if (this.options.maxRequeues === void 0 || this.options.maxRequeues < 0) return true;
			return queueEntry.requeueAttempts < this.options.maxRequeues;
		}
		_failDeliveryOnConnectionClose(connection) {
			if (connection.queueEntry && connection.queueEntry.callback) {
				try {
					connection.queueEntry.callback(/* @__PURE__ */ new Error("Reached maximum number of retries after connection was closed"));
				} catch (E) {
					this.logger.error({
						err: E,
						tnx: "callback",
						messageId: connection.queueEntry.messageId,
						cid: connection.id
					}, "Callback error for #%s: %s", connection.id, E.message);
				}
				connection.queueEntry = false;
			}
		}
		_requeueEntryOnConnectionClose(connection) {
			connection.queueEntry.requeueAttempts = connection.queueEntry.requeueAttempts + 1;
			this.logger.debug({
				tnx: "pool",
				cid: connection.id,
				messageId: connection.queueEntry.messageId,
				action: "requeue"
			}, "Re-queued message <%s> for #%s. Attempt: #%s", connection.queueEntry.messageId, connection.id, connection.queueEntry.requeueAttempts);
			this._queue.unshift(connection.queueEntry);
			connection.queueEntry = false;
		}
		/**
		* Continue to process message if the pool hasn't closed
		*/
		_continueProcessing() {
			if (this._closed) this.close();
			else setTimeout(() => this._processMessages(), 100);
		}
		/**
		* Remove resource from pool
		*
		* @param {Object} connection The PoolResource to remove
		*/
		_removeConnection(connection) {
			let index$1 = this._connections.indexOf(connection);
			if (index$1 !== -1) this._connections.splice(index$1, 1);
		}
		/**
		* Checks if connections have hit current rate limit and if so, queues the availability callback
		*
		* @param {Function} callback Callback function to run once rate limiter has been cleared
		*/
		_checkRateLimit(callback) {
			if (!this._rateLimit.limit) return callback();
			let now = Date.now();
			if (this._rateLimit.counter < this._rateLimit.limit) return callback();
			this._rateLimit.waiting.push(callback);
			if (this._rateLimit.checkpoint <= now - this._rateLimit.delta) return this._clearRateLimit();
			else if (!this._rateLimit.timeout) {
				this._rateLimit.timeout = setTimeout(() => this._clearRateLimit(), this._rateLimit.delta - (now - this._rateLimit.checkpoint));
				this._rateLimit.checkpoint = now;
			}
		}
		/**
		* Clears current rate limit limitation and runs paused callback
		*/
		_clearRateLimit() {
			clearTimeout(this._rateLimit.timeout);
			this._rateLimit.timeout = null;
			this._rateLimit.counter = 0;
			this._rateLimit.checkpoint = false;
			while (this._rateLimit.waiting.length) {
				let cb = this._rateLimit.waiting.shift();
				setImmediate(cb);
			}
		}
		/**
		* Returns true if there are free slots in the queue
		*/
		isIdle() {
			return this.idling;
		}
		/**
		* Verifies SMTP configuration
		*
		* @param {Function} callback Callback function
		*/
		verify(callback) {
			let promise;
			if (!callback) promise = new Promise((resolve$1, reject) => {
				callback = shared$6.callbackPromise(resolve$1, reject);
			});
			let auth$1 = new PoolResource(this).auth;
			this.getSocket(this.options, (err, socketOptions) => {
				if (err) return callback(err);
				let options = this.options;
				if (socketOptions && socketOptions.connection) {
					this.logger.info({
						tnx: "proxy",
						remoteAddress: socketOptions.connection.remoteAddress,
						remotePort: socketOptions.connection.remotePort,
						destHost: options.host || "",
						destPort: options.port || "",
						action: "connected"
					}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
					options = shared$6.assign(false, options);
					Object.keys(socketOptions).forEach((key) => {
						options[key] = socketOptions[key];
					});
				}
				let connection = new SMTPConnection$1(options);
				let returned = false;
				connection.once("error", (err$1) => {
					if (returned) return;
					returned = true;
					connection.close();
					return callback(err$1);
				});
				connection.once("end", () => {
					if (returned) return;
					returned = true;
					return callback(/* @__PURE__ */ new Error("Connection closed"));
				});
				let finalize = () => {
					if (returned) return;
					returned = true;
					connection.quit();
					return callback(null, true);
				};
				connection.connect(() => {
					if (returned) return;
					if (auth$1 && (connection.allowsAuth || options.forceAuth)) connection.login(auth$1, (err$1) => {
						if (returned) return;
						if (err$1) {
							returned = true;
							connection.close();
							return callback(err$1);
						}
						finalize();
					});
					else if (!auth$1 && connection.allowsAuth && options.forceAuth) {
						let err$1 = /* @__PURE__ */ new Error("Authentication info was not provided");
						err$1.code = "NoAuth";
						returned = true;
						connection.close();
						return callback(err$1);
					} else finalize();
				});
			});
			return promise;
		}
	};
	module.exports = SMTPPool$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/smtp-transport/index.js
var require_smtp_transport = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter$1 = __require("events");
	const SMTPConnection = require_smtp_connection();
	const wellKnown = require_well_known();
	const shared$5 = require_shared();
	const XOAuth2 = require_xoauth2();
	const packageData$5 = require_package();
	/**
	* Creates a SMTP transport object for Nodemailer
	*
	* @constructor
	* @param {Object} options Connection options
	*/
	var SMTPTransport$1 = class extends EventEmitter$1 {
		constructor(options) {
			super();
			options = options || {};
			if (typeof options === "string") options = { url: options };
			let urlData;
			let service = options.service;
			if (typeof options.getSocket === "function") this.getSocket = options.getSocket;
			if (options.url) {
				urlData = shared$5.parseConnectionUrl(options.url);
				service = service || urlData.service;
			}
			this.options = shared$5.assign(false, options, urlData, service && wellKnown(service));
			this.logger = shared$5.getLogger(this.options, { component: this.options.component || "smtp-transport" });
			let connection = new SMTPConnection(this.options);
			this.name = "SMTP";
			this.version = packageData$5.version + "[client:" + connection.version + "]";
			if (this.options.auth) this.auth = this.getAuth({});
		}
		/**
		* Placeholder function for creating proxy sockets. This method immediatelly returns
		* without a socket
		*
		* @param {Object} options Connection options
		* @param {Function} callback Callback function to run with the socket keys
		*/
		getSocket(options, callback) {
			return setImmediate(() => callback(null, false));
		}
		getAuth(authOpts) {
			if (!authOpts) return this.auth;
			let hasAuth = false;
			let authData = {};
			if (this.options.auth && typeof this.options.auth === "object") Object.keys(this.options.auth).forEach((key) => {
				hasAuth = true;
				authData[key] = this.options.auth[key];
			});
			if (authOpts && typeof authOpts === "object") Object.keys(authOpts).forEach((key) => {
				hasAuth = true;
				authData[key] = authOpts[key];
			});
			if (!hasAuth) return false;
			switch ((authData.type || "").toString().toUpperCase()) {
				case "OAUTH2": {
					if (!authData.service && !authData.user) return false;
					let oauth2 = new XOAuth2(authData, this.logger);
					oauth2.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
					oauth2.on("token", (token) => this.mailer.emit("token", token));
					oauth2.on("error", (err) => this.emit("error", err));
					return {
						type: "OAUTH2",
						user: authData.user,
						oauth2,
						method: "XOAUTH2"
					};
				}
				default: return {
					type: (authData.type || "").toString().toUpperCase() || "LOGIN",
					user: authData.user,
					credentials: {
						user: authData.user || "",
						pass: authData.pass,
						options: authData.options
					},
					method: (authData.method || "").trim().toUpperCase() || this.options.authMethod || false
				};
			}
		}
		/**
		* Sends an e-mail using the selected settings
		*
		* @param {Object} mail Mail object
		* @param {Function} callback Callback function
		*/
		send(mail, callback) {
			this.getSocket(this.options, (err, socketOptions) => {
				if (err) return callback(err);
				let returned = false;
				let options = this.options;
				if (socketOptions && socketOptions.connection) {
					this.logger.info({
						tnx: "proxy",
						remoteAddress: socketOptions.connection.remoteAddress,
						remotePort: socketOptions.connection.remotePort,
						destHost: options.host || "",
						destPort: options.port || "",
						action: "connected"
					}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
					options = shared$5.assign(false, options);
					Object.keys(socketOptions).forEach((key) => {
						options[key] = socketOptions[key];
					});
				}
				let connection = new SMTPConnection(options);
				connection.once("error", (err$1) => {
					if (returned) return;
					returned = true;
					connection.close();
					return callback(err$1);
				});
				connection.once("end", () => {
					if (returned) return;
					let timer = setTimeout(() => {
						if (returned) return;
						returned = true;
						let err$1 = /* @__PURE__ */ new Error("Unexpected socket close");
						if (connection && connection._socket && connection._socket.upgrading) err$1.code = "ETLS";
						callback(err$1);
					}, 1e3);
					try {
						timer.unref();
					} catch (_E) {}
				});
				let sendMessage = () => {
					let envelope = mail.message.getEnvelope();
					let messageId = mail.message.messageId();
					let recipients = [].concat(envelope.to || []);
					if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
					if (mail.data.dsn) envelope.dsn = mail.data.dsn;
					if (mail.data.requireTLSExtensionEnabled) envelope.requireTLSExtensionEnabled = mail.data.requireTLSExtensionEnabled;
					this.logger.info({
						tnx: "send",
						messageId
					}, "Sending message %s to <%s>", messageId, recipients.join(", "));
					connection.send(envelope, mail.message.createReadStream(), (err$1, info) => {
						returned = true;
						connection.close();
						if (err$1) {
							this.logger.error({
								err: err$1,
								tnx: "send"
							}, "Send error for %s: %s", messageId, err$1.message);
							return callback(err$1);
						}
						info.envelope = {
							from: envelope.from,
							to: envelope.to
						};
						info.messageId = messageId;
						try {
							return callback(null, info);
						} catch (E) {
							this.logger.error({
								err: E,
								tnx: "callback"
							}, "Callback error for %s: %s", messageId, E.message);
						}
					});
				};
				connection.connect(() => {
					if (returned) return;
					let auth$1 = this.getAuth(mail.data.auth);
					if (auth$1 && (connection.allowsAuth || options.forceAuth)) connection.login(auth$1, (err$1) => {
						if (auth$1 && auth$1 !== this.auth && auth$1.oauth2) auth$1.oauth2.removeAllListeners();
						if (returned) return;
						if (err$1) {
							returned = true;
							connection.close();
							return callback(err$1);
						}
						sendMessage();
					});
					else sendMessage();
				});
			});
		}
		/**
		* Verifies SMTP configuration
		*
		* @param {Function} callback Callback function
		*/
		verify(callback) {
			let promise;
			if (!callback) promise = new Promise((resolve$1, reject) => {
				callback = shared$5.callbackPromise(resolve$1, reject);
			});
			this.getSocket(this.options, (err, socketOptions) => {
				if (err) return callback(err);
				let options = this.options;
				if (socketOptions && socketOptions.connection) {
					this.logger.info({
						tnx: "proxy",
						remoteAddress: socketOptions.connection.remoteAddress,
						remotePort: socketOptions.connection.remotePort,
						destHost: options.host || "",
						destPort: options.port || "",
						action: "connected"
					}, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
					options = shared$5.assign(false, options);
					Object.keys(socketOptions).forEach((key) => {
						options[key] = socketOptions[key];
					});
				}
				let connection = new SMTPConnection(options);
				let returned = false;
				connection.once("error", (err$1) => {
					if (returned) return;
					returned = true;
					connection.close();
					return callback(err$1);
				});
				connection.once("end", () => {
					if (returned) return;
					returned = true;
					return callback(/* @__PURE__ */ new Error("Connection closed"));
				});
				let finalize = () => {
					if (returned) return;
					returned = true;
					connection.quit();
					return callback(null, true);
				};
				connection.connect(() => {
					if (returned) return;
					let authData = this.getAuth({});
					if (authData && (connection.allowsAuth || options.forceAuth)) connection.login(authData, (err$1) => {
						if (returned) return;
						if (err$1) {
							returned = true;
							connection.close();
							return callback(err$1);
						}
						finalize();
					});
					else if (!authData && connection.allowsAuth && options.forceAuth) {
						let err$1 = /* @__PURE__ */ new Error("Authentication info was not provided");
						err$1.code = "NoAuth";
						returned = true;
						connection.close();
						return callback(err$1);
					} else finalize();
				});
			});
			return promise;
		}
		/**
		* Releases resources
		*/
		close() {
			if (this.auth && this.auth.oauth2) this.auth.oauth2.removeAllListeners();
			this.emit("close");
		}
	};
	module.exports = SMTPTransport$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/sendmail-transport/index.js
var require_sendmail_transport = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const spawn = __require("child_process").spawn;
	const packageData$4 = require_package();
	const shared$4 = require_shared();
	/**
	* Generates a Transport object for Sendmail
	*
	* Possible options can be the following:
	*
	*  * **path** optional path to sendmail binary
	*  * **newline** either 'windows' or 'unix'
	*  * **args** an array of arguments for the sendmail binary
	*
	* @constructor
	* @param {Object} optional config parameter for Sendmail
	*/
	var SendmailTransport$1 = class {
		constructor(options) {
			options = options || {};
			this._spawn = spawn;
			this.options = options || {};
			this.name = "Sendmail";
			this.version = packageData$4.version;
			this.path = "sendmail";
			this.args = false;
			this.winbreak = false;
			this.logger = shared$4.getLogger(this.options, { component: this.options.component || "sendmail" });
			if (options) {
				if (typeof options === "string") this.path = options;
				else if (typeof options === "object") {
					if (options.path) this.path = options.path;
					if (Array.isArray(options.args)) this.args = options.args;
					this.winbreak = [
						"win",
						"windows",
						"dos",
						"\r\n"
					].includes((options.newline || "").toString().toLowerCase());
				}
			}
		}
		/**
		* <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
		*
		* @param {Object} emailMessage MailComposer object
		* @param {Function} callback Callback function to run when the sending is completed
		*/
		send(mail, done) {
			mail.message.keepBcc = true;
			let envelope = mail.data.envelope || mail.message.getEnvelope();
			let messageId = mail.message.messageId();
			let args;
			let sendmail;
			let returned;
			if ([].concat(envelope.from || []).concat(envelope.to || []).some((addr) => /^-/.test(addr))) return done(/* @__PURE__ */ new Error("Can not send mail. Invalid envelope addresses."));
			if (this.args) args = ["-i"].concat(this.args).concat(envelope.to);
			else args = ["-i"].concat(envelope.from ? ["-f", envelope.from] : []).concat(envelope.to);
			let callback = (err) => {
				if (returned) return;
				returned = true;
				if (typeof done === "function") if (err) return done(err);
				else return done(null, {
					envelope: mail.data.envelope || mail.message.getEnvelope(),
					messageId,
					response: "Messages queued for delivery"
				});
			};
			try {
				sendmail = this._spawn(this.path, args);
			} catch (E) {
				this.logger.error({
					err: E,
					tnx: "spawn",
					messageId
				}, "Error occurred while spawning sendmail. %s", E.message);
				return callback(E);
			}
			if (sendmail) {
				sendmail.on("error", (err) => {
					this.logger.error({
						err,
						tnx: "spawn",
						messageId
					}, "Error occurred when sending message %s. %s", messageId, err.message);
					callback(err);
				});
				sendmail.once("exit", (code) => {
					if (!code) return callback();
					let err;
					if (code === 127) err = /* @__PURE__ */ new Error("Sendmail command not found, process exited with code " + code);
					else err = /* @__PURE__ */ new Error("Sendmail exited with code " + code);
					this.logger.error({
						err,
						tnx: "stdin",
						messageId
					}, "Error sending message %s to sendmail. %s", messageId, err.message);
					callback(err);
				});
				sendmail.once("close", callback);
				sendmail.stdin.on("error", (err) => {
					this.logger.error({
						err,
						tnx: "stdin",
						messageId
					}, "Error occurred when piping message %s to sendmail. %s", messageId, err.message);
					callback(err);
				});
				let recipients = [].concat(envelope.to || []);
				if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
				this.logger.info({
					tnx: "send",
					messageId
				}, "Sending message %s to <%s>", messageId, recipients.join(", "));
				let sourceStream = mail.message.createReadStream();
				sourceStream.once("error", (err) => {
					this.logger.error({
						err,
						tnx: "stdin",
						messageId
					}, "Error occurred when generating message %s. %s", messageId, err.message);
					sendmail.kill("SIGINT");
					callback(err);
				});
				sourceStream.pipe(sendmail.stdin);
			} else return callback(/* @__PURE__ */ new Error("sendmail was not found"));
		}
	};
	module.exports = SendmailTransport$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/stream-transport/index.js
var require_stream_transport = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const packageData$3 = require_package();
	const shared$3 = require_shared();
	/**
	* Generates a Transport object for streaming
	*
	* Possible options can be the following:
	*
	*  * **buffer** if true, then returns the message as a Buffer object instead of a stream
	*  * **newline** either 'windows' or 'unix'
	*
	* @constructor
	* @param {Object} optional config parameter
	*/
	var StreamTransport$1 = class {
		constructor(options) {
			options = options || {};
			this.options = options || {};
			this.name = "StreamTransport";
			this.version = packageData$3.version;
			this.logger = shared$3.getLogger(this.options, { component: this.options.component || "stream-transport" });
			this.winbreak = [
				"win",
				"windows",
				"dos",
				"\r\n"
			].includes((options.newline || "").toString().toLowerCase());
		}
		/**
		* Compiles a mailcomposer message and forwards it to handler that sends it
		*
		* @param {Object} emailMessage MailComposer object
		* @param {Function} callback Callback function to run when the sending is completed
		*/
		send(mail, done) {
			mail.message.keepBcc = true;
			let envelope = mail.data.envelope || mail.message.getEnvelope();
			let messageId = mail.message.messageId();
			let recipients = [].concat(envelope.to || []);
			if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
			this.logger.info({
				tnx: "send",
				messageId
			}, "Sending message %s to <%s> using %s line breaks", messageId, recipients.join(", "), this.winbreak ? "<CR><LF>" : "<LF>");
			setImmediate(() => {
				let stream;
				try {
					stream = mail.message.createReadStream();
				} catch (E) {
					this.logger.error({
						err: E,
						tnx: "send",
						messageId
					}, "Creating send stream failed for %s. %s", messageId, E.message);
					return done(E);
				}
				if (!this.options.buffer) {
					stream.once("error", (err) => {
						this.logger.error({
							err,
							tnx: "send",
							messageId
						}, "Failed creating message for %s. %s", messageId, err.message);
					});
					return done(null, {
						envelope: mail.data.envelope || mail.message.getEnvelope(),
						messageId,
						message: stream
					});
				}
				let chunks = [];
				let chunklen = 0;
				stream.on("readable", () => {
					let chunk;
					while ((chunk = stream.read()) !== null) {
						chunks.push(chunk);
						chunklen += chunk.length;
					}
				});
				stream.once("error", (err) => {
					this.logger.error({
						err,
						tnx: "send",
						messageId
					}, "Failed creating message for %s. %s", messageId, err.message);
					return done(err);
				});
				stream.on("end", () => done(null, {
					envelope: mail.data.envelope || mail.message.getEnvelope(),
					messageId,
					message: Buffer.concat(chunks, chunklen)
				}));
			});
		}
	};
	module.exports = StreamTransport$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/json-transport/index.js
var require_json_transport = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const packageData$2 = require_package();
	const shared$2 = require_shared();
	/**
	* Generates a Transport object to generate JSON output
	*
	* @constructor
	* @param {Object} optional config parameter
	*/
	var JSONTransport$1 = class {
		constructor(options) {
			options = options || {};
			this.options = options || {};
			this.name = "JSONTransport";
			this.version = packageData$2.version;
			this.logger = shared$2.getLogger(this.options, { component: this.options.component || "json-transport" });
		}
		/**
		* <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
		*
		* @param {Object} emailMessage MailComposer object
		* @param {Function} callback Callback function to run when the sending is completed
		*/
		send(mail, done) {
			mail.message.keepBcc = true;
			let envelope = mail.data.envelope || mail.message.getEnvelope();
			let messageId = mail.message.messageId();
			let recipients = [].concat(envelope.to || []);
			if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
			this.logger.info({
				tnx: "send",
				messageId
			}, "Composing JSON structure of %s to <%s>", messageId, recipients.join(", "));
			setImmediate(() => {
				mail.normalize((err, data) => {
					if (err) {
						this.logger.error({
							err,
							tnx: "send",
							messageId
						}, "Failed building JSON structure for %s. %s", messageId, err.message);
						return done(err);
					}
					delete data.envelope;
					delete data.normalizedHeaders;
					return done(null, {
						envelope,
						messageId,
						message: this.options.skipEncoding ? data : JSON.stringify(data)
					});
				});
			});
		}
	};
	module.exports = JSONTransport$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/ses-transport/index.js
var require_ses_transport = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const EventEmitter = __require("events");
	const packageData$1 = require_package();
	const shared$1 = require_shared();
	const LeWindows = require_le_windows();
	const MimeNode = require_mime_node();
	/**
	* Generates a Transport object for AWS SES
	*
	* @constructor
	* @param {Object} optional config parameter
	*/
	var SESTransport$1 = class extends EventEmitter {
		constructor(options) {
			super();
			options = options || {};
			this.options = options || {};
			this.ses = this.options.SES;
			this.name = "SESTransport";
			this.version = packageData$1.version;
			this.logger = shared$1.getLogger(this.options, { component: this.options.component || "ses-transport" });
		}
		getRegion(cb) {
			if (this.ses.sesClient.config && typeof this.ses.sesClient.config.region === "function") return this.ses.sesClient.config.region().then((region) => cb(null, region)).catch((err) => cb(err));
			return cb(null, false);
		}
		/**
		* Compiles a mailcomposer message and forwards it to SES
		*
		* @param {Object} emailMessage MailComposer object
		* @param {Function} callback Callback function to run when the sending is completed
		*/
		send(mail, callback) {
			let statObject = {
				ts: Date.now(),
				pending: true
			};
			let fromHeader = mail.message._headers.find((header) => /^from$/i.test(header.key));
			if (fromHeader) {
				let mimeNode = new MimeNode("text/plain");
				fromHeader = mimeNode._convertAddresses(mimeNode._parseAddresses(fromHeader.value));
			}
			let envelope = mail.data.envelope || mail.message.getEnvelope();
			let messageId = mail.message.messageId();
			let recipients = [].concat(envelope.to || []);
			if (recipients.length > 3) recipients.push("...and " + recipients.splice(2).length + " more");
			this.logger.info({
				tnx: "send",
				messageId
			}, "Sending message %s to <%s>", messageId, recipients.join(", "));
			let getRawMessage = (next) => {
				if (!mail.data._dkim) mail.data._dkim = {};
				if (mail.data._dkim.skipFields && typeof mail.data._dkim.skipFields === "string") mail.data._dkim.skipFields += ":date:message-id";
				else mail.data._dkim.skipFields = "date:message-id";
				let sourceStream = mail.message.createReadStream();
				let stream = sourceStream.pipe(new LeWindows());
				let chunks = [];
				let chunklen = 0;
				stream.on("readable", () => {
					let chunk;
					while ((chunk = stream.read()) !== null) {
						chunks.push(chunk);
						chunklen += chunk.length;
					}
				});
				sourceStream.once("error", (err) => stream.emit("error", err));
				stream.once("error", (err) => {
					next(err);
				});
				stream.once("end", () => next(null, Buffer.concat(chunks, chunklen)));
			};
			setImmediate(() => getRawMessage((err, raw) => {
				if (err) {
					this.logger.error({
						err,
						tnx: "send",
						messageId
					}, "Failed creating message for %s. %s", messageId, err.message);
					statObject.pending = false;
					return callback(err);
				}
				let sesMessage = {
					Content: { Raw: { Data: raw } },
					FromEmailAddress: fromHeader ? fromHeader : envelope.from,
					Destination: { ToAddresses: envelope.to }
				};
				Object.keys(mail.data.ses || {}).forEach((key) => {
					sesMessage[key] = mail.data.ses[key];
				});
				this.getRegion((err$1, region) => {
					if (err$1 || !region) region = "us-east-1";
					const command = new this.ses.SendEmailCommand(sesMessage);
					this.ses.sesClient.send(command).then((data) => {
						if (region === "us-east-1") region = "email";
						statObject.pending = true;
						callback(null, {
							envelope: {
								from: envelope.from,
								to: envelope.to
							},
							messageId: "<" + data.MessageId + (!/@/.test(data.MessageId) ? "@" + region + ".amazonses.com" : "") + ">",
							response: data.MessageId,
							raw
						});
					}).catch((err$2) => {
						this.logger.error({
							err: err$2,
							tnx: "send"
						}, "Send error for %s: %s", messageId, err$2.message);
						statObject.pending = false;
						callback(err$2);
					});
				});
			}));
		}
		/**
		* Verifies SES configuration
		*
		* @param {Function} callback Callback function
		*/
		verify(callback) {
			let promise;
			if (!callback) promise = new Promise((resolve$1, reject) => {
				callback = shared$1.callbackPromise(resolve$1, reject);
			});
			const cb = (err) => {
				if (err && !["InvalidParameterValue", "MessageRejected"].includes(err.code || err.Code || err.name)) return callback(err);
				return callback(null, true);
			};
			const sesMessage = {
				Content: { Raw: { Data: Buffer.from("From: <invalid@invalid>\r\nTo: <invalid@invalid>\r\n Subject: Invalid\r\n\r\nInvalid") } },
				FromEmailAddress: "invalid@invalid",
				Destination: { ToAddresses: ["invalid@invalid"] }
			};
			this.getRegion((err, region) => {
				if (err || !region) region = "us-east-1";
				const command = new this.ses.SendEmailCommand(sesMessage);
				this.ses.sesClient.send(command).then((data) => cb(null, data)).catch((err$1) => cb(err$1));
			});
			return promise;
		}
	};
	module.exports = SESTransport$1;
}));

//#endregion
//#region ../../node_modules/.bun/nodemailer@7.0.13/node_modules/nodemailer/lib/nodemailer.js
var require_nodemailer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Mailer = require_mailer();
	const shared = require_shared();
	const SMTPPool = require_smtp_pool();
	const SMTPTransport = require_smtp_transport();
	const SendmailTransport = require_sendmail_transport();
	const StreamTransport = require_stream_transport();
	const JSONTransport = require_json_transport();
	const SESTransport = require_ses_transport();
	const nmfetch = require_fetch();
	const packageData = require_package();
	const ETHEREAL_API = (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, "");
	const ETHEREAL_WEB = (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, "");
	const ETHEREAL_API_KEY = (process.env.ETHEREAL_API_KEY || "").replace(/\s*/g, "") || null;
	const ETHEREAL_CACHE = [
		"true",
		"yes",
		"y",
		"1"
	].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase());
	let testAccount = false;
	module.exports.createTransport = function(transporter$1, defaults$5) {
		let urlConfig;
		let options;
		let mailer;
		if (typeof transporter$1 === "object" && typeof transporter$1.send !== "function" || typeof transporter$1 === "string" && /^(smtps?|direct):/i.test(transporter$1)) {
			if (urlConfig = typeof transporter$1 === "string" ? transporter$1 : transporter$1.url) options = shared.parseConnectionUrl(urlConfig);
			else options = transporter$1;
			if (options.pool) transporter$1 = new SMTPPool(options);
			else if (options.sendmail) transporter$1 = new SendmailTransport(options);
			else if (options.streamTransport) transporter$1 = new StreamTransport(options);
			else if (options.jsonTransport) transporter$1 = new JSONTransport(options);
			else if (options.SES) {
				if (options.SES.ses && options.SES.aws) {
					let error$1 = /* @__PURE__ */ new Error("Using legacy SES configuration, expecting @aws-sdk/client-sesv2, see https://nodemailer.com/transports/ses/");
					error$1.code = "LegacyConfig";
					throw error$1;
				}
				transporter$1 = new SESTransport(options);
			} else transporter$1 = new SMTPTransport(options);
		}
		mailer = new Mailer(transporter$1, options, defaults$5);
		return mailer;
	};
	module.exports.createTestAccount = function(apiUrl, callback) {
		let promise;
		if (!callback && typeof apiUrl === "function") {
			callback = apiUrl;
			apiUrl = false;
		}
		if (!callback) promise = new Promise((resolve$1, reject) => {
			callback = shared.callbackPromise(resolve$1, reject);
		});
		if (ETHEREAL_CACHE && testAccount) {
			setImmediate(() => callback(null, testAccount));
			return promise;
		}
		apiUrl = apiUrl || ETHEREAL_API;
		let chunks = [];
		let chunklen = 0;
		let requestHeaders = {};
		let requestBody = {
			requestor: packageData.name,
			version: packageData.version
		};
		if (ETHEREAL_API_KEY) requestHeaders.Authorization = "Bearer " + ETHEREAL_API_KEY;
		let req = nmfetch(apiUrl + "/user", {
			contentType: "application/json",
			method: "POST",
			headers: requestHeaders,
			body: Buffer.from(JSON.stringify(requestBody))
		});
		req.on("readable", () => {
			let chunk;
			while ((chunk = req.read()) !== null) {
				chunks.push(chunk);
				chunklen += chunk.length;
			}
		});
		req.once("error", (err) => callback(err));
		req.once("end", () => {
			let res = Buffer.concat(chunks, chunklen);
			let data;
			let err;
			try {
				data = JSON.parse(res.toString());
			} catch (E) {
				err = E;
			}
			if (err) return callback(err);
			if (data.status !== "success" || data.error) return callback(new Error(data.error || "Request failed"));
			delete data.status;
			testAccount = data;
			callback(null, testAccount);
		});
		return promise;
	};
	module.exports.getTestMessageUrl = function(info) {
		if (!info || !info.response) return false;
		let infoProps = /* @__PURE__ */ new Map();
		info.response.replace(/\[([^\]]+)\]$/, (m, props) => {
			props.replace(/\b([A-Z0-9]+)=([^\s]+)/g, (m$1, key, value) => {
				infoProps.set(key, value);
			});
		});
		if (infoProps.has("STATUS") && infoProps.has("MSGID")) return (testAccount.web || ETHEREAL_WEB) + "/message/" + infoProps.get("MSGID");
		return false;
	};
}));

//#endregion
//#region ../../packages/auth/src/email.ts
var import_nodemailer = /* @__PURE__ */ __toESM(require_nodemailer(), 1);
let transporter = null;
function getTransporter() {
	if (!transporter) {
		if (!env.SMTP_USER || !env.SMTP_PASS) throw new Error("SMTP credentials (SMTP_USER, SMTP_PASS) are not configured");
		transporter = import_nodemailer.default.createTransport({
			host: env.SMTP_HOST,
			port: env.SMTP_PORT,
			secure: false,
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASS
			}
		});
	}
	return transporter;
}
async function sendEmail({ to, subject, html }) {
	try {
		console.log("[EMAIL] Sending email to:", to);
		console.log("[EMAIL] Subject:", subject);
		const result = await getTransporter().sendMail({
			from: `"KineDao" <${env.EMAIL_FROM ?? env.SMTP_USER}>`,
			to,
			subject,
			html
		});
		console.log("[EMAIL] Email sent successfully:", result.messageId);
	} catch (error$1) {
		console.error("[EMAIL] Failed to send email:", error$1);
		throw error$1;
	}
}

//#endregion
//#region ../../packages/auth/src/index.ts
const normalizeBaseUrl$1 = (value) => value.replace(/\/+$/, "");
const isSecureOrigin = env.BETTER_AUTH_URL.startsWith("https://");
const cookieSameSite = "lax";
const frontendBaseUrl$1 = normalizeBaseUrl$1(env.WEB_ORIGIN);
const adminFrontendBaseUrl = frontendBaseUrl$1;
const corsOriginBaseUrl = frontendBaseUrl$1;
const trustedFrontendUrls$1 = Array.from(new Set([
	frontendBaseUrl$1,
	adminFrontendBaseUrl,
	corsOriginBaseUrl,
	...[]
]));
const trustedFrontendOrigins$1 = new Set(trustedFrontendUrls$1.map((url) => new URL(url).origin));
const getSafeFrontendCallback = (value) => {
	if (!value) return null;
	try {
		const url = new URL(value, frontendBaseUrl$1);
		return trustedFrontendOrigins$1.has(url.origin) ? url.toString() : null;
	} catch {
		return null;
	}
};
const buildFrontendUrl = (path$3, params) => {
	const url = new URL(path$3, frontendBaseUrl$1);
	if (params) Object.entries(params).forEach(([key, value]) => {
		if (value) url.searchParams.set(key, value);
	});
	return url.toString();
};
const auth = betterAuth({
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: auth_exports
	}),
	user: { additionalFields: { roles: {
		type: "string[]",
		required: true,
		input: false,
		defaultValue: ["customer"]
	} } },
	trustedOrigins: Array.from(new Set([...trustedFrontendUrls$1, normalizeBaseUrl$1(env.BETTER_AUTH_URL)])),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		autoSignIn: false,
		sendResetPassword: async ({ user: user$2, url }) => {
			console.log("[AUTH] sendResetPassword callback triggered!");
			console.log("[AUTH] User:", user$2.email);
			console.log("[AUTH] Reset URL (original):", url);
			const pathParts = new URL(url).pathname.split("/").filter(Boolean);
			const frontendUrl = buildFrontendUrl("/reset-password", { token: pathParts[pathParts.length - 1] || "" });
			console.log("[AUTH] Reset URL (frontend):", frontendUrl);
			sendEmail({
				to: user$2.email,
				subject: "Reset your password - KineDao",
				html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #4F46E5; margin-top: 0;">Password Reset Request</h1>
                <p>Hi ${user$2.name || "there"},</p>
                <p>We received a request to reset your password for your KineDao account. Click the button below to create a new password:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${frontendUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Reset Password</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this URL into your browser:</p>
                <p style="font-size: 14px; word-break: break-all; color: #4F46E5;">${frontendUrl}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 13px; color: #9ca3af;">This link will expire in 1 hour for security reasons.</p>
                <p style="font-size: 13px; color: #9ca3af;">If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} KineDao. All rights reserved.</p>
            </body>
          </html>
        `
			}).catch(console.error);
		}
	},
	emailVerification: {
		sendVerificationEmail: async ({ user: user$2, url }) => {
			console.log("[AUTH] sendVerificationEmail callback triggered!");
			console.log("[AUTH] User:", user$2.email);
			console.log("[AUTH] Verification URL (original):", url);
			const parsedUrl = new URL(url);
			const frontendUrl = buildFrontendUrl("/verify-email", {
				token: parsedUrl.searchParams.get("token") || "",
				callbackURL: getSafeFrontendCallback(parsedUrl.searchParams.get("callbackURL")) ?? ""
			});
			console.log("[AUTH] Verification URL (frontend):", frontendUrl);
			sendEmail({
				to: user$2.email,
				subject: "Verify your email - KineDao",
				html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #4F46E5; margin-top: 0;">Welcome to KineDao!</h1>
                <p>Hi ${user$2.name},</p>
                <p>Thank you for signing up for KineDao, your trusted marketplace for baby products! To complete your registration, please verify your email address by clicking the button below:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${frontendUrl}" style="display: inline-block; padding: 14px 32px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Verify Email Address</a>
                </div>
                <p style="font-size: 14px; color: #6b7280;">Or copy and paste this URL into your browser:</p>
                <p style="font-size: 14px; word-break: break-all; color: #4F46E5;">${frontendUrl}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                <p style="font-size: 13px; color: #9ca3af;">This link will expire in 24 hours.</p>
                <p style="font-size: 13px; color: #9ca3af;">If you didn't create an account with KineDao, you can safely ignore this email.</p>
              </div>
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} KineDao. All rights reserved.</p>
            </body>
          </html>
        `
			}).catch(console.error);
		},
		sendOnSignUp: true,
		autoSignInAfterVerification: false
	},
	socialProviders: {
		...env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? { google: {
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET
		} } : {},
		...env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET ? { facebook: {
			clientId: env.FACEBOOK_CLIENT_ID,
			clientSecret: env.FACEBOOK_CLIENT_SECRET
		} } : {}
	},
	advanced: { defaultCookieAttributes: {
		sameSite: cookieSameSite,
		secure: isSecureOrigin,
		httpOnly: true
	} },
	plugins: []
});

//#endregion
//#region src/routes/home.ts
const productCardSelect = {
	columns: {
		id: true,
		title: true,
		titleBn: true,
		slug: true,
		brand: true,
		ageRange: true,
		ageRangeMin: true,
		ageRangeMax: true,
		isBpaFree: true,
		isOrganic: true,
		isHypoallergenic: true,
		ratingAvg: true,
		ratingCount: true,
		isNew: true,
		isHot: true
	},
	with: {
		vendor: { columns: {
			id: true,
			name: true,
			slug: true,
			isVerified: true
		} },
		category: { columns: {
			id: true,
			name: true,
			slug: true
		} },
		images: { columns: {
			s3Key: true,
			alt: true,
			sortOrder: true
		} },
		skus: { columns: {
			priceAmount: true,
			compareAtAmount: true,
			currency: true,
			isAvailable: true,
			optionValues: true
		} }
	}
};
function formatProductFromRelation(product) {
	const image = product.images.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0];
	const availableSkus = product.skus.filter((s) => s.isAvailable);
	const sku = (availableSkus.length > 0 ? availableSkus : product.skus).sort((a, b) => a.priceAmount - b.priceAmount)[0];
	const hasVariants = product.skus.length > 1 || product.skus.some((s) => s.optionValues && Object.keys(s.optionValues).length > 0);
	return {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		brand: product.brand,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		ratingAvg: product.ratingAvg,
		ratingCount: product.ratingCount,
		isNew: product.isNew,
		isHot: product.isHot,
		imageUrl: image ? getS3Url(image.s3Key) : null,
		imageAlt: image?.alt || null,
		priceAmount: sku?.priceAmount || 0,
		compareAtAmount: sku?.compareAtAmount || null,
		currency: sku?.currency || "BDT",
		isAvailable: availableSkus.length > 0,
		hasVariants,
		vendor: {
			id: product.vendor.id,
			name: product.vendor.name,
			slug: product.vendor.slug,
			isVerified: product.vendor.isVerified ?? false
		},
		category: {
			id: product.category.id,
			name: product.category.name,
			slug: product.category.slug
		}
	};
}
const homeRouter = new Hono().get("/", describeRoute({
	tags: ["Home"],
	summary: "Get homepage data",
	description: "Fetch all homepage data including hero carousel campaigns, deal wall, flash deals, best sellers, new arrivals, categories, brands, testimonials, featured collections, and Instagram posts.",
	responses: {
		200: {
			description: "Successful response with complete homepage data",
			content: { "application/json": { schema: resolver(z.object({
				heroCarouselCampaigns: z.array(z.any()),
				dealWallCampaigns: z.array(z.any()),
				flashDeals: z.array(z.any()),
				bestSellers: z.array(z.any()),
				newArrivals: z.array(z.any()),
				topCategories: z.array(z.any()),
				popularBrands: z.array(z.any()),
				testimonials: z.array(z.any()),
				featuredCollections: z.array(z.any()),
				instagramPosts: z.array(z.any())
			})) } }
		},
		500: {
			description: "Server error",
			content: { "application/json": { schema: resolver(z.object({
				message: z.string(),
				error: z.string().optional(),
				stack: z.string().optional()
			})) } }
		}
	}
}), async (c) => {
	try {
		const now = /* @__PURE__ */ new Date();
		const activeCampaigns = await db.select().from(campaigns).where(and(lte(campaigns.startsAt, now), sql`(${campaigns.endsAt} IS NULL OR ${campaigns.endsAt} >= ${now})`)).orderBy(asc(campaigns.sortOrder));
		const heroCarouselCampaigns = activeCampaigns.filter((c$1) => c$1.placement === "heroCarousel").map((c$1) => ({
			id: c$1.id,
			placement: c$1.placement,
			title: c$1.title,
			titleBn: c$1.titleBn,
			subtitle: c$1.subtitle,
			subtitleBn: c$1.subtitleBn,
			imageUrl: c$1.imageUrl,
			theme: c$1.theme,
			ctaText: c$1.ctaText,
			ctaTextBn: c$1.ctaTextBn,
			ctaLink: c$1.ctaLink,
			discountPercent: c$1.discountPercent,
			startsAt: c$1.startsAt.toISOString(),
			endsAt: c$1.endsAt?.toISOString() || null
		}));
		const dealWallCampaigns = activeCampaigns.filter((c$1) => c$1.placement === "dealWall").map((c$1) => ({
			id: c$1.id,
			placement: c$1.placement,
			title: c$1.title,
			titleBn: c$1.titleBn,
			subtitle: c$1.subtitle,
			subtitleBn: c$1.subtitleBn,
			imageUrl: c$1.imageUrl,
			theme: c$1.theme,
			ctaText: c$1.ctaText,
			ctaTextBn: c$1.ctaTextBn,
			ctaLink: c$1.ctaLink,
			discountPercent: c$1.discountPercent,
			startsAt: c$1.startsAt.toISOString(),
			endsAt: c$1.endsAt?.toISOString() || null
		}));
		const baseProductWhere = and(eq(products.isActive, true), eq(products.status, "approved"));
		const [flashDealsRaw, bestSellersRaw, newArrivalsRaw] = await Promise.all([
			db.query.products.findMany({
				...productCardSelect,
				where: baseProductWhere,
				orderBy: (productTable, { desc: desc$1 }) => [desc$1(productTable.bestSellerScore), desc$1(productTable.createdAt)],
				limit: 120
			}),
			db.query.products.findMany({
				...productCardSelect,
				where: baseProductWhere,
				orderBy: (productTable, { desc: desc$1 }) => [
					desc$1(productTable.ratingCount),
					desc$1(productTable.bestSellerScore),
					desc$1(productTable.createdAt)
				],
				limit: 12
			}),
			db.query.products.findMany({
				...productCardSelect,
				where: and(baseProductWhere, eq(products.isNew, true)),
				orderBy: (productTable, { desc: desc$1 }) => [desc$1(productTable.createdAt)],
				limit: 12
			})
		]);
		const response = {
			heroCarouselCampaigns,
			dealWallCampaigns,
			flashDeals: flashDealsRaw.map(formatProductFromRelation).filter((p) => p.compareAtAmount !== null).sort((a, b) => {
				const discountA = a.compareAtAmount ? (a.compareAtAmount - a.priceAmount) / a.compareAtAmount * 100 : 0;
				return (b.compareAtAmount ? (b.compareAtAmount - b.priceAmount) / b.compareAtAmount * 100 : 0) - discountA;
			}).slice(0, 12),
			bestSellers: bestSellersRaw.map(formatProductFromRelation).slice(0, 12),
			newArrivals: newArrivalsRaw.map(formatProductFromRelation).slice(0, 12),
			topCategories: (await db.select({
				category: categories,
				productCount: sql`count(${products.id})::int`
			}).from(categories).leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true), eq(products.status, "approved"))).where(sql`${categories.parentId} IS NULL`).groupBy(categories.id).orderBy(asc(categories.sortOrder)).limit(10)).map((row) => ({
				id: row.category.id,
				name: row.category.name,
				nameBn: row.category.nameBn,
				slug: row.category.slug,
				parentId: row.category.parentId,
				iconKey: row.category.iconKey,
				imageUrl: row.category.imageUrl,
				sortOrder: row.category.sortOrder,
				productCount: row.productCount
			})),
			popularBrands: (await db.select().from(brands).where(eq(brands.isActive, true)).orderBy(asc(brands.sortOrder)).limit(5)).map((b) => ({
				id: b.id,
				name: b.name,
				slug: b.slug,
				logoUrl: b.logoUrl
			})),
			testimonials: (await db.select().from(testimonials).where(eq(testimonials.isActive, true)).orderBy(asc(testimonials.sortOrder)).limit(6)).map((t) => ({
				id: t.id,
				quote: t.quote,
				quoteBn: t.quoteBn,
				customerName: t.customerName,
				location: t.location,
				locationBn: t.locationBn,
				avatarUrl: t.avatarUrl,
				rating: t.rating
			})),
			featuredCollections: (await db.select().from(featuredCollections).where(eq(featuredCollections.isActive, true)).orderBy(asc(featuredCollections.sortOrder)).limit(3)).map((c$1) => ({
				id: c$1.id,
				title: c$1.title,
				titleBn: c$1.titleBn,
				description: c$1.description,
				descriptionBn: c$1.descriptionBn,
				imageUrl: c$1.imageUrl,
				link: c$1.link,
				bgColor: c$1.bgColor
			})),
			instagramPosts: (await db.select().from(instagramPosts).where(eq(instagramPosts.isActive, true)).orderBy(asc(instagramPosts.sortOrder)).limit(8)).map((p) => ({
				id: p.id,
				imageUrl: p.imageUrl,
				alt: p.alt,
				link: p.link
			}))
		};
		return c.json(response, 200);
	} catch (error$1) {
		console.error("Error in /api/home:", error$1);
		return c.json({
			message: "Internal Server Error",
			error: error$1 instanceof Error ? error$1.message : String(error$1),
			stack: error$1 instanceof Error ? error$1.stack : void 0
		}, 500);
	}
});

//#endregion
//#region ../../packages/api-types/src/catalog.ts
const catalogQuerySchema = z.object({
	q: z.string().optional(),
	category: z.string().optional(),
	vendor: z.string().optional(),
	brand: z.string().optional(),
	ageRange: z.string().optional(),
	isBpaFree: z.enum(["true", "false"]).optional(),
	isOrganic: z.enum(["true", "false"]).optional(),
	isHypoallergenic: z.enum(["true", "false"]).optional(),
	min: z.coerce.number().int().min(0).optional(),
	max: z.coerce.number().int().min(0).optional(),
	rating: z.coerce.number().min(0).max(5).optional(),
	sort: z.enum([
		"price_asc",
		"price_desc",
		"newest",
		"bestseller",
		"rating"
	]).optional(),
	page: z.coerce.number().int().min(1).optional(),
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(50).default(20)
});
const searchQuerySchema = z.object({
	q: z.string().min(1).max(100),
	limit: z.coerce.number().int().min(1).max(10).default(5)
});
const categoriesQuerySchema = z.object({ scope: z.enum(["parents"]).optional() });
const categoryPageQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(48).default(12),
	sort: z.enum([
		"newest",
		"price_asc",
		"price_desc",
		"name_asc"
	]).default("newest"),
	brand: z.string().optional(),
	minPrice: z.coerce.number().int().min(0).optional(),
	maxPrice: z.coerce.number().int().min(0).optional(),
	ageRange: z.string().optional(),
	rating: z.coerce.number().min(0).max(5).optional()
});
const categoryTreeQuerySchema = z.object({
	maxDepth: z.coerce.number().int().min(1).max(4).default(3),
	includeProductCount: z.enum(["true", "false"]).default("true"),
	includeFeaturedProducts: z.enum(["true", "false"]).default("false")
});
const recommendationsQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(20).default(8),
	season: z.string().optional()
});
const featuredProductsQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(10).default(4) });
const cartRecommendationsQuerySchema = z.object({
	productIds: z.string().transform((val$1) => val$1.split(",").filter(Boolean)),
	limit: z.coerce.number().int().min(1).max(12).default(8)
});
const getBannersQuerySchema = z.object({ placement: z.string().optional() });

//#endregion
//#region src/routes/catalog.ts
async function formatProductCard$1(product) {
	const [image] = await db.select({
		s3Key: productImages.s3Key,
		alt: productImages.alt
	}).from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder)).limit(1);
	const [sku] = await db.select().from(productSkus).where(and(eq(productSkus.productId, product.id), eq(productSkus.isAvailable, true))).orderBy(asc(productSkus.priceAmount)).limit(1);
	const [anySku] = sku !== void 0 ? [sku] : await db.select().from(productSkus).where(eq(productSkus.productId, product.id)).orderBy(asc(productSkus.priceAmount)).limit(1);
	const [option] = await db.select({ id: productOptions.id }).from(productOptions).where(eq(productOptions.productId, product.id)).limit(1);
	return {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		brand: product.brand,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		ratingAvg: product.ratingAvg,
		ratingCount: product.ratingCount,
		isNew: product.isNew,
		isHot: product.isHot,
		imageUrl: image ? getS3Url(image.s3Key) : null,
		imageAlt: image?.alt || null,
		priceAmount: anySku?.priceAmount || 0,
		compareAtAmount: anySku?.compareAtAmount || null,
		currency: anySku?.currency || "BDT",
		isAvailable: sku !== void 0,
		hasVariants: option !== void 0,
		vendor: {
			id: product.vendor.id,
			name: product.vendor.name,
			slug: product.vendor.slug,
			isVerified: product.vendor.isVerified
		},
		category: {
			id: product.category.id,
			name: product.category.name,
			slug: product.category.slug
		}
	};
}
const catalogRouter = new Hono().get("/products", describeRoute({
	tags: ["Catalog"],
	summary: "Get paginated product catalog",
	description: "Fetch products with filters (category, vendor, price, rating) and sorting options. Supports cursor-based pagination.",
	responses: { 200: {
		description: "Successful response with product list",
		content: { "application/json": { schema: resolver(z.object({
			items: z.array(z.any()),
			nextCursor: z.string().nullable(),
			total: z.number()
		})) } }
	} }
}), zValidator("query", catalogQuerySchema), async (c) => {
	const { q, category, vendor, brand, ageRange, isBpaFree, isOrganic, isHypoallergenic, min, max, rating, sort, cursor, limit, page } = c.req.valid("query");
	const conditions = [eq(products.isActive, true), eq(products.status, "approved")];
	const cursorConditions = [];
	if (q) conditions.push(or(ilike(products.title, `%${q}%`), ilike(products.titleBn, `%${q}%`), ilike(products.brand, `%${q}%`), ilike(products.shortDescription, `%${q}%`)));
	if (category) {
		const categorySlugs = category.split(",").filter(Boolean);
		if (categorySlugs.length > 0) {
			const categoryRows = await db.select().from(categories).where(inArray(categories.slug, categorySlugs));
			if (categoryRows.length > 0) {
				const allCategoryIds = /* @__PURE__ */ new Set();
				async function addCategoryAndDescendants(categoryId) {
					allCategoryIds.add(categoryId);
					const children = await db.select().from(categories).where(eq(categories.parentId, categoryId));
					for (const child of children) await addCategoryAndDescendants(child.id);
				}
				for (const cat of categoryRows) await addCategoryAndDescendants(cat.id);
				if (allCategoryIds.size > 0) {
					const categoryIdArray = Array.from(allCategoryIds);
					conditions.push(inArray(products.categoryId, categoryIdArray));
				}
			}
		}
	}
	if (vendor) {
		const vendorSlugs = vendor.split(",").filter(Boolean);
		if (vendorSlugs.length > 0) {
			const vendorRows = await db.select().from(vendors).where(inArray(vendors.slug, vendorSlugs));
			if (vendorRows.length > 0) {
				const vendorIds = vendorRows.map((v) => v.id);
				conditions.push(inArray(products.vendorId, vendorIds));
			}
		}
	}
	if (brand) {
		const brandNames = brand.split(",").filter(Boolean);
		if (brandNames.length > 0) conditions.push(inArray(products.brand, brandNames));
	}
	if (ageRange) {
		const ageRanges = ageRange.split(",").filter(Boolean);
		if (ageRanges.length > 0) {
			const ageRangeMapping = {
				"0-3 months": {
					min: 0,
					max: 3
				},
				"3-6 months": {
					min: 3,
					max: 6
				},
				"6-12 months": {
					min: 6,
					max: 12
				},
				"1-2 years": {
					min: 12,
					max: 24
				},
				"2-3 years": {
					min: 24,
					max: 36
				}
			};
			const ageConditions = ageRanges.map((range) => {
				const numeric = ageRangeMapping[range];
				if (!numeric) return null;
				return and(lte(products.ageRangeMin, numeric.max), gte(products.ageRangeMax, numeric.min));
			}).filter((condition) => condition !== null);
			if (ageConditions.length > 0) conditions.push(or(...ageConditions));
		}
	}
	if (isBpaFree === "true") conditions.push(eq(products.isBpaFree, true));
	if (isOrganic === "true") conditions.push(eq(products.isOrganic, true));
	if (isHypoallergenic === "true") conditions.push(eq(products.isHypoallergenic, true));
	if (rating !== void 0) conditions.push(gte(products.ratingAvg, rating));
	if (min !== void 0 || max !== void 0) {
		const minPrice = min ?? 0;
		const maxPrice = max ?? Number.MAX_SAFE_INTEGER;
		conditions.push(sql`EXISTS (
        SELECT 1 FROM ${productSkus}
        WHERE ${productSkus.productId} = ${products.id}
        AND ${productSkus.priceAmount} >= ${minPrice}
        AND ${productSkus.priceAmount} <= ${maxPrice}
      )`);
	}
	if (!page && cursor) try {
		const [cursorId, cursorValue] = cursor.split("_");
		if (!cursorId) throw new Error("Invalid cursor");
		if (sort === "price_asc" || sort === "price_desc") cursorConditions.push(sql`${products.id} > ${cursorId}`);
		else if (sort === "newest" && cursorValue) cursorConditions.push(sql`(${products.createdAt}, ${products.id}) < (${new Date(cursorValue)}, ${cursorId})`);
		else if (sort === "bestseller" && cursorValue) cursorConditions.push(sql`(${products.bestSellerScore}, ${products.id}) < (${parseInt(cursorValue, 10)}, ${cursorId})`);
		else if (sort === "rating" && cursorValue) cursorConditions.push(sql`(${products.ratingAvg}, ${products.id}) < (${parseFloat(cursorValue)}, ${cursorId})`);
		else cursorConditions.push(sql`${products.id} > ${cursorId}`);
	} catch {}
	let queryBuilder = db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions, ...cursorConditions));
	switch (sort) {
		case "newest":
			queryBuilder = queryBuilder.orderBy(desc(products.createdAt), desc(products.id));
			break;
		case "bestseller":
			queryBuilder = queryBuilder.orderBy(desc(products.bestSellerScore), desc(products.id));
			break;
		case "rating":
			queryBuilder = queryBuilder.orderBy(desc(products.ratingAvg), desc(products.id));
			break;
		default: queryBuilder = queryBuilder.orderBy(asc(products.id));
	}
	const pageOffset = page ? (Math.max(1, page) - 1) * limit : 0;
	const rows = await queryBuilder.limit(page ? limit : limit + 1).offset(page ? pageOffset : 0);
	let formattedProducts = await Promise.all(rows.slice(0, limit).map((row) => formatProductCard$1({
		...row.product,
		vendor: row.vendor,
		category: row.category
	})));
	if (sort === "price_asc") formattedProducts.sort((a, b) => a.priceAmount - b.priceAmount);
	else if (sort === "price_desc") formattedProducts.sort((a, b) => b.priceAmount - a.priceAmount);
	const hasMore = !page && rows.length > limit;
	let nextCursor = null;
	if (hasMore && formattedProducts.length > 0) {
		const lastProduct = rows[limit - 1];
		switch (sort) {
			case "newest":
				nextCursor = `${lastProduct.product.id}_${lastProduct.product.createdAt.toISOString()}`;
				break;
			case "bestseller":
				nextCursor = `${lastProduct.product.id}_${lastProduct.product.bestSellerScore}`;
				break;
			case "rating":
				nextCursor = `${lastProduct.product.id}_${lastProduct.product.ratingAvg}`;
				break;
			default: nextCursor = `${lastProduct.product.id}_`;
		}
	}
	const [countResult] = await db.select({ count: sql`count(*)::int` }).from(products).where(and(...conditions));
	const response = {
		items: formattedProducts,
		nextCursor,
		total: countResult?.count || 0
	};
	return c.json(response, 200);
}).get("/facets", describeRoute({
	tags: ["Catalog"],
	summary: "Get catalog facets",
	description: "Fetch available filters including categories, vendors, brands, age ranges, and price ranges for the catalog.",
	responses: { 200: {
		description: "Successful response with facets data",
		content: { "application/json": { schema: resolver(z.object({
			categories: z.array(z.any()),
			vendors: z.array(z.any()),
			brands: z.array(z.any()),
			ageRanges: z.array(z.any()),
			priceRange: z.object({
				min: z.number(),
				max: z.number()
			})
		})) } }
	} }
}), async (c) => {
	const categoryDTOs = (await db.select({
		id: categories.id,
		name: categories.name,
		nameBn: categories.nameBn,
		slug: categories.slug,
		parentId: categories.parentId,
		iconKey: categories.iconKey,
		imageUrl: categories.imageUrl,
		sortOrder: categories.sortOrder,
		productCount: sql`count(${products.id})::int`
	}).from(categories).leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true), eq(products.status, "approved"))).groupBy(categories.id, categories.name, categories.nameBn, categories.slug, categories.parentId, categories.iconKey, categories.imageUrl, categories.sortOrder).orderBy(asc(categories.sortOrder))).map((row) => ({
		id: row.id,
		name: row.name,
		nameBn: row.nameBn,
		slug: row.slug,
		parentId: row.parentId,
		iconKey: row.iconKey,
		imageUrl: row.imageUrl,
		sortOrder: row.sortOrder,
		productCount: row.productCount
	}));
	const categoryMap = new Map(categoryDTOs.map((c$1) => [c$1.id, c$1]));
	function getTotalCount(categoryId, visited = /* @__PURE__ */ new Set()) {
		if (visited.has(categoryId)) return 0;
		visited.add(categoryId);
		const category = categoryMap.get(categoryId);
		if (!category) return 0;
		let total = category.productCount || 0;
		const children = categoryDTOs.filter((c$1) => c$1.parentId === categoryId);
		for (const child of children) total += getTotalCount(child.id, visited);
		return total;
	}
	categoryDTOs.forEach((category) => {
		category.productCount = getTotalCount(category.id);
	});
	const vendorDTOs = (await db.select({
		id: vendors.id,
		name: vendors.name,
		slug: vendors.slug,
		logoUrl: vendors.logoUrl,
		ratingAvg: vendors.ratingAvg,
		ratingCount: vendors.ratingCount,
		locationCity: vendors.locationCity,
		isVerified: vendors.isVerified,
		badges: vendors.badges,
		productCount: sql`count(${products.id})::int`
	}).from(vendors).leftJoin(products, and(eq(products.vendorId, vendors.id), eq(products.isActive, true), eq(products.status, "approved"))).groupBy(vendors.id, vendors.name, vendors.slug, vendors.logoUrl, vendors.ratingAvg, vendors.ratingCount, vendors.locationCity, vendors.isVerified, vendors.badges).orderBy(desc(sql`count(${products.id})`))).map((row) => ({
		id: row.id,
		name: row.name,
		slug: row.slug,
		logoUrl: row.logoUrl,
		ratingAvg: row.ratingAvg,
		ratingCount: row.ratingCount,
		locationCity: row.locationCity,
		isVerified: row.isVerified,
		badges: row.badges,
		productCount: row.productCount
	}));
	const brandDTOs = (await db.select({
		name: products.brand,
		count: sql`count(*)::int`
	}).from(products).where(and(eq(products.isActive, true), eq(products.status, "approved"))).groupBy(products.brand).orderBy(desc(sql`count(*)`))).filter((b) => b.name).map((b) => ({
		name: b.name,
		count: b.count
	}));
	const ageRangeDTOs = (await db.select({
		ageRange: products.ageRange,
		count: sql`count(*)::int`
	}).from(products).where(and(eq(products.isActive, true), eq(products.status, "approved"))).groupBy(products.ageRange).orderBy(desc(sql`count(*)`))).filter((a) => a.ageRange).map((a) => ({
		value: a.ageRange,
		label: a.ageRange,
		labelBn: a.ageRange,
		count: a.count
	}));
	const [safetyFacets] = await db.select({
		isBpaFree: sql`count(*) filter (where ${products.isBpaFree} = true)::int`,
		isOrganic: sql`count(*) filter (where ${products.isOrganic} = true)::int`,
		isHypoallergenic: sql`count(*) filter (where ${products.isHypoallergenic} = true)::int`
	}).from(products).where(and(eq(products.isActive, true), eq(products.status, "approved")));
	const [priceRange] = await db.select({
		min: sql`min(${productSkus.priceAmount})::int`,
		max: sql`max(${productSkus.priceAmount})::int`
	}).from(productSkus).innerJoin(products, eq(productSkus.productId, products.id)).where(and(eq(products.isActive, true), eq(products.status, "approved")));
	const response = {
		categories: categoryDTOs,
		vendors: vendorDTOs,
		brands: brandDTOs,
		ageRanges: ageRangeDTOs,
		safety: {
			isBpaFree: safetyFacets?.isBpaFree || 0,
			isOrganic: safetyFacets?.isOrganic || 0,
			isHypoallergenic: safetyFacets?.isHypoallergenic || 0
		},
		priceRange: {
			min: priceRange?.min || 0,
			max: priceRange?.max || 1e5
		}
	};
	return c.json(response, 200);
});

//#endregion
//#region src/routes/categories.ts
const categoriesRouter = new Hono().get("/", describeRoute({
	tags: ["Categories"],
	summary: "Get category list",
	description: "Fetch all categories or only parent categories with product counts.",
	responses: { 200: {
		description: "Successful response with categories",
		content: { "application/json": { schema: resolver(z.object({ categories: z.array(z.any()) })) } }
	} }
}), zValidator("query", categoriesQuerySchema), async (c) => {
	const { scope } = c.req.valid("query");
	const baseQuery = db.select({
		category: categories,
		productCount: sql`count(${products.id})::int`
	}).from(categories).leftJoin(products, and(eq(products.categoryId, categories.id), eq(products.isActive, true), eq(products.status, "approved"))).groupBy(categories.id).orderBy(asc(categories.sortOrder));
	const categoryDTOs = (scope === "parents" ? await baseQuery.where(sql`${categories.parentId} IS NULL`) : await baseQuery).map((row) => ({
		id: row.category.id,
		name: row.category.name,
		nameBn: row.category.nameBn,
		slug: row.category.slug,
		parentId: row.category.parentId,
		iconKey: row.category.iconKey,
		imageUrl: row.category.imageUrl,
		sortOrder: row.category.sortOrder,
		productCount: row.productCount
	}));
	return c.json({ categories: categoryDTOs }, 200);
}).get("/tree", describeRoute({
	tags: ["Categories"],
	summary: "Get hierarchical category tree",
	description: "Fetch categories as a nested tree structure for mega menu navigation. Uses materialized path for efficient querying.",
	responses: { 200: {
		description: "Successful response with category tree",
		content: { "application/json": { schema: resolver(z.object({
			tree: z.array(z.any()),
			lastUpdated: z.string()
		})) } }
	} }
}), zValidator("query", categoryTreeQuerySchema), async (c) => {
	const { maxDepth, includeProductCount, includeFeaturedProducts } = c.req.valid("query");
	const shouldIncludeProductCount = includeProductCount === "true";
	const shouldIncludeFeaturedProducts = includeFeaturedProducts === "true";
	const categoriesData = await db.select({
		category: categories,
		productCount: shouldIncludeProductCount ? sql`(
              SELECT COUNT(*)::int
              FROM ${products}
              WHERE ${products.categoryId} = ${categories.id}
              AND ${products.isActive} = true
              AND ${products.status} = 'approved'
            )` : sql`0`
	}).from(categories).where(and(eq(categories.displayInMegaMenu, true), lte(categories.depth, maxDepth - 1))).orderBy(asc(categories.depth), asc(categories.sortOrder));
	const categoryMap = /* @__PURE__ */ new Map();
	const rootCategories = [];
	for (const row of categoriesData) {
		const node = {
			id: row.category.id,
			name: row.category.name,
			nameBn: row.category.nameBn,
			slug: row.category.slug,
			iconKey: row.category.iconKey,
			imageUrl: row.category.imageUrl,
			depth: row.category.depth ?? 0,
			productCount: row.productCount,
			children: []
		};
		categoryMap.set(row.category.id, node);
	}
	for (const row of categoriesData) {
		const node = categoryMap.get(row.category.id);
		if (row.category.parentId && categoryMap.has(row.category.parentId)) categoryMap.get(row.category.parentId).children.push(node);
		else if (!row.category.parentId) rootCategories.push(node);
	}
	if (shouldIncludeFeaturedProducts) await Promise.all(rootCategories.map(async (rootNode) => {
		rootNode.featuredProducts = await getFeaturedProductsForCategory(rootNode.id, 4);
	}));
	const response = {
		tree: rootCategories,
		lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
	};
	return c.json(response, 200);
}).get("/:id/featured", describeRoute({
	tags: ["Categories"],
	summary: "Get featured products for category",
	description: "Fetch featured products to display in mega menu panel for a specific category.",
	responses: {
		200: {
			description: "Successful response with featured products",
			content: { "application/json": { schema: resolver(z.object({
				categoryId: z.string(),
				products: z.array(z.any())
			})) } }
		},
		404: {
			description: "Category not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("query", featuredProductsQuerySchema), async (c) => {
	const categoryId = c.req.param("id");
	const { limit } = c.req.valid("query");
	const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
	if (!category) return c.json({ error: "Category not found" }, 404);
	const response = {
		categoryId,
		products: await getFeaturedProductsForCategory(categoryId, limit)
	};
	return c.json(response, 200);
});
async function getFeaturedProductsForCategory(categoryId, limit) {
	const now = /* @__PURE__ */ new Date();
	const featuredRows = await db.select({
		product: products,
		image: { s3Key: productImages.s3Key },
		sku: productSkus
	}).from(megaMenuFeaturedProducts).innerJoin(products, eq(megaMenuFeaturedProducts.productId, products.id)).leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.sortOrder, 0))).leftJoin(productSkus, eq(productSkus.productId, products.id)).where(and(eq(megaMenuFeaturedProducts.categoryId, categoryId), eq(megaMenuFeaturedProducts.isActive, true), eq(products.isActive, true), eq(products.status, "approved"), sql`(${megaMenuFeaturedProducts.startsAt} IS NULL OR ${megaMenuFeaturedProducts.startsAt} <= ${now})`, sql`(${megaMenuFeaturedProducts.endsAt} IS NULL OR ${megaMenuFeaturedProducts.endsAt} >= ${now})`)).orderBy(asc(megaMenuFeaturedProducts.sortOrder)).limit(limit);
	if (featuredRows.length > 0) {
		const productMap$1 = /* @__PURE__ */ new Map();
		for (const row of featuredRows) {
			const existing = productMap$1.get(row.product.id);
			if (!existing || row.sku && row.sku.priceAmount < (existing.priceAmount || Infinity)) productMap$1.set(row.product.id, {
				id: row.product.id,
				title: row.product.title,
				titleBn: row.product.titleBn,
				slug: row.product.slug,
				imageUrl: row.image?.s3Key ? getS3Url(row.image.s3Key) : null,
				priceAmount: row.sku?.priceAmount || 0,
				currency: row.sku?.currency || "BDT",
				isNew: row.product.isNew
			});
		}
		return Array.from(productMap$1.values()).slice(0, limit);
	}
	const fallbackRows = await db.select({
		product: products,
		image: { s3Key: productImages.s3Key },
		sku: productSkus
	}).from(products).leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.sortOrder, 0))).leftJoin(productSkus, eq(productSkus.productId, products.id)).where(and(eq(products.categoryId, categoryId), eq(products.isActive, true), eq(products.status, "approved"))).orderBy(sql`${products.bestSellerScore} DESC NULLS LAST`).limit(limit * 3);
	const productMap = /* @__PURE__ */ new Map();
	for (const row of fallbackRows) {
		const existing = productMap.get(row.product.id);
		if (!existing || row.sku && row.sku.priceAmount < (existing.priceAmount || Infinity)) productMap.set(row.product.id, {
			id: row.product.id,
			title: row.product.title,
			titleBn: row.product.titleBn,
			slug: row.product.slug,
			imageUrl: row.image?.s3Key ? getS3Url(row.image.s3Key) : null,
			priceAmount: row.sku?.priceAmount || 0,
			currency: row.sku?.currency || "BDT",
			isNew: row.product.isNew
		});
	}
	return Array.from(productMap.values()).slice(0, limit);
}

//#endregion
//#region src/routes/products.ts
const productsRouter = new Hono().get("/:id/quick-view", describeRoute({
	tags: ["Products"],
	summary: "Get product quick view",
	description: "Fetch detailed product data for quick view modal including images, options, SKUs, and pricing.",
	responses: {
		200: {
			description: "Successful response with product details",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const { id } = c.req.param();
	const [productRow] = await db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(eq(products.id, id), eq(products.isActive, true), eq(products.status, "approved"))).limit(1);
	if (!productRow) return c.json({ error: "Product not found" }, 404);
	const { product, vendor, category } = productRow;
	const images = await db.select({
		id: productImages.id,
		s3Key: productImages.s3Key,
		alt: productImages.alt,
		sortOrder: productImages.sortOrder
	}).from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder));
	const options = await db.select().from(productOptions).where(eq(productOptions.productId, id)).orderBy(asc(productOptions.sortOrder));
	const skus = await db.select().from(productSkus).where(eq(productSkus.productId, id));
	const availableSkus = skus.filter((s) => s.isAvailable);
	const lowestSku = [...availableSkus.length ? availableSkus : skus].sort((a, b) => a.priceAmount - b.priceAmount)[0];
	const hasVariants = options.length > 0 || skus.length > 1 || skus.some((s) => s.optionValues && Object.keys(s.optionValues).length > 0);
	const response = {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		brand: product.brand,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		ratingAvg: product.ratingAvg,
		ratingCount: product.ratingCount,
		isNew: product.isNew,
		isHot: product.isHot,
		shortDescription: product.shortDescription,
		shortDescriptionBn: product.shortDescriptionBn,
		description: product.description,
		descriptionBn: product.descriptionBn,
		hasSmallParts: product.hasSmallParts,
		safetyWarningEn: product.safetyWarningEn,
		safetyWarningBn: product.safetyWarningBn,
		weightLimitKg: product.weightLimitKg,
		expiryDate: product.expiryDate?.toISOString() || null,
		safetyCertifications: product.safetyCertifications || [],
		imageUrl: images[0] ? getS3Url(images[0].s3Key) : null,
		imageAlt: images[0]?.alt || null,
		priceAmount: lowestSku?.priceAmount || 0,
		compareAtAmount: lowestSku?.compareAtAmount || null,
		currency: lowestSku?.currency || "BDT",
		isAvailable: availableSkus.length > 0,
		hasVariants,
		vendor: {
			id: vendor.id,
			name: vendor.name,
			slug: vendor.slug,
			isVerified: vendor.isVerified
		},
		category: {
			id: category.id,
			name: category.name,
			slug: category.slug
		},
		images: images.map((img) => ({
			id: img.id,
			url: getS3Url(img.s3Key),
			alt: img.alt,
			sortOrder: img.sortOrder
		})),
		options: options.map((opt) => ({
			id: opt.id,
			name: opt.name,
			nameBn: opt.nameBn,
			values: opt.values,
			valuesBn: opt.valuesBn,
			sortOrder: opt.sortOrder
		})),
		skus: skus.map((sku) => ({
			id: sku.id,
			sku: sku.sku,
			optionValues: sku.optionValues,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount,
			currency: sku.currency,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		}))
	};
	return c.json(response, 200);
}).get("/by-slug/:slug", describeRoute({
	tags: ["Products"],
	summary: "Get product by slug",
	description: "Fetch product details by slug for quick view modal.",
	responses: {
		200: {
			description: "Successful response with product details",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const { slug } = c.req.param();
	const [productRow] = await db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.slug, slug)).limit(1);
	if (!productRow) return c.json({ error: "Product not found" }, 404);
	const { product, vendor, category } = productRow;
	const images = await db.select({
		id: productImages.id,
		s3Key: productImages.s3Key,
		alt: productImages.alt,
		sortOrder: productImages.sortOrder
	}).from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder));
	const options = await db.select().from(productOptions).where(eq(productOptions.productId, product.id)).orderBy(asc(productOptions.sortOrder));
	const skus = await db.select().from(productSkus).where(eq(productSkus.productId, product.id));
	const availableSkus = skus.filter((s) => s.isAvailable);
	const lowestSku = [...availableSkus.length ? availableSkus : skus].sort((a, b) => a.priceAmount - b.priceAmount)[0];
	const hasVariants = options.length > 0 || skus.length > 1 || skus.some((s) => s.optionValues && Object.keys(s.optionValues).length > 0);
	const response = {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		brand: product.brand,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		ratingAvg: product.ratingAvg,
		ratingCount: product.ratingCount,
		isNew: product.isNew,
		isHot: product.isHot,
		shortDescription: product.shortDescription,
		shortDescriptionBn: product.shortDescriptionBn,
		description: product.description,
		descriptionBn: product.descriptionBn,
		hasSmallParts: product.hasSmallParts,
		safetyWarningEn: product.safetyWarningEn,
		safetyWarningBn: product.safetyWarningBn,
		weightLimitKg: product.weightLimitKg,
		expiryDate: product.expiryDate?.toISOString() || null,
		safetyCertifications: product.safetyCertifications || [],
		imageUrl: images[0] ? getS3Url(images[0].s3Key) : null,
		imageAlt: images[0]?.alt || null,
		priceAmount: lowestSku?.priceAmount || 0,
		compareAtAmount: lowestSku?.compareAtAmount || null,
		currency: lowestSku?.currency || "BDT",
		isAvailable: availableSkus.length > 0,
		hasVariants,
		vendor: {
			id: vendor.id,
			name: vendor.name,
			slug: vendor.slug,
			isVerified: vendor.isVerified
		},
		category: {
			id: category.id,
			name: category.name,
			slug: category.slug
		},
		images: images.map((img) => ({
			id: img.id,
			url: getS3Url(img.s3Key),
			alt: img.alt,
			sortOrder: img.sortOrder
		})),
		options: options.map((opt) => ({
			id: opt.id,
			name: opt.name,
			nameBn: opt.nameBn,
			values: opt.values,
			valuesBn: opt.valuesBn,
			sortOrder: opt.sortOrder
		})),
		skus: skus.map((sku) => ({
			id: sku.id,
			sku: sku.sku,
			optionValues: sku.optionValues,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount,
			currency: sku.currency,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		}))
	};
	return c.json(response, 200);
}).get("/:slug/detail", describeRoute({
	tags: ["Products"],
	summary: "Get product detail page data",
	description: "Fetch comprehensive product data for the product detail page, including vendor details, category breadcrumb hierarchy, and related products.",
	responses: {
		200: {
			description: "Successful response with full product details",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const { slug } = c.req.param();
	const parentCategory = alias(categories, "parent_category");
	const grandparentCategory = alias(categories, "grandparent_category");
	const [productRow] = await db.select({
		product: products,
		vendor: vendors,
		category: categories,
		parentCategory,
		grandparentCategory
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).leftJoin(parentCategory, eq(categories.parentId, parentCategory.id)).leftJoin(grandparentCategory, eq(parentCategory.parentId, grandparentCategory.id)).where(and(eq(products.slug, slug), eq(products.isActive, true), eq(products.status, "approved"))).limit(1);
	if (!productRow) return c.json({ error: "Product not found" }, 404);
	const { product, vendor, category, parentCategory: parent, grandparentCategory: grandparent } = productRow;
	const [images, options, skus, vendorSalesResult] = await Promise.all([
		db.select({
			id: productImages.id,
			s3Key: productImages.s3Key,
			alt: productImages.alt,
			sortOrder: productImages.sortOrder
		}).from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder)),
		db.select().from(productOptions).where(eq(productOptions.productId, product.id)).orderBy(asc(productOptions.sortOrder)),
		db.select().from(productSkus).where(eq(productSkus.productId, product.id)),
		db.select({ count: count() }).from(products).where(eq(products.vendorId, vendor.id))
	]);
	const totalSales = vendorSalesResult[0]?.count || 0;
	const relatedProductRows = await db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(eq(products.categoryId, product.categoryId), ne(products.id, product.id), eq(products.isActive, true), eq(products.status, "approved"))).limit(4);
	const relatedProductIds = relatedProductRows.map((r) => r.product.id);
	const relatedImages = relatedProductIds.length > 0 ? await db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key,
		alt: productImages.alt
	}).from(productImages).where(sql`${productImages.productId} IN ${relatedProductIds}`) : [];
	const relatedSkus = relatedProductIds.length > 0 ? await db.select().from(productSkus).where(sql`${productSkus.productId} IN ${relatedProductIds}`) : [];
	const relatedProducts = relatedProductRows.map((row) => {
		const prodImages = relatedImages.filter((img) => img.productId === row.product.id);
		const prodSkus = relatedSkus.filter((sku) => sku.productId === row.product.id);
		const availableSkus$1 = prodSkus.filter((s) => s.isAvailable);
		const lowestSku$1 = [...availableSkus$1.length ? availableSkus$1 : prodSkus].sort((a, b) => a.priceAmount - b.priceAmount)[0];
		const hasVariants$1 = prodSkus.length > 1 || prodSkus.some((s) => s.optionValues && Object.keys(s.optionValues).length > 0);
		return {
			id: row.product.id,
			title: row.product.title,
			titleBn: row.product.titleBn,
			slug: row.product.slug,
			brand: row.product.brand,
			ageRange: row.product.ageRange,
			ageRangeMin: row.product.ageRangeMin,
			ageRangeMax: row.product.ageRangeMax,
			isBpaFree: row.product.isBpaFree,
			isOrganic: row.product.isOrganic,
			isHypoallergenic: row.product.isHypoallergenic,
			ratingAvg: row.product.ratingAvg,
			ratingCount: row.product.ratingCount,
			isNew: row.product.isNew,
			isHot: row.product.isHot,
			imageUrl: prodImages[0] ? getS3Url(prodImages[0].s3Key) : null,
			imageAlt: prodImages[0]?.alt || null,
			priceAmount: lowestSku$1?.priceAmount || 0,
			compareAtAmount: lowestSku$1?.compareAtAmount || null,
			currency: lowestSku$1?.currency || "BDT",
			isAvailable: availableSkus$1.length > 0,
			hasVariants: hasVariants$1,
			vendor: {
				id: row.vendor.id,
				name: row.vendor.name,
				slug: row.vendor.slug,
				isVerified: row.vendor.isVerified
			},
			category: {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug
			}
		};
	});
	const availableSkus = skus.filter((s) => s.isAvailable);
	const lowestSku = [...availableSkus.length ? availableSkus : skus].sort((a, b) => a.priceAmount - b.priceAmount)[0];
	const hasVariants = options.length > 0 || skus.length > 1 || skus.some((s) => s.optionValues && Object.keys(s.optionValues).length > 0);
	const vendorDetail = {
		id: vendor.id,
		name: vendor.name,
		slug: vendor.slug,
		logoUrl: vendor.logoUrl,
		ratingAvg: vendor.ratingAvg,
		ratingCount: vendor.ratingCount,
		locationCity: vendor.locationCity,
		isVerified: vendor.isVerified,
		badges: vendor.badges,
		totalSales
	};
	const categoryBreadcrumb = {
		id: category.id,
		name: category.name,
		nameBn: category.nameBn,
		slug: category.slug,
		parent: parent ? {
			id: parent.id,
			name: parent.name,
			nameBn: parent.nameBn,
			slug: parent.slug,
			parent: grandparent ? {
				id: grandparent.id,
				name: grandparent.name,
				nameBn: grandparent.nameBn,
				slug: grandparent.slug
			} : null
		} : null
	};
	const response = {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		brand: product.brand,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		ratingAvg: product.ratingAvg,
		ratingCount: product.ratingCount,
		isNew: product.isNew,
		isHot: product.isHot,
		shortDescription: product.shortDescription,
		shortDescriptionBn: product.shortDescriptionBn,
		description: product.description,
		descriptionBn: product.descriptionBn,
		hasSmallParts: product.hasSmallParts,
		safetyWarningEn: product.safetyWarningEn,
		safetyWarningBn: product.safetyWarningBn,
		weightLimitKg: product.weightLimitKg,
		expiryDate: product.expiryDate?.toISOString() || null,
		safetyCertifications: product.safetyCertifications || [],
		imageUrl: images[0] ? getS3Url(images[0].s3Key) : null,
		imageAlt: images[0]?.alt || null,
		priceAmount: lowestSku?.priceAmount || 0,
		compareAtAmount: lowestSku?.compareAtAmount || null,
		currency: lowestSku?.currency || "BDT",
		isAvailable: availableSkus.length > 0,
		hasVariants,
		vendor: vendorDetail,
		category: categoryBreadcrumb,
		images: images.map((img) => ({
			id: img.id,
			url: getS3Url(img.s3Key),
			alt: img.alt,
			sortOrder: img.sortOrder
		})),
		options: options.map((opt) => ({
			id: opt.id,
			name: opt.name,
			nameBn: opt.nameBn,
			values: opt.values,
			valuesBn: opt.valuesBn,
			sortOrder: opt.sortOrder
		})),
		skus: skus.map((sku) => ({
			id: sku.id,
			sku: sku.sku,
			optionValues: sku.optionValues,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount,
			currency: sku.currency,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		})),
		relatedProducts
	};
	return c.json(response, 200);
});

//#endregion
//#region src/routes/search.ts
const searchRouter = new Hono().get("/suggest", describeRoute({
	tags: ["Search"],
	summary: "Get search suggestions",
	description: "Typeahead search suggestions for products, categories, and vendors based on query string.",
	responses: { 200: {
		description: "Successful response with search suggestions",
		content: { "application/json": { schema: resolver(z.object({
			products: z.array(z.any()),
			categories: z.array(z.any()),
			vendors: z.array(z.any())
		})) } }
	} }
}), zValidator("query", searchQuerySchema), async (c) => {
	const { q, limit } = c.req.valid("query");
	const searchPattern = `%${q}%`;
	const productResults = await db.select({
		id: products.id,
		title: products.title,
		titleBn: products.titleBn,
		slug: products.slug
	}).from(products).where(and(eq(products.isActive, true), eq(products.status, "approved"), or(ilike(products.title, searchPattern), ilike(products.titleBn, searchPattern), ilike(products.brand, searchPattern)))).limit(limit);
	const productIds = productResults.map((product) => product.id);
	const [imageRows, skuRows] = productIds.length > 0 ? await Promise.all([db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key
	}).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.productId), asc(productImages.sortOrder)), db.select({
		productId: productSkus.productId,
		priceAmount: productSkus.priceAmount,
		currency: productSkus.currency
	}).from(productSkus).where(inArray(productSkus.productId, productIds)).orderBy(asc(productSkus.productId), asc(productSkus.priceAmount))]) : [[], []];
	const imageByProductId = /* @__PURE__ */ new Map();
	for (const row of imageRows) if (!imageByProductId.has(row.productId)) imageByProductId.set(row.productId, row.s3Key);
	const priceByProductId = /* @__PURE__ */ new Map();
	for (const row of skuRows) if (!priceByProductId.has(row.productId)) priceByProductId.set(row.productId, {
		priceAmount: row.priceAmount,
		currency: row.currency
	});
	const response = {
		products: productResults.map((product) => {
			const imageKey = imageByProductId.get(product.id);
			const pricing = priceByProductId.get(product.id);
			return {
				id: product.id,
				title: product.title,
				titleBn: product.titleBn,
				slug: product.slug,
				imageUrl: imageKey ? getS3Url(imageKey) : null,
				priceAmount: pricing?.priceAmount ?? 0,
				currency: pricing?.currency ?? "BDT"
			};
		}),
		categories: await db.select({
			id: categories.id,
			name: categories.name,
			nameBn: categories.nameBn,
			slug: categories.slug
		}).from(categories).where(or(ilike(categories.name, searchPattern), ilike(categories.nameBn, searchPattern))).limit(limit),
		vendors: await db.select({
			id: vendors.id,
			name: vendors.name,
			slug: vendors.slug
		}).from(vendors).where(ilike(vendors.name, searchPattern)).limit(limit)
	};
	return c.json(response, 200);
});

//#endregion
//#region ../../packages/api-types/src/auth.ts
const signUpSchema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(8),
	callbackURL: z.string().optional(),
	rememberMe: z.boolean().optional()
});
const forgotPasswordSchema = z.object({
	email: z.string().email(),
	redirectTo: z.string().optional()
});

//#endregion
//#region src/routes/auth.ts
const normalizeBaseUrl = (value) => value.replace(/\/+$/, "");
const parseCommaSeparatedUrls = (value) => (value ?? "").split(",").map((item) => item.trim()).filter(Boolean).flatMap((item) => {
	try {
		return [normalizeBaseUrl(new URL(item).toString())];
	} catch {
		return [];
	}
});
const frontendBaseUrl = normalizeBaseUrl(env.WEB_ORIGIN);
const trustedFrontendUrls = Array.from(new Set([
	frontendBaseUrl,
	normalizeBaseUrl(env.WEB_ORIGIN),
	normalizeBaseUrl(env.WEB_ORIGIN),
	...parseCommaSeparatedUrls("")
]));
const trustedFrontendOrigins = new Set(trustedFrontendUrls.map((url) => new URL(url).origin));
const resolveBaseUrlFromOrigin = (origin) => {
	if (!origin) return frontendBaseUrl;
	const normalizedOrigin = normalizeBaseUrl(origin);
	return trustedFrontendOrigins.has(normalizedOrigin) ? normalizedOrigin : frontendBaseUrl;
};
const resolveFrontendUrl = (value, fallbackPath, requestOrigin) => {
	const baseUrl = resolveBaseUrlFromOrigin(requestOrigin);
	const fallback = new URL(fallbackPath, baseUrl).toString();
	if (!value) return fallback;
	try {
		const parsed = new URL(value, baseUrl);
		return trustedFrontendOrigins.has(parsed.origin) ? parsed.toString() : fallback;
	} catch {
		return fallback;
	}
};
const buildAuthRequest = (path$3, body, original) => {
	const headers = new Headers(original.headers);
	headers.set("content-type", "application/json");
	headers.delete("content-length");
	return new Request(new URL(path$3, env.BETTER_AUTH_URL).toString(), {
		method: "POST",
		headers,
		body: JSON.stringify(body)
	});
};
const passwordResetEligibilitySchema = z.object({ email: z.string().email() });
const authRouter = new Hono().post("/sign-up", zValidator("json", signUpSchema), async (c) => {
	const data = c.req.valid("json");
	const normalizedEmail = data.email.trim().toLowerCase();
	const callbackURL = resolveFrontendUrl(data.callbackURL, "/login", c.req.header("origin"));
	const request = buildAuthRequest("/api/auth/sign-up/email", {
		name: data.name,
		email: normalizedEmail,
		password: data.password,
		callbackURL,
		rememberMe: data.rememberMe
	}, c.req.raw);
	return auth.handler(request);
}).post("/forgot-password", zValidator("json", forgotPasswordSchema), async (c) => {
	const data = c.req.valid("json");
	const request = buildAuthRequest("/api/auth/request-password-reset", {
		email: data.email.trim().toLowerCase(),
		redirectTo: resolveFrontendUrl(data.redirectTo, "/reset-password", c.req.header("origin"))
	}, c.req.raw);
	return auth.handler(request);
}).post("/password-reset-eligibility", zValidator("json", passwordResetEligibilitySchema), async (c) => {
	c.req.valid("json");
	return c.json({ eligible: true }, 200);
});

//#endregion
//#region ../../packages/api-types/src/newsletter.ts
const newsletterSubscribeSchema = z.object({ email: z.string().email() });
const newsletterUnsubscribeSchema = z.object({ email: z.string().email() });

//#endregion
//#region src/routes/newsletter.ts
const newsletterRouter = new Hono().post("/subscribe", describeRoute({
	tags: ["Newsletter"],
	summary: "Subscribe to newsletter",
	description: "Subscribe an email address to the newsletter. Reactivates subscription if previously unsubscribed.",
	responses: {
		200: {
			description: "Successfully subscribed or reactivated",
			content: { "application/json": { schema: resolver(z.object({
				success: z.boolean(),
				message: z.string()
			})) } }
		},
		409: {
			description: "Already subscribed",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		500: {
			description: "Server error",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", newsletterSubscribeSchema), async (c) => {
	try {
		const { email } = c.req.valid("json");
		const normalizedEmail = email.toLowerCase().trim();
		const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, normalizedEmail)).limit(1);
		if (existing.length > 0 && existing[0]) {
			if (!existing[0].isActive) {
				await db.update(newsletterSubscribers).set({
					isActive: true,
					subscribedAt: /* @__PURE__ */ new Date()
				}).where(eq(newsletterSubscribers.id, existing[0].id));
				return c.json({
					success: true,
					message: "Subscription reactivated"
				}, 200);
			}
			return c.json({ error: "Already subscribed" }, 409);
		}
		await db.insert(newsletterSubscribers).values({ email: normalizedEmail });
		return c.json({
			success: true,
			message: "Successfully subscribed"
		}, 200);
	} catch (error$1) {
		console.error("Newsletter subscription error:", error$1);
		return c.json({ error: "Failed to subscribe" }, 500);
	}
}).post("/unsubscribe", describeRoute({
	tags: ["Newsletter"],
	summary: "Unsubscribe from newsletter",
	description: "Unsubscribe an email address from the newsletter.",
	responses: {
		200: {
			description: "Successfully unsubscribed",
			content: { "application/json": { schema: resolver(z.object({
				success: z.boolean(),
				message: z.string()
			})) } }
		},
		404: {
			description: "Email not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		500: {
			description: "Server error",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", newsletterUnsubscribeSchema), async (c) => {
	try {
		const { email } = c.req.valid("json");
		const normalizedEmail = email.toLowerCase().trim();
		const existing = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, normalizedEmail)).limit(1);
		if (existing.length === 0 || !existing[0]) return c.json({ error: "Email not found" }, 404);
		await db.update(newsletterSubscribers).set({ isActive: false }).where(eq(newsletterSubscribers.id, existing[0].id));
		return c.json({
			success: true,
			message: "Successfully unsubscribed"
		}, 200);
	} catch (error$1) {
		console.error("Newsletter unsubscribe error:", error$1);
		return c.json({ error: "Failed to unsubscribe" }, 500);
	}
});

//#endregion
//#region src/routes/category.ts
const AGE_RANGE_OPTIONS = [
	{
		value: "0-3",
		label: "0-3 months",
		labelBn: "০-৩ মাস",
		min: 0,
		max: 3
	},
	{
		value: "3-6",
		label: "3-6 months",
		labelBn: "৩-৬ মাস",
		min: 3,
		max: 6
	},
	{
		value: "6-12",
		label: "6-12 months",
		labelBn: "৬-১২ মাস",
		min: 6,
		max: 12
	},
	{
		value: "1-2",
		label: "1-2 years",
		labelBn: "১-২ বছর",
		min: 12,
		max: 24
	},
	{
		value: "2-3",
		label: "2-3 years",
		labelBn: "২-৩ বছর",
		min: 24,
		max: 36
	},
	{
		value: "3+",
		label: "3+ years",
		labelBn: "৩+ বছর",
		min: 36,
		max: 120
	}
];
async function formatProductCard(product) {
	const [image] = await db.select({
		s3Key: productImages.s3Key,
		alt: productImages.alt
	}).from(productImages).where(eq(productImages.productId, product.id)).orderBy(asc(productImages.sortOrder)).limit(1);
	const [sku] = await db.select().from(productSkus).where(and(eq(productSkus.productId, product.id), eq(productSkus.isAvailable, true))).orderBy(asc(productSkus.priceAmount)).limit(1);
	const [anySku] = sku !== void 0 ? [sku] : await db.select().from(productSkus).where(eq(productSkus.productId, product.id)).orderBy(asc(productSkus.priceAmount)).limit(1);
	const [option] = await db.select({ id: productOptions.id }).from(productOptions).where(eq(productOptions.productId, product.id)).limit(1);
	return {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		brand: product.brand,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		ratingAvg: product.ratingAvg,
		ratingCount: product.ratingCount,
		isNew: product.isNew,
		isHot: product.isHot,
		imageUrl: image ? getS3Url(image.s3Key) : null,
		imageAlt: image?.alt || null,
		priceAmount: anySku?.priceAmount || 0,
		compareAtAmount: anySku?.compareAtAmount || null,
		currency: anySku?.currency || "BDT",
		isAvailable: sku !== void 0,
		hasVariants: option !== void 0,
		vendor: {
			id: product.vendor.id,
			name: product.vendor.name,
			slug: product.vendor.slug,
			isVerified: product.vendor.isVerified
		},
		category: {
			id: product.category.id,
			name: product.category.name,
			slug: product.category.slug
		}
	};
}
const categoryRouter = new Hono().get("/:slug", describeRoute({
	tags: ["Category"],
	summary: "Get category page data",
	description: "Fetch category details, products with pagination, and available facets (brands, age ranges, price range) for filtering.",
	responses: {
		200: {
			description: "Successful response with category page data",
			content: { "application/json": { schema: resolver(z.object({
				category: z.any(),
				products: z.array(z.any()),
				pagination: z.object({
					page: z.number(),
					limit: z.number(),
					total: z.number(),
					totalPages: z.number()
				}),
				facets: z.object({
					brands: z.array(z.any()),
					ageRanges: z.array(z.any()),
					priceRange: z.object({
						min: z.number(),
						max: z.number()
					})
				})
			})) } }
		},
		404: {
			description: "Category not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("query", categoryPageQuerySchema), async (c) => {
	const { slug } = c.req.param();
	const { page, limit, sort, brand, minPrice, maxPrice, ageRange, rating } = c.req.valid("query");
	const [categoryRow] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
	if (!categoryRow) return c.json({ error: "Category not found" }, 404);
	let parentCategory = null;
	if (categoryRow.parentId) {
		const [parent] = await db.select().from(categories).where(eq(categories.id, categoryRow.parentId)).limit(1);
		if (parent) parentCategory = {
			name: parent.name,
			nameBn: parent.nameBn,
			slug: parent.slug
		};
	}
	const categoryIds = [];
	async function addCategoryAndDescendants(categoryId) {
		categoryIds.push(categoryId);
		const children = await db.select().from(categories).where(eq(categories.parentId, categoryId));
		for (const child of children) await addCategoryAndDescendants(child.id);
	}
	await addCategoryAndDescendants(categoryRow.id);
	const conditions = [eq(products.isActive, true), inArray(products.categoryId, categoryIds)];
	const brandFilters = brand?.split(",").filter(Boolean) || [];
	if (brandFilters.length > 0) {
		const brandConditions = brandFilters.map((b) => ilike(products.brand, b));
		conditions.push(sql`(${sql.join(brandConditions, sql` OR `)})`);
	}
	const ageRangeFilters = ageRange?.split(",").filter(Boolean) || [];
	if (ageRangeFilters.length > 0) {
		const ageConditions = ageRangeFilters.map((ar) => {
			const option = AGE_RANGE_OPTIONS.find((o) => o.value === ar) || AGE_RANGE_OPTIONS.find((o) => o.label === ar);
			if (!option) return null;
			return and(lte(products.ageRangeMin, option.max), gte(products.ageRangeMax, option.min));
		}).filter((condition) => condition !== null);
		if (ageConditions.length > 0) conditions.push(or(...ageConditions));
	}
	if (rating !== void 0) conditions.push(gte(products.ratingAvg, rating));
	let queryBuilder = db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(...conditions));
	switch (sort) {
		case "newest":
			queryBuilder = queryBuilder.orderBy(desc(products.createdAt), desc(products.id));
			break;
		case "name_asc":
			queryBuilder = queryBuilder.orderBy(asc(products.title), asc(products.id));
			break;
		default: queryBuilder = queryBuilder.orderBy(desc(products.createdAt), desc(products.id));
	}
	const allRows = await queryBuilder;
	let formattedProducts = await Promise.all(allRows.map((row) => formatProductCard({
		...row.product,
		vendor: row.vendor,
		category: row.category
	})));
	if (minPrice !== void 0 || maxPrice !== void 0) formattedProducts = formattedProducts.filter((p) => {
		if (minPrice !== void 0 && p.priceAmount < minPrice) return false;
		if (maxPrice !== void 0 && p.priceAmount > maxPrice) return false;
		return true;
	});
	if (sort === "price_asc") formattedProducts.sort((a, b) => a.priceAmount - b.priceAmount);
	else if (sort === "price_desc") formattedProducts.sort((a, b) => b.priceAmount - a.priceAmount);
	const total = formattedProducts.length;
	const totalPages = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	const paginatedProducts = formattedProducts.slice(offset, offset + limit);
	const brandCounts = {};
	for (const p of formattedProducts) if (p.brand) brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
	const brandFacets = Object.entries(brandCounts).map(([name, count$1]) => ({
		name,
		count: count$1
	})).sort((a, b) => b.count - a.count);
	const ageRangeCounts = {};
	for (const p of formattedProducts) if (p.ageRangeMin !== null && p.ageRangeMax !== null) {
		for (const option of AGE_RANGE_OPTIONS) if (p.ageRangeMin <= option.max && p.ageRangeMax >= option.min) ageRangeCounts[option.value] = (ageRangeCounts[option.value] || 0) + 1;
	}
	const ageRangeFacets = AGE_RANGE_OPTIONS.map((option) => ({
		value: option.value,
		label: option.label,
		labelBn: option.labelBn,
		count: ageRangeCounts[option.value] || 0
	})).filter((ar) => ar.count > 0);
	const prices = formattedProducts.map((p) => p.priceAmount).filter((p) => p > 0);
	const priceRange = {
		min: prices.length > 0 ? Math.min(...prices) : 0,
		max: prices.length > 0 ? Math.max(...prices) : 1e5
	};
	const response = {
		category: {
			id: categoryRow.id,
			name: categoryRow.name,
			nameBn: categoryRow.nameBn,
			slug: categoryRow.slug,
			parentId: categoryRow.parentId,
			imageUrl: categoryRow.imageUrl,
			parent: parentCategory
		},
		products: paginatedProducts,
		pagination: {
			page,
			limit,
			total,
			totalPages
		},
		facets: {
			brands: brandFacets,
			ageRanges: ageRangeFacets,
			priceRange
		}
	};
	return c.json(response, 200);
});

//#endregion
//#region src/routes/recommendations.ts
function formatCategoryDTO(category, productCount) {
	return {
		id: category.id,
		name: category.name,
		nameBn: category.nameBn,
		slug: category.slug,
		parentId: category.parentId,
		iconKey: category.iconKey,
		imageUrl: category.imageUrl,
		sortOrder: category.sortOrder,
		productCount
	};
}
const recommendationsRouter = new Hono().get("/categories", describeRoute({
	tags: ["Recommendations"],
	summary: "Get category recommendations",
	description: "Fetch curated category recommendations including popular, mom's choice, trending, and editor picks.",
	responses: { 200: {
		description: "Successful response with category recommendations",
		content: { "application/json": { schema: resolver(z.object({
			popularCategories: z.array(z.any()),
			momsChoice: z.array(z.any()),
			trendingCategories: z.array(z.any()),
			editorPicks: z.array(z.any())
		})) } }
	} }
}), zValidator("query", recommendationsQuerySchema), async (c) => {
	const { limit, season } = c.req.valid("query");
	const popularCategories = (await db.select({
		category: categories,
		metrics: categoryMetrics,
		productCount: sql`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
          AND ${products.status} = 'approved'
        )`
	}).from(categories).leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id)).where(eq(categories.displayInMegaMenu, true)).orderBy(desc(sql`COALESCE(${categoryMetrics.popularityScore}, 0)`)).limit(limit)).map((row) => formatCategoryDTO(row.category, row.productCount));
	const momsChoice = (await db.select({
		category: categories,
		metrics: categoryMetrics,
		productCount: sql`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
          AND ${products.status} = 'approved'
        )`
	}).from(categories).leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id)).where(and(eq(categories.displayInMegaMenu, true), sql`COALESCE(${categoryMetrics.momChoiceWeight}, 0) > 0`)).orderBy(desc(sql`COALESCE(${categoryMetrics.momChoiceWeight}, 0)`)).limit(limit)).map((row) => formatCategoryDTO(row.category, row.productCount));
	const trendingConditions = [eq(categories.displayInMegaMenu, true)];
	if (season) trendingConditions.push(arrayContains(categoryMetrics.seasonalTags, [season]));
	const response = {
		popularCategories,
		momsChoice,
		trendingCategories: (await db.select({
			category: categories,
			metrics: categoryMetrics,
			productCount: sql`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
          AND ${products.status} = 'approved'
        )`
		}).from(categories).leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id)).where(and(...trendingConditions)).orderBy(desc(sql`COALESCE(${categoryMetrics.trendingScore}, 0)`)).limit(limit)).map((row) => formatCategoryDTO(row.category, row.productCount)),
		editorPicks: (await db.select({
			category: categories,
			metrics: categoryMetrics,
			productCount: sql`(
          SELECT COUNT(*)::int
          FROM ${products}
          WHERE ${products.categoryId} = ${categories.id}
          AND ${products.isActive} = true
          AND ${products.status} = 'approved'
        )`
		}).from(categories).leftJoin(categoryMetrics, eq(categoryMetrics.categoryId, categories.id)).where(and(eq(categories.displayInMegaMenu, true), sql`COALESCE(${categoryMetrics.editorPickWeight}, 0) > 0`)).orderBy(desc(sql`COALESCE(${categoryMetrics.editorPickWeight}, 0)`)).limit(limit)).map((row) => formatCategoryDTO(row.category, row.productCount))
	};
	return c.json(response, 200);
}).get("/cart", describeRoute({
	tags: ["Recommendations"],
	summary: "Get cart-based product recommendations",
	description: "Fetch product recommendations based on items in the cart. Returns products from the same categories as cart items, excluding the cart items themselves.",
	responses: { 200: {
		description: "Successful response with recommended products",
		content: { "application/json": { schema: resolver(z.object({ products: z.array(z.any()) })) } }
	} }
}), zValidator("query", cartRecommendationsQuerySchema), async (c) => {
	const { productIds, limit } = c.req.valid("query");
	if (productIds.length === 0) return c.json({ products: [] }, 200);
	const cartProducts = await db.select({ categoryId: products.categoryId }).from(products).where(inArray(products.id, productIds));
	const categoryIds = [...new Set(cartProducts.map((p) => p.categoryId))];
	if (categoryIds.length === 0) return c.json({ products: [] }, 200);
	const recommendedProductRows = await db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(inArray(products.categoryId, categoryIds), eq(products.isActive, true), eq(products.status, "approved"), notInArray(products.id, productIds))).orderBy(desc(products.ratingAvg)).limit(limit);
	const recommendedProductIds = recommendedProductRows.map((r) => r.product.id);
	const recommendedImages = recommendedProductIds.length > 0 ? await db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key,
		alt: productImages.alt
	}).from(productImages).where(inArray(productImages.productId, recommendedProductIds)) : [];
	const recommendedSkus = recommendedProductIds.length > 0 ? await db.select().from(productSkus).where(inArray(productSkus.productId, recommendedProductIds)) : [];
	const response = { products: recommendedProductRows.map((row) => {
		const prodImages = recommendedImages.filter((img) => img.productId === row.product.id);
		const prodSkus = recommendedSkus.filter((sku) => sku.productId === row.product.id);
		const availableSkus = prodSkus.filter((s) => s.isAvailable);
		const lowestSku = [...availableSkus.length ? availableSkus : prodSkus].sort((a, b) => a.priceAmount - b.priceAmount)[0];
		const hasVariants = prodSkus.length > 1 || prodSkus.some((s) => s.optionValues && Object.keys(s.optionValues).length > 0);
		return {
			id: row.product.id,
			title: row.product.title,
			titleBn: row.product.titleBn,
			slug: row.product.slug,
			brand: row.product.brand,
			ageRange: row.product.ageRange,
			ageRangeMin: row.product.ageRangeMin,
			ageRangeMax: row.product.ageRangeMax,
			isBpaFree: row.product.isBpaFree,
			isOrganic: row.product.isOrganic,
			isHypoallergenic: row.product.isHypoallergenic,
			ratingAvg: row.product.ratingAvg,
			ratingCount: row.product.ratingCount,
			isNew: row.product.isNew,
			isHot: row.product.isHot,
			imageUrl: prodImages[0] ? getS3Url(prodImages[0].s3Key) : null,
			imageAlt: prodImages[0]?.alt || null,
			priceAmount: lowestSku?.priceAmount || 0,
			compareAtAmount: lowestSku?.compareAtAmount || null,
			currency: lowestSku?.currency || "BDT",
			isAvailable: availableSkus.length > 0,
			hasVariants,
			vendor: {
				id: row.vendor.id,
				name: row.vendor.name,
				slug: row.vendor.slug,
				isVerified: row.vendor.isVerified
			},
			category: {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug
			}
		};
	}) };
	return c.json(response, 200);
});

//#endregion
//#region ../../packages/api-types/src/cart.ts
const cartHeaders = z.object({ "x-guest-id": z.string().uuid() });
const cartItemParamSchema = z.object({ itemId: z.string().uuid() });
const cartAddItemSchema = z.object({
	productId: z.string().uuid(),
	skuId: z.string().uuid().optional(),
	quantity: z.number().int().min(1).default(1)
});
const cartUpdateItemSchema = z.object({ quantity: z.number().int().min(1) });

//#endregion
//#region src/routes/cart.ts
const getCartByUserId = async (userId) => {
	const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
	return cart ?? null;
};
const getCartBySessionId = async (sessionId) => {
	const [cart] = await db.select().from(carts).where(eq(carts.sessionId, sessionId)).limit(1);
	return cart ?? null;
};
const resolveCart = async (userId, guestId) => {
	if (userId) return await getCartByUserId(userId);
	if (guestId) return await getCartBySessionId(guestId);
	return null;
};
const createCart = async (userId, guestId) => {
	const [cart] = await db.insert(carts).values({
		userId: userId ?? null,
		sessionId: userId ? null : guestId
	}).returning();
	return cart;
};
const getOrCreateCart = async (userId, guestId) => {
	const existing = await resolveCart(userId, guestId);
	if (existing) return existing;
	return await createCart(userId, guestId);
};
const selectSkuForProduct = async (productId, skuId) => {
	const skuRows = await db.select({
		id: productSkus.id,
		productId: productSkus.productId,
		sku: productSkus.sku,
		priceAmount: productSkus.priceAmount,
		stockQty: productSkus.stockQty,
		isAvailable: productSkus.isAvailable,
		optionValues: productSkus.optionValues
	}).from(productSkus).where(eq(productSkus.productId, productId)).orderBy(asc(productSkus.priceAmount));
	if (skuId) return skuRows.find((sku) => sku.id === skuId) ?? null;
	return skuRows.find((sku) => (sku.isAvailable ?? true) && sku.stockQty > 0) ?? skuRows[0] ?? null;
};
const buildCartResponse = async (cart) => {
	const itemRows = await db.select({
		itemId: cartItems.id,
		skuId: cartItems.skuId,
		quantity: cartItems.quantity,
		unitPrice: cartItems.unitPrice,
		productId: products.id,
		productTitle: products.title,
		productTitleBn: products.titleBn,
		productSlug: products.slug,
		productAgeRange: products.ageRange,
		productIsBpaFree: products.isBpaFree,
		productIsOrganic: products.isOrganic,
		productIsHypoallergenic: products.isHypoallergenic,
		productExpiryDate: products.expiryDate,
		productStatus: products.status,
		productIsActive: products.isActive,
		vendorId: vendors.id,
		vendorName: vendors.name
	}).from(cartItems).innerJoin(products, eq(cartItems.productId, products.id)).innerJoin(vendors, eq(products.vendorId, vendors.id)).where(eq(cartItems.cartId, cart.id));
	if (itemRows.length === 0) return { cart: {
		id: cart.id,
		items: [],
		subtotal: 0,
		itemCount: 0
	} };
	const invalidItemIds = itemRows.filter((row) => row.productStatus !== "approved" || !row.productIsActive).map((row) => row.itemId);
	if (invalidItemIds.length > 0) await db.delete(cartItems).where(inArray(cartItems.id, invalidItemIds));
	const validRows = itemRows.filter((row) => row.productStatus === "approved" && row.productIsActive);
	if (validRows.length === 0) return { cart: {
		id: cart.id,
		items: [],
		subtotal: 0,
		itemCount: 0
	} };
	const productIds = Array.from(new Set(validRows.map((row) => row.productId)));
	const imageRows = await db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key,
		alt: productImages.alt,
		sortOrder: productImages.sortOrder
	}).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder));
	const imageByProduct = /* @__PURE__ */ new Map();
	for (const image of imageRows) if (!imageByProduct.has(image.productId)) imageByProduct.set(image.productId, {
		url: getS3Url(image.s3Key),
		alt: image.alt
	});
	const skuRows = await db.select({
		id: productSkus.id,
		productId: productSkus.productId,
		sku: productSkus.sku,
		priceAmount: productSkus.priceAmount,
		stockQty: productSkus.stockQty,
		isAvailable: productSkus.isAvailable,
		optionValues: productSkus.optionValues
	}).from(productSkus).where(inArray(productSkus.productId, productIds)).orderBy(asc(productSkus.priceAmount));
	const skuById = /* @__PURE__ */ new Map();
	const preferredSkuByProduct = /* @__PURE__ */ new Map();
	const fallbackSkuByProduct = /* @__PURE__ */ new Map();
	for (const sku of skuRows) {
		skuById.set(sku.id, sku);
		if (!fallbackSkuByProduct.has(sku.productId)) fallbackSkuByProduct.set(sku.productId, sku);
		if (!preferredSkuByProduct.has(sku.productId) && (sku.isAvailable ?? true) && sku.stockQty > 0) preferredSkuByProduct.set(sku.productId, sku);
	}
	const items = validRows.map((row) => {
		const sku = (row.skuId ? skuById.get(row.skuId) : null) ?? preferredSkuByProduct.get(row.productId) ?? fallbackSkuByProduct.get(row.productId);
		const image = imageByProduct.get(row.productId);
		const currentPrice = sku?.priceAmount ?? row.unitPrice;
		const stock = sku?.stockQty ?? 0;
		const optionValues = sku?.optionValues;
		return {
			id: row.itemId,
			skuId: row.skuId ?? null,
			selectedOptions: optionValues ?? null,
			product: {
				id: row.productId,
				title: row.productTitle,
				titleBn: row.productTitleBn,
				slug: row.productSlug,
				image: image?.url ?? null,
				imageAlt: image?.alt ?? null,
				price: currentPrice,
				stock,
				vendor: {
					id: row.vendorId,
					shopName: row.vendorName
				},
				ageRange: row.productAgeRange,
				isBpaFree: row.productIsBpaFree,
				isOrganic: row.productIsOrganic,
				isHypoallergenic: row.productIsHypoallergenic,
				expiryDate: row.productExpiryDate ? row.productExpiryDate.toISOString() : null
			},
			quantity: row.quantity,
			unitPrice: row.unitPrice,
			lineTotal: row.unitPrice * row.quantity
		};
	});
	const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	return { cart: {
		id: cart.id,
		items,
		subtotal,
		itemCount
	} };
};
const cartRouter = new Hono().get("/", describeRoute({
	tags: ["Cart"],
	summary: "Get current cart",
	responses: {
		200: {
			description: "Cart retrieved successfully",
			content: { "application/json": { schema: resolver(z.object({ cart: z.any() })) } }
		},
		404: { description: "Cart not found" }
	}
}), zValidator("header", cartHeaders), async (c) => {
	const guestId = c.req.valid("header")["x-guest-id"];
	const cart = await resolveCart(c.var.user?.id ?? null, guestId);
	if (!cart) return c.json({ error: "Cart not found" }, 404);
	const response = await buildCartResponse(cart);
	return c.json(response);
}).post("/items", describeRoute({
	tags: ["Cart"],
	summary: "Add item to cart",
	responses: { 200: {
		description: "Item added successfully",
		content: { "application/json": { schema: resolver(z.object({ cart: z.any() })) } }
	} }
}), zValidator("header", cartHeaders), zValidator("json", cartAddItemSchema), async (c) => {
	const guestId = c.req.valid("header")["x-guest-id"];
	const { productId, skuId, quantity } = c.req.valid("json");
	const userId = c.var.user?.id ?? null;
	const [product] = await db.select({
		id: products.id,
		status: products.status,
		isActive: products.isActive
	}).from(products).where(eq(products.id, productId)).limit(1);
	if (!product) return c.json({ error: "Product not found" }, 404);
	if (product.status !== "approved" || !product.isActive) return c.json({ error: "Product unavailable" }, 400);
	const sku = await selectSkuForProduct(productId, skuId);
	if (!sku) return c.json({ error: "Product out of stock" }, 400);
	if ((sku.isAvailable ?? true) === false || sku.stockQty <= 0) return c.json({ error: "Product out of stock" }, 400);
	const cart = await getOrCreateCart(userId, guestId);
	if (!cart) return c.json({ error: "Failed to create cart" }, 500);
	const existingConditions = [eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)];
	if (sku.id) existingConditions.push(eq(cartItems.skuId, sku.id));
	const [existing] = await db.select().from(cartItems).where(and(...existingConditions)).limit(1);
	if (existing) {
		const nextQty = existing.quantity + quantity;
		if (nextQty > sku.stockQty) return c.json({ error: "Insufficient stock" }, 400);
		await db.update(cartItems).set({
			quantity: nextQty,
			skuId: sku.id
		}).where(eq(cartItems.id, existing.id));
	} else {
		if (quantity > sku.stockQty) return c.json({ error: "Insufficient stock" }, 400);
		await db.insert(cartItems).values({
			cartId: cart.id,
			productId,
			skuId: sku.id,
			quantity,
			unitPrice: sku.priceAmount
		});
	}
	const response = await buildCartResponse(cart);
	return c.json(response);
}).patch("/items/:itemId", describeRoute({
	tags: ["Cart"],
	summary: "Update cart item quantity",
	responses: { 200: {
		description: "Item updated successfully",
		content: { "application/json": { schema: resolver(z.object({ cart: z.any() })) } }
	} }
}), zValidator("header", cartHeaders), zValidator("param", cartItemParamSchema), zValidator("json", cartUpdateItemSchema), async (c) => {
	const guestId = c.req.valid("header")["x-guest-id"];
	const { itemId } = c.req.valid("param");
	const { quantity } = c.req.valid("json");
	const cart = await resolveCart(c.var.user?.id ?? null, guestId);
	if (!cart) return c.json({ error: "Cart not found" }, 404);
	const [item] = await db.select({
		id: cartItems.id,
		productId: cartItems.productId
	}).from(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id))).limit(1);
	if (!item) return c.json({ error: "Item not found" }, 404);
	const [product] = await db.select({
		status: products.status,
		isActive: products.isActive
	}).from(products).where(eq(products.id, item.productId)).limit(1);
	if (!product || product.status !== "approved" || !product.isActive) {
		await db.delete(cartItems).where(eq(cartItems.id, item.id));
		return c.json({ error: "Product unavailable" }, 400);
	}
	const sku = await selectSkuForProduct(item.productId);
	if (!sku || sku.stockQty <= 0) return c.json({ error: "Product out of stock" }, 400);
	if (quantity > sku.stockQty) return c.json({ error: "Insufficient stock" }, 400);
	await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, item.id));
	const response = await buildCartResponse(cart);
	return c.json(response);
}).delete("/items/:itemId", describeRoute({
	tags: ["Cart"],
	summary: "Remove cart item",
	responses: { 200: {
		description: "Item removed successfully",
		content: { "application/json": { schema: resolver(z.object({ cart: z.any() })) } }
	} }
}), zValidator("header", cartHeaders), zValidator("param", cartItemParamSchema), async (c) => {
	const guestId = c.req.valid("header")["x-guest-id"];
	const { itemId } = c.req.valid("param");
	const cart = await resolveCart(c.var.user?.id ?? null, guestId);
	if (!cart) return c.json({ error: "Cart not found" }, 404);
	await db.delete(cartItems).where(and(eq(cartItems.id, itemId), eq(cartItems.cartId, cart.id)));
	const response = await buildCartResponse(cart);
	return c.json(response);
}).post("/merge", describeRoute({
	tags: ["Cart"],
	summary: "Merge guest cart into user cart",
	responses: {
		200: {
			description: "Cart merged successfully",
			content: { "application/json": { schema: resolver(z.object({ cart: z.any() })) } }
		},
		401: { description: "Unauthorized" }
	}
}), zValidator("header", cartHeaders), async (c) => {
	const userId = c.var.user?.id ?? null;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const guestId = c.req.valid("header")["x-guest-id"];
	const guestCart = await getCartBySessionId(guestId);
	if (!guestCart) {
		const existingUserCart = await getCartByUserId(userId);
		if (!existingUserCart) {
			const created = await createCart(userId, null);
			if (!created) return c.json({ error: "Failed to create cart" }, 500);
			const response$2 = await buildCartResponse(created);
			return c.json(response$2);
		}
		const response$1 = await buildCartResponse(existingUserCart);
		return c.json(response$1);
	}
	const userCart = await getCartByUserId(userId);
	if (!userCart) {
		const [updated] = await db.update(carts).set({
			userId,
			sessionId: null
		}).where(eq(carts.id, guestCart.id)).returning();
		if (!updated) return c.json({ error: "Failed to update cart" }, 500);
		const response$1 = await buildCartResponse(updated);
		return c.json(response$1);
	}
	const guestItems = await db.select().from(cartItems).where(eq(cartItems.cartId, guestCart.id));
	for (const guestItem of guestItems) {
		const sku = await selectSkuForProduct(guestItem.productId, guestItem.skuId ?? void 0);
		if (!sku) continue;
		const mergeConditions = [eq(cartItems.cartId, userCart.id), eq(cartItems.productId, guestItem.productId)];
		if (guestItem.skuId) mergeConditions.push(eq(cartItems.skuId, guestItem.skuId));
		const [existing] = await db.select().from(cartItems).where(and(...mergeConditions)).limit(1);
		if (existing) {
			const nextQty = Math.min(existing.quantity + guestItem.quantity, sku.stockQty);
			await db.update(cartItems).set({ quantity: nextQty }).where(eq(cartItems.id, existing.id));
		} else {
			const nextQty = Math.min(guestItem.quantity, sku.stockQty);
			if (nextQty <= 0) continue;
			await db.insert(cartItems).values({
				cartId: userCart.id,
				productId: guestItem.productId,
				skuId: guestItem.skuId,
				quantity: nextQty,
				unitPrice: guestItem.unitPrice
			});
		}
	}
	await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
	await db.delete(carts).where(eq(carts.id, guestCart.id));
	const response = await buildCartResponse(userCart);
	return c.json(response);
});

//#endregion
//#region ../../packages/api-types/src/vendor.ts
const BD_DISTRICTS = [
	"Bagerhat",
	"Bandarban",
	"Barguna",
	"Barishal",
	"Bhola",
	"Bogra",
	"Brahmanbaria",
	"Chandpur",
	"Chapainawabganj",
	"Chattogram",
	"Chuadanga",
	"Comilla",
	"Cox's Bazar",
	"Dhaka",
	"Dinajpur",
	"Faridpur",
	"Feni",
	"Gaibandha",
	"Gazipur",
	"Gopalganj",
	"Habiganj",
	"Jamalpur",
	"Jashore",
	"Jhalokati",
	"Jhenaidah",
	"Joypurhat",
	"Khagrachhari",
	"Khulna",
	"Kishoreganj",
	"Kurigram",
	"Kushtia",
	"Lakshmipur",
	"Lalmonirhat",
	"Madaripur",
	"Magura",
	"Manikganj",
	"Meherpur",
	"Moulvibazar",
	"Munshiganj",
	"Mymensingh",
	"Naogaon",
	"Narail",
	"Narayanganj",
	"Narsingdi",
	"Natore",
	"Nawabganj",
	"Netrokona",
	"Nilphamari",
	"Noakhali",
	"Pabna",
	"Panchagarh",
	"Patuakhali",
	"Pirojpur",
	"Rajbari",
	"Rajshahi",
	"Rangamati",
	"Rangpur",
	"Satkhira",
	"Shariatpur",
	"Sherpur",
	"Sirajganj",
	"Sunamganj",
	"Sylhet",
	"Tangail",
	"Thakurgaon"
];
const BUSINESS_TYPES = [
	"sole_proprietor",
	"partnership",
	"company"
];
const bdPhoneRegex$1 = /^01[3-9]\d{8}$/;
const nidRegex = /^(\d{10}|\d{17})$/;
const businessInfoSchema = z.object({
	shopNameEn: z.string().min(2, "Shop name must be at least 2 characters").max(200, "Shop name must not exceed 200 characters"),
	shopNameBn: z.string().max(200, "Shop name must not exceed 200 characters").optional(),
	ownerName: z.string().min(2, "Owner name must be at least 2 characters").max(200, "Owner name must not exceed 200 characters"),
	phone: z.string().regex(bdPhoneRegex$1, "Invalid BD phone number (e.g., 01712345678)"),
	email: z.string().email("Invalid email address"),
	businessType: z.enum(BUSINESS_TYPES, { error: "Please select a business type" })
});
const addressSchema = z.object({
	addressLine1: z.string().min(5, "Address must be at least 5 characters").max(500, "Address must not exceed 500 characters"),
	addressLine2: z.string().max(500, "Address must not exceed 500 characters").optional(),
	district: z.enum(BD_DISTRICTS, { error: "Please select a district" }),
	city: z.string().min(2, "City must be at least 2 characters").max(100, "City must not exceed 100 characters"),
	postalCode: z.string().max(10, "Postal code must not exceed 10 characters").optional()
});
const documentsSchema = z.object({
	nidNumber: z.string().regex(nidRegex, "NID must be 10 or 17 digits"),
	nidFrontUrl: z.string().url().or(z.string().startsWith("private://")),
	nidBackUrl: z.string().url().or(z.string().startsWith("private://")),
	tradeLicenseUrl: z.string().url().or(z.string().startsWith("private://")).optional(),
	shopLogoUrl: z.string().url("Invalid shop logo URL").optional()
});
const paymentSchema = z.object({
	bankName: z.string().max(100, "Bank name must not exceed 100 characters").optional(),
	bankAccountNumber: z.string().max(50, "Account number must not exceed 50 characters").optional(),
	bankAccountName: z.string().max(200, "Account name must not exceed 200 characters").optional(),
	bkashNumber: z.string().regex(bdPhoneRegex$1, "Invalid bKash number").optional().or(z.literal("")),
	nagadNumber: z.string().regex(bdPhoneRegex$1, "Invalid Nagad number").optional().or(z.literal(""))
}).refine((data) => {
	const hasBank = data.bankName && data.bankAccountNumber && data.bankAccountName;
	const hasBkash = data.bkashNumber && data.bkashNumber.length > 0;
	const hasNagad = data.nagadNumber && data.nagadNumber.length > 0;
	return hasBank || hasBkash || hasNagad;
}, { message: "At least one payment method is required (Bank, bKash, or Nagad)" });
const vendorApplicationSchema = businessInfoSchema.merge(addressSchema).merge(documentsSchema).merge(z.object({
	bankName: z.string().max(100).optional(),
	bankAccountNumber: z.string().max(50).optional(),
	bankAccountName: z.string().max(200).optional(),
	bkashNumber: z.string().optional(),
	nagadNumber: z.string().optional()
})).refine((data) => {
	const hasBank = data.bankName && data.bankAccountNumber && data.bankAccountName;
	const hasBkash = data.bkashNumber && data.bkashNumber.length > 0;
	const hasNagad = data.nagadNumber && data.nagadNumber.length > 0;
	return hasBank || hasBkash || hasNagad;
}, {
	message: "At least one payment method is required (Bank, bKash, or Nagad)",
	path: ["bankName"]
});

//#endregion
//#region src/lib/cloudinary.ts
const CLOUDINARY_REFERENCE_PREFIX = "cloudinary://";
const CLOUDINARY_PRIVATE_REFERENCE_PREFIX = "cloudinary-private://";
function configuredCloudinary() {
	if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
	v2.config({
		cloud_name: env.CLOUDINARY_CLOUD_NAME,
		api_key: env.CLOUDINARY_API_KEY,
		api_secret: env.CLOUDINARY_API_SECRET,
		secure: true
	});
	return v2;
}
function cloudinaryPublicReference(resourceType, publicId) {
	return `${CLOUDINARY_REFERENCE_PREFIX}${resourceType}/${publicId}`;
}
function cloudinaryPrivateReference(value) {
	return `${CLOUDINARY_PRIVATE_REFERENCE_PREFIX}${encodeURIComponent(JSON.stringify(value))}`;
}
function isCloudinaryReference(value) {
	return value.startsWith(CLOUDINARY_REFERENCE_PREFIX);
}
function parseCloudinaryReference(value) {
	if (!isCloudinaryReference(value)) return null;
	const [resourceType, ...publicIdParts] = value.slice(13).split("/");
	if (resourceType !== "image" && resourceType !== "raw" || !publicIdParts.length) return null;
	return {
		resourceType,
		publicId: publicIdParts.join("/")
	};
}
async function uploadToCloudinary(file, options) {
	const client = configuredCloudinary();
	const resourceType = file.type === "application/pdf" ? "raw" : "image";
	const bytes = Buffer.from(await file.arrayBuffer());
	return new Promise((resolve$1, reject) => {
		client.uploader.upload_stream({
			public_id: options.publicId,
			resource_type: resourceType,
			type: options.privateAsset ? "authenticated" : "upload",
			overwrite: false
		}, (error$1, result) => {
			if (error$1 || !result) return reject(error$1 ?? /* @__PURE__ */ new Error("Cloudinary returned no upload result"));
			resolve$1({
				publicId: result.public_id,
				format: result.format,
				resourceType,
				secureUrl: result.secure_url
			});
		}).end(bytes);
	});
}
async function deleteCloudinaryReference(reference) {
	const parsed = parseCloudinaryReference(reference);
	if (!parsed) return;
	await configuredCloudinary().uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType });
}
function signedPrivateCloudinaryUrl(reference) {
	if (!reference.startsWith(CLOUDINARY_PRIVATE_REFERENCE_PREFIX)) return null;
	const payload = JSON.parse(decodeURIComponent(reference.slice(21)));
	return configuredCloudinary().utils.private_download_url(payload.publicId, payload.format, {
		resource_type: payload.resourceType,
		type: "authenticated",
		expires_at: Math.floor(Date.now() / 1e3) + 3600
	});
}

//#endregion
//#region src/lib/private-file-url.ts
const PRIVATE_REFERENCE_PREFIX = "private://";
function isPrivateFileReference(value) {
	return value.startsWith(PRIVATE_REFERENCE_PREFIX);
}
/** Resolve a private object reference only in an authorized API response. */
function resolvePrivateFileUrl(value) {
	const cloudinaryUrl = signedPrivateCloudinaryUrl(value);
	if (cloudinaryUrl) return cloudinaryUrl;
	if (!isPrivateFileReference(value)) return value;
	return value;
}

//#endregion
//#region src/routes/vendor.ts
const slugify = (text$1) => text$1.toLowerCase().trim().replace(/[\s_]+/g, "-").replace(/[^\w\-]+/g, "").replace(/\-\-+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
const generateUniqueSlug = async (shopName) => {
	const baseSlug = slugify(shopName);
	let slug = baseSlug;
	let counter = 0;
	while (true) {
		const [existing] = await db.select({ id: vendorApplications.id }).from(vendorApplications).where(eq(vendorApplications.slug, slug)).limit(1);
		if (!existing) return slug;
		counter++;
		slug = `${baseSlug}-${counter}`;
	}
};
const mapToDTO = (row) => ({
	id: row.id,
	userId: row.userId,
	status: row.status,
	shopNameEn: row.shopNameEn,
	shopNameBn: row.shopNameBn,
	ownerName: row.ownerName,
	phone: row.phone,
	email: row.email,
	businessType: row.businessType,
	addressLine1: row.addressLine1,
	addressLine2: row.addressLine2,
	district: row.district,
	city: row.city,
	postalCode: row.postalCode,
	nidNumber: row.nidNumber,
	nidFrontUrl: resolvePrivateFileUrl(row.nidFrontUrl),
	nidBackUrl: resolvePrivateFileUrl(row.nidBackUrl),
	tradeLicenseUrl: row.tradeLicenseUrl ? resolvePrivateFileUrl(row.tradeLicenseUrl) : null,
	shopLogoUrl: row.shopLogoUrl,
	bankName: row.bankName,
	bankAccountNumber: row.bankAccountNumber,
	bankAccountName: row.bankAccountName,
	bkashNumber: row.bkashNumber,
	nagadNumber: row.nagadNumber,
	slug: row.slug,
	reviewNotes: row.reviewNotes,
	reviewedAt: row.reviewedAt?.toISOString() ?? null,
	vendorId: row.vendorId,
	createdAt: row.createdAt.toISOString(),
	updatedAt: row.updatedAt.toISOString()
});
const vendorRouter = new Hono().get("/application/status", describeRoute({
	tags: ["Vendor"],
	summary: "Get vendor application status",
	description: "Check if the authenticated user has a vendor application and its current status.",
	responses: {
		200: {
			description: "Application status retrieved",
			content: { "application/json": { schema: resolver(z.object({
				exists: z.boolean(),
				canApply: z.boolean(),
				canResubmit: z.boolean(),
				application: z.any().nullable()
			})) } }
		},
		401: {
			description: "Unauthorized - user not logged in",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const [application] = await db.select().from(vendorApplications).where(eq(vendorApplications.userId, userId)).limit(1);
	if (!application) return c.json({
		exists: false,
		canApply: true,
		canResubmit: false,
		application: null
	}, 200);
	const response = {
		exists: true,
		canApply: false,
		canResubmit: application.status === "rejected",
		application: mapToDTO(application)
	};
	return c.json(response, 200);
}).post("/application", describeRoute({
	tags: ["Vendor"],
	summary: "Submit vendor application",
	description: "Submit a new vendor application or resubmit after rejection. State machine ensures idempotent handling.",
	responses: {
		201: {
			description: "Application submitted successfully",
			content: { "application/json": { schema: resolver(z.object({
				success: z.boolean(),
				application: z.any()
			})) } }
		},
		401: {
			description: "Unauthorized - user not logged in",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		409: {
			description: "Application already exists and cannot be modified",
			content: { "application/json": { schema: resolver(z.object({
				error: z.string(),
				status: z.string()
			})) } }
		}
	}
}), zValidator("json", vendorApplicationSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const input = c.req.valid("json");
	const [existing] = await db.select().from(vendorApplications).where(eq(vendorApplications.userId, userId)).limit(1);
	if (existing) {
		if (existing.status === "pending") return c.json({
			error: "Application already pending review",
			status: "pending"
		}, 409);
		if (existing.status === "approved") return c.json({
			error: "You are already a verified vendor",
			status: "approved"
		}, 409);
		const [updated] = await db.update(vendorApplications).set({
			status: "pending",
			shopNameEn: input.shopNameEn,
			shopNameBn: input.shopNameBn ?? null,
			ownerName: input.ownerName,
			phone: input.phone,
			email: input.email,
			businessType: input.businessType,
			addressLine1: input.addressLine1,
			addressLine2: input.addressLine2 ?? null,
			district: input.district,
			city: input.city,
			postalCode: input.postalCode ?? null,
			nidNumber: input.nidNumber,
			nidFrontUrl: input.nidFrontUrl,
			nidBackUrl: input.nidBackUrl,
			tradeLicenseUrl: input.tradeLicenseUrl ?? null,
			shopLogoUrl: input.shopLogoUrl ?? null,
			bankName: input.bankName ?? null,
			bankAccountNumber: input.bankAccountNumber ?? null,
			bankAccountName: input.bankAccountName ?? null,
			bkashNumber: input.bkashNumber ?? null,
			nagadNumber: input.nagadNumber ?? null,
			reviewNotes: null,
			reviewedAt: null,
			reviewedBy: null
		}).where(eq(vendorApplications.id, existing.id)).returning();
		if (!updated) return c.json({ error: "Failed to update application" }, 500);
		const response$1 = {
			success: true,
			application: mapToDTO(updated)
		};
		return c.json(response$1, 201);
	}
	const slug = await generateUniqueSlug(input.shopNameEn);
	const [created] = await db.insert(vendorApplications).values({
		userId,
		status: "pending",
		shopNameEn: input.shopNameEn,
		shopNameBn: input.shopNameBn ?? null,
		ownerName: input.ownerName,
		phone: input.phone,
		email: input.email,
		businessType: input.businessType,
		addressLine1: input.addressLine1,
		addressLine2: input.addressLine2 ?? null,
		district: input.district,
		city: input.city,
		postalCode: input.postalCode ?? null,
		nidNumber: input.nidNumber,
		nidFrontUrl: input.nidFrontUrl,
		nidBackUrl: input.nidBackUrl,
		tradeLicenseUrl: input.tradeLicenseUrl ?? null,
		shopLogoUrl: input.shopLogoUrl ?? null,
		bankName: input.bankName ?? null,
		bankAccountNumber: input.bankAccountNumber ?? null,
		bankAccountName: input.bankAccountName ?? null,
		bkashNumber: input.bkashNumber ?? null,
		nagadNumber: input.nagadNumber ?? null,
		slug
	}).returning();
	if (!created) return c.json({ error: "Failed to create application" }, 500);
	const response = {
		success: true,
		application: mapToDTO(created)
	};
	return c.json(response, 201);
});

//#endregion
//#region src/lib/file-upload.ts
/**
* Allowed file types for uploads
* - Any image/* MIME type (supports phone formats like HEIC/HEIF)
* - PDF documents
*/
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];
/**
* File size limits based on user requirements
* - Images: 10MB (for NID images, logos)
* - PDFs: 20MB (for trade licenses, other documents)
*/
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
/**
* Upload a file to S3 with validation and security measures
*
* Security features:
* - UUID-based filenames prevent enumeration attacks
* - File type validation (only images and PDFs allowed)
* - File size limits enforced (10MB for images, 20MB for PDFs)
* - Files organized by userId to prevent cross-user access
* - Presigned URLs expire in 7 days
*
* @param file - The file to upload
* @param options - Upload options (userId, category)
* @returns Promise resolving to upload result with URL and filename
* @throws Error if validation fails or upload fails
*/
async function uploadFile(file, options) {
	const isImage = file.type.startsWith("image/");
	const isPdf = ALLOWED_DOCUMENT_TYPES.includes(file.type);
	if (!isImage && !isPdf) throw new Error(`Invalid file type: ${file.type}. Allowed types: image/* or application/pdf`);
	const maxSize = isPdf ? MAX_DOCUMENT_SIZE : MAX_IMAGE_SIZE;
	if (file.size > maxSize) {
		const maxSizeMB = maxSize / (1024 * 1024);
		throw new Error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum allowed: ${maxSizeMB}MB`);
	}
	const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
	const uuid$1 = randomUUID();
	let s3Key;
	switch (options.category) {
		case "product-images":
			if (!options.productId) throw new Error("productId is required for product-images category");
			const variant = options.variant || "original";
			s3Key = `products/${options.productId}/images/${variant}/${uuid$1}.${ext}`;
			break;
		case "vendor-logos":
			s3Key = `vendors/${options.vendorId || options.userId}/logo/${uuid$1}.${ext}`;
			break;
		case "vendor-documents":
			s3Key = `vendors/${options.vendorId || options.userId}/documents/${uuid$1}.${ext}`;
			break;
		case "banners":
			s3Key = `banners/${uuid$1}.${ext}`;
			break;
		case "profile-images":
			s3Key = `users/${options.userId}/profile/${uuid$1}.${ext}`;
			break;
		default: s3Key = `uploads/${options.userId}/${uuid$1}.${ext}`;
	}
	try {
		const isPrivateDocument = options.category === "vendor-documents";
		const upload = await uploadToCloudinary(file, {
			publicId: s3Key.replace(/\.[^.]+$/, ""),
			privateAsset: isPrivateDocument
		});
		return {
			s3Key: isPrivateDocument ? cloudinaryPrivateReference(upload) : cloudinaryPublicReference(upload.resourceType, upload.publicId),
			url: upload.secureUrl,
			filename: `${uuid$1}.${ext}`,
			variant: options.variant
		};
	} catch (error$1) {
		console.error("Cloudinary upload error:", error$1);
		throw new Error(`Upload failed: ${error$1 instanceof Error ? error$1.message : "Unknown error"}`);
	}
}
/**
* Delete a single file from S3
*
* @param s3Key - The S3 key of the file to delete
* @returns Promise resolving when file is deleted
*/
async function deleteFile(s3Key) {
	try {
		await deleteCloudinaryReference(s3Key);
	} catch (error$1) {
		console.error(`Failed to delete file ${s3Key}:`, error$1);
		throw new Error("Failed to delete file");
	}
}

//#endregion
//#region src/routes/upload.ts
/**
* Upload Router
*
* Handles file uploads to Cloudinary with security and validation:
* - UUID-based filenames (prevents enumeration)
* - File type validation (images and PDFs only)
* - File size limits (10MB images, 20MB PDFs)
* - Authentication required
* - Presigned URLs (7-day expiry)
*/
const uploadRouter = new Hono().post("/", describeRoute({
	tags: ["Upload"],
	summary: "Upload a file to Cloudinary",
	description: "Upload a file (image or PDF) to Cloudinary for vendor applications. Supports images (JPEG, PNG, WebP) up to 10MB and PDFs up to 20MB. Files are stored with UUID-based filenames for security. Vendor documents are delivered only through a signed URL.",
	responses: {
		200: {
			description: "File uploaded successfully",
			content: { "application/json": { schema: resolver(z.object({
				url: z.string(),
				filename: z.string()
			})) } }
		},
		401: {
			description: "Unauthorized - user not logged in",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		400: {
			description: "Bad request - no file provided or invalid file",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		500: {
			description: "Server error - upload failed",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const file = (await c.req.parseBody())["file"];
	if (!file || typeof file === "string") return c.json({ error: "No file provided" }, 400);
	const validCategories = [
		"vendor-documents",
		"vendor-logos",
		"product-images",
		"banners",
		"profile-images"
	];
	const categoryParam = c.req.query("category") || "vendor-documents";
	const category = validCategories.includes(categoryParam) ? categoryParam : "vendor-documents";
	const productId = c.req.query("productId");
	const vendorId = c.req.query("vendorId");
	const variant = c.req.query("variant");
	const effectiveProductId = productId || `temp-${userId}`;
	try {
		const result = await uploadFile(file, {
			userId,
			category,
			productId: effectiveProductId,
			vendorId,
			variant
		});
		const response = {
			s3Key: result.s3Key,
			url: result.url,
			filename: result.filename,
			variant: result.variant
		};
		return c.json(response, 200);
	} catch (error$1) {
		console.error("Upload error:", error$1);
		const errorMessage = error$1 instanceof Error ? error$1.message : "Upload failed";
		return c.json({ error: errorMessage }, 500);
	}
});

//#endregion
//#region ../../packages/api-types/src/checkout.ts
const bdPhoneRegex = /^01[3-9]\d{8}$/;
const shippingAddressSchema = z.object({
	fullName: z.string().min(2).max(200),
	phone: z.string().regex(bdPhoneRegex, "Invalid BD phone number (e.g., 01712345678)"),
	alternatePhone: z.string().regex(bdPhoneRegex, "Invalid BD phone number").optional().or(z.literal("")),
	addressLine1: z.string().min(5).max(500),
	addressLine2: z.string().max(500).optional(),
	city: z.string().min(2).max(100),
	district: z.enum(BD_DISTRICTS, { message: "Please select a district" }),
	postalCode: z.string().max(10).optional(),
	deliveryInstructions: z.string().max(500).optional(),
	isDefault: z.boolean().optional()
});
const shippingAddressParamSchema = z.object({ addressId: z.string().uuid() });
const shippingCostQuerySchema = z.object({ district: z.string().min(1) });
const SHIPPING_ZONES = {
	dhaka_metro: {
		districts: ["Dhaka"],
		costPaisa: 6e3,
		estimatedDays: "1-2",
		labelEn: "Dhaka Metro",
		labelBn: "ঢাকা মেট্রো"
	},
	dhaka_suburbs: {
		districts: [
			"Gazipur",
			"Narayanganj",
			"Manikganj"
		],
		costPaisa: 8e3,
		estimatedDays: "2-3",
		labelEn: "Dhaka Suburbs",
		labelBn: "ঢাকা শহরতলী"
	},
	major_cities: {
		districts: [
			"Chattogram",
			"Sylhet",
			"Rajshahi",
			"Khulna",
			"Rangpur",
			"Barishal"
		],
		costPaisa: 1e4,
		estimatedDays: "3-5",
		labelEn: "Major Cities",
		labelBn: "প্রধান শহর"
	},
	other: {
		districts: [],
		costPaisa: 13e3,
		estimatedDays: "5-7",
		labelEn: "Other Districts",
		labelBn: "অন্যান্য জেলা"
	}
};
const placeOrderBaseSchema = z.object({
	shippingAddressId: z.string().uuid(),
	customerNotes: z.string().max(500).optional(),
	acceptedTerms: z.literal(true, { message: "You must accept the terms and conditions" })
});
const buyNowOrderItemSchema = z.object({
	productId: z.string().uuid(),
	skuId: z.string().uuid().optional(),
	quantity: z.number().int().min(1)
});
const placeOrderSchema = z.union([placeOrderBaseSchema.extend({ mode: z.literal("cart").optional() }), placeOrderBaseSchema.extend({
	mode: z.literal("buy_now"),
	item: buyNowOrderItemSchema
})]);
const orderListQuerySchema = z.object({
	status: z.enum([
		"all",
		"pending",
		"confirmed",
		"processing",
		"shipped",
		"delivered",
		"paid_to_admin",
		"completed",
		"returned",
		"cancelled"
	]).optional().default("all"),
	dateRange: z.enum([
		"30d",
		"6mo",
		"all"
	]).optional().default("all"),
	page: z.coerce.number().min(1).optional().default(1),
	limit: z.coerce.number().min(1).max(50).optional().default(10)
});
const orderIdParamSchema = z.object({ orderId: z.string().uuid() });
const cancelOrderSchema = z.object({ reason: z.string().max(500).optional() });

//#endregion
//#region src/routes/shipping-addresses.ts
function calculateShippingCost$1(district) {
	for (const [zone, config] of Object.entries(SHIPPING_ZONES)) if (config.districts.includes(district)) return {
		zone,
		costPaisa: config.costPaisa,
		estimatedDays: config.estimatedDays,
		labelEn: config.labelEn,
		labelBn: config.labelBn
	};
	return {
		zone: "other",
		costPaisa: SHIPPING_ZONES.other.costPaisa,
		estimatedDays: SHIPPING_ZONES.other.estimatedDays,
		labelEn: SHIPPING_ZONES.other.labelEn,
		labelBn: SHIPPING_ZONES.other.labelBn
	};
}
const shippingAddressesRouter = new Hono().get("/", describeRoute({
	tags: ["Shipping Addresses"],
	summary: "List user's saved addresses",
	description: "Get all shipping addresses for the authenticated user, ordered by default status and creation date",
	responses: {
		200: {
			description: "List of shipping addresses",
			content: { "application/json": { schema: resolver(z.array(z.any())) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const addressDTOs = (await db.select().from(shippingAddresses).where(eq(shippingAddresses.userId, userId)).orderBy(desc(shippingAddresses.isDefault), desc(shippingAddresses.createdAt))).map((addr) => ({
		id: addr.id,
		fullName: addr.fullName,
		phone: addr.phone,
		alternatePhone: addr.alternatePhone,
		addressLine1: addr.addressLine1,
		addressLine2: addr.addressLine2,
		city: addr.city,
		district: addr.district,
		postalCode: addr.postalCode,
		deliveryInstructions: addr.deliveryInstructions,
		isDefault: addr.isDefault,
		createdAt: addr.createdAt.toISOString()
	}));
	return c.json({ addresses: addressDTOs }, 200);
}).post("/", describeRoute({
	tags: ["Shipping Addresses"],
	summary: "Create new shipping address",
	description: "Create a new shipping address for the authenticated user. If isDefault is true, un-defaults all other addresses first.",
	responses: {
		201: {
			description: "Address created successfully",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", shippingAddressSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const data = c.req.valid("json");
	if (data.isDefault) await db.update(shippingAddresses).set({ isDefault: false }).where(eq(shippingAddresses.userId, userId));
	const [address] = await db.insert(shippingAddresses).values({
		userId,
		fullName: data.fullName,
		phone: data.phone,
		alternatePhone: data.alternatePhone || null,
		addressLine1: data.addressLine1,
		addressLine2: data.addressLine2 || null,
		city: data.city,
		district: data.district,
		postalCode: data.postalCode || null,
		deliveryInstructions: data.deliveryInstructions || null,
		isDefault: data.isDefault ?? false
	}).returning();
	if (!address) return c.json({ error: "Failed to create address" }, 500);
	const addressDTO = {
		id: address.id,
		fullName: address.fullName,
		phone: address.phone,
		alternatePhone: address.alternatePhone,
		addressLine1: address.addressLine1,
		addressLine2: address.addressLine2,
		city: address.city,
		district: address.district,
		postalCode: address.postalCode,
		deliveryInstructions: address.deliveryInstructions,
		isDefault: address.isDefault,
		createdAt: address.createdAt.toISOString()
	};
	return c.json({ address: addressDTO }, 201);
}).patch("/:addressId", describeRoute({
	tags: ["Shipping Addresses"],
	summary: "Update shipping address",
	description: "Update an existing shipping address. Verifies ownership.",
	responses: {
		200: {
			description: "Address updated successfully",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Address not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", shippingAddressParamSchema), zValidator("json", shippingAddressSchema.partial()), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { addressId } = c.req.valid("param");
	const data = c.req.valid("json");
	const [existing] = await db.select().from(shippingAddresses).where(and(eq(shippingAddresses.id, addressId), eq(shippingAddresses.userId, userId))).limit(1);
	if (!existing) return c.json({ error: "Address not found" }, 404);
	if (data.isDefault) await db.update(shippingAddresses).set({ isDefault: false }).where(eq(shippingAddresses.userId, userId));
	const [updated] = await db.update(shippingAddresses).set({
		fullName: data.fullName ?? existing.fullName,
		phone: data.phone ?? existing.phone,
		alternatePhone: data.alternatePhone ?? existing.alternatePhone,
		addressLine1: data.addressLine1 ?? existing.addressLine1,
		addressLine2: data.addressLine2 ?? existing.addressLine2,
		city: data.city ?? existing.city,
		district: data.district ?? existing.district,
		postalCode: data.postalCode ?? existing.postalCode,
		deliveryInstructions: data.deliveryInstructions ?? existing.deliveryInstructions,
		isDefault: data.isDefault ?? existing.isDefault
	}).where(eq(shippingAddresses.id, addressId)).returning();
	if (!updated) return c.json({ error: "Failed to update address" }, 500);
	const addressDTO = {
		id: updated.id,
		fullName: updated.fullName,
		phone: updated.phone,
		alternatePhone: updated.alternatePhone,
		addressLine1: updated.addressLine1,
		addressLine2: updated.addressLine2,
		city: updated.city,
		district: updated.district,
		postalCode: updated.postalCode,
		deliveryInstructions: updated.deliveryInstructions,
		isDefault: updated.isDefault,
		createdAt: updated.createdAt.toISOString()
	};
	return c.json({ address: addressDTO }, 200);
}).delete("/:addressId", describeRoute({
	tags: ["Shipping Addresses"],
	summary: "Delete shipping address",
	description: "Delete a shipping address. Verifies ownership.",
	responses: {
		200: {
			description: "Address deleted successfully",
			content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Address not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", shippingAddressParamSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { addressId } = c.req.valid("param");
	const [existing] = await db.select().from(shippingAddresses).where(and(eq(shippingAddresses.id, addressId), eq(shippingAddresses.userId, userId))).limit(1);
	if (!existing) return c.json({ error: "Address not found" }, 404);
	await db.delete(shippingAddresses).where(eq(shippingAddresses.id, addressId));
	return c.json({ success: true }, 200);
}).get("/shipping-cost", describeRoute({
	tags: ["Shipping Addresses"],
	summary: "Calculate shipping cost",
	description: "Calculate shipping cost and estimated delivery time based on district. Returns zone info.",
	responses: {
		200: {
			description: "Shipping cost calculated",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		400: {
			description: "Invalid district",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("query", shippingCostQuerySchema), async (c) => {
	const { district } = c.req.valid("query");
	const shippingInfo = calculateShippingCost$1(district);
	return c.json(shippingInfo, 200);
});

//#endregion
//#region src/lib/order-email.ts
async function sendOrderConfirmationEmail(userEmail, userName, _groupId, orders$1, grandTotal) {
	const orderNumbers = orders$1.map((o) => o.orderNumber).join(", ");
	const formatPrice$1 = (paisa) => {
		return `৳${(paisa / 100).toLocaleString("en-BD", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})}`;
	};
	const itemsHTML = orders$1.map((order) => `
    <div style="margin: 20px 0; padding: 15px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin: 0 0 10px 0; color: #4F46E5; font-size: 16px;">
        Order ${order.orderNumber} - ${order.vendorName}
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${order.items.map((item) => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 0; color: #374151;">
              ${item.productSnapshot.title}
              ${item.productSnapshot.ageRange ? `<span style="font-size: 12px; color: #6b7280;">(${item.productSnapshot.ageRange})</span>` : ""}
            </td>
            <td style="padding: 8px 0; text-align: center; color: #6b7280;">×${item.quantity}</td>
            <td style="padding: 8px 0; text-align: right; color: #111827; font-weight: 500;">${formatPrice$1(item.lineTotal)}</td>
          </tr>
        `).join("")}
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #6b7280;">Subtotal</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatPrice$1(order.subtotal)}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 8px 0; color: #6b7280;">Shipping</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 500;">${formatPrice$1(order.shippingCost)}</td>
        </tr>
        <tr style="border-top: 2px solid #4F46E5;">
          <td colspan="2" style="padding: 8px 0; font-weight: 600; color: #111827;">Total</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #4F46E5; font-size: 16px;">${formatPrice$1(order.total)}</td>
        </tr>
      </table>
    </div>
  `).join("");
	const shippingAddr = orders$1[0].shippingAddress;
	const addressHTML = `
    <p style="margin: 5px 0; line-height: 1.6; color: #374151;">
      <strong>${shippingAddr.fullName}</strong><br/>
      ${shippingAddr.phone}${shippingAddr.alternatePhone ? ` / ${shippingAddr.alternatePhone}` : ""}<br/>
      ${shippingAddr.addressLine1}<br/>
      ${shippingAddr.addressLine2 ? `${shippingAddr.addressLine2}<br/>` : ""}
      ${shippingAddr.city}, ${shippingAddr.district}${shippingAddr.postalCode ? ` ${shippingAddr.postalCode}` : ""}<br/>
      ${shippingAddr.deliveryInstructions ? `<em style="color: #6b7280;">Note: ${shippingAddr.deliveryInstructions}</em>` : ""}
    </p>
  `;
	const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Confirmed! 🎉
      </h1>
      <p style="margin: 10px 0 0 0; color: #E0E7FF; font-size: 14px;">
        Thank you for your order, ${userName}
      </p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px;">

      <!-- Order Numbers -->
      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4F46E5; font-weight: 600;">
          Order Number${orders$1.length > 1 ? "s" : ""}: ${orderNumbers}
        </p>
      </div>

      <!-- Order Items -->
      <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Order Summary
      </h2>
      ${itemsHTML}

      <!-- Grand Total (if multiple orders) -->
      ${orders$1.length > 1 ? `
      <div style="margin: 20px 0; padding: 15px; background: #F3F4F6; border-radius: 8px; text-align: right;">
        <span style="font-size: 18px; font-weight: 700; color: #111827;">Grand Total: </span>
        <span style="font-size: 20px; font-weight: 700; color: #4F46E5;">${formatPrice$1(grandTotal)}</span>
      </div>
      ` : ""}

      <!-- Shipping Address -->
      <h2 style="margin: 30px 0 15px 0; color: #111827; font-size: 18px; font-weight: 600;">
        Delivery Address
      </h2>
      ${addressHTML}

      <!-- Payment Info -->
      <div style="margin: 25px 0; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong style="display: block; margin-bottom: 5px;">💰 Payment Method: Cash on Delivery (COD)</strong>
          Please keep the exact amount (${formatPrice$1(grandTotal)}) ready when receiving your order.
        </p>
      </div>

      <!-- Baby Safety Reminder -->
      <div style="margin: 25px 0; padding: 15px; background: #FEF2F2; border-left: 4px solid #DC2626; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991B1B;">
          <strong style="display: block; margin-bottom: 5px;">👶 Safety Reminder</strong>
          Please verify all products match your child's age before accepting delivery.
        </p>
      </div>

      <!-- Footer CTA -->
      <div style="margin: 30px 0; text-align: center;">
        <a href="https://kinedao.com" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Continue Shopping
        </a>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 12px;">
        Questions? Contact us at <a href="mailto:support@kinedao.com" style="color: #4F46E5;">support@kinedao.com</a>
      </p>
      <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
        © ${(/* @__PURE__ */ new Date()).getFullYear()} KineDao. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
  `;
	await sendEmail({
		to: userEmail,
		subject: `Order Confirmed - ${orderNumbers} | KineDao`,
		html
	});
}

//#endregion
//#region src/lib/notification-emails.ts
const formatPrice = (paisa) => {
	return `৳${(paisa / 100).toLocaleString("en-BD", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
};
const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    ${content}
    <!-- Footer -->
    <div style="background: #F9FAFB; padding: 20px; text-align: center; border-top: 1px solid #E5E7EB;">
      <p style="margin: 0 0 5px 0; color: #6B7280; font-size: 12px;">
        Questions? Contact us at <a href="mailto:support@kinedao.com" style="color: #4F46E5;">support@kinedao.com</a>
      </p>
      <p style="margin: 0; color: #9CA3AF; font-size: 11px;">
        © ${(/* @__PURE__ */ new Date()).getFullYear()} KineDao. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
async function sendOrderConfirmedEmail(email, name, orderNumber) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Confirmed! ✅
      </h1>
      <p style="margin: 10px 0 0 0; color: #E0E7FF; font-size: 14px;">
        Your order is being prepared, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #4F46E5; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Good news! The vendor has confirmed your order and is preparing it for shipment.
      </p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        You'll receive another notification once your order is shipped with tracking details.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}/account/orders" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Order Details
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `Order Confirmed - ${orderNumber} | KineDao`,
		html: emailWrapper(content)
	});
}
async function sendOrderShippedEmail(email, name, orderNumber, trackingNumber, carrier) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Shipped! 📦
      </h1>
      <p style="margin: 10px 0 0 0; color: #D1FAE5; font-size: 14px;">
        Your order is on the way, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #ECFDF5; border-left: 4px solid #10B981; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #047857; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
        ${trackingNumber ? `
        <p style="margin: 0; font-size: 13px; color: #065F46;">
          Tracking: ${trackingNumber}${carrier ? ` (${carrier})` : ""}
        </p>
        ` : ""}
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your order has been shipped and is on its way to you!
      </p>
      <div style="margin: 25px 0; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong style="display: block; margin-bottom: 5px;">💰 Cash on Delivery</strong>
          Please keep the cash ready when receiving your order.
        </p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}/account/orders" style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Track Your Order
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `Order Shipped - ${orderNumber} | KineDao`,
		html: emailWrapper(content)
	});
}
async function sendOrderDeliveredEmail(email, name, orderNumber) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Delivered! 🎉
      </h1>
      <p style="margin: 10px 0 0 0; color: #EDE9FE; font-size: 14px;">
        Thank you for shopping with us, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #F5F3FF; border-left: 4px solid #8B5CF6; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #6D28D9; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your order has been successfully delivered! We hope you and your little one love it.
      </p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        If you have any issues with your order, please contact us immediately.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Continue Shopping
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `Order Delivered - ${orderNumber} | KineDao`,
		html: emailWrapper(content)
	});
}
async function sendOrderCancelledEmail(email, name, orderNumber, reason) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Order Cancelled
      </h1>
      <p style="margin: 10px 0 0 0; color: #FEE2E2; font-size: 14px;">
        We're sorry, ${name}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #991B1B; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your order has been cancelled.
      </p>
      ${reason ? `
      <p style="margin: 0 0 15px 0; color: #6B7280; line-height: 1.6;">
        <strong>Reason:</strong> ${reason}
      </p>
      ` : ""}
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        If you have any questions, please contact our support team.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}" style="display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Continue Shopping
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `Order Cancelled - ${orderNumber} | KineDao`,
		html: emailWrapper(content)
	});
}
async function sendNewOrderVendorEmail(email, vendorName, orderNumber, total, itemCount) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        New Order! 🔔
      </h1>
      <p style="margin: 10px 0 0 0; color: #FEF3C7; font-size: 14px;">
        ${vendorName}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #92400E; font-weight: 600;">
          Order Number: ${orderNumber}
        </p>
        <p style="margin: 0; font-size: 13px; color: #78350F;">
          ${itemCount} item${itemCount > 1 ? "s" : ""} • Total: ${formatPrice(total)}
        </p>
      </div>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        You have received a new COD order. Please log in to your vendor dashboard to confirm and process it.
      </p>
      <div style="margin: 25px 0; padding: 15px; background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #92400E;">
          <strong style="display: block; margin-bottom: 5px;">⏰ Action Required</strong>
          Please confirm this order within 24 hours.
        </p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}/vendor/orders" style="display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Order
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `New Order ${orderNumber} - ${formatPrice(total)} | KineDao Vendor`,
		html: emailWrapper(content)
	});
}
async function sendProductApprovedEmail(email, vendorName, productTitle) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Product Approved! ✅
      </h1>
      <p style="margin: 10px 0 0 0; color: #D1FAE5; font-size: 14px;">
        ${vendorName}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Great news! Your product <strong>"${productTitle}"</strong> has been approved and is now live on KineDao.
      </p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        Customers can now browse and purchase this product from your store.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}/vendor/products" style="display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          View Product
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `Product Approved - ${productTitle} | KineDao Vendor`,
		html: emailWrapper(content)
	});
}
async function sendProductRejectedEmail(email, vendorName, productTitle, reviewNotes) {
	const content = `
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Product Needs Changes
      </h1>
      <p style="margin: 10px 0 0 0; color: #FEE2E2; font-size: 14px;">
        ${vendorName}
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Your product <strong>"${productTitle}"</strong> requires some changes before it can be published.
      </p>
      <div style="background: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #991B1B; font-weight: 600;">
          Review Notes:
        </p>
        <p style="margin: 0; font-size: 13px; color: #7F1D1D; line-height: 1.6;">
          ${reviewNotes}
        </p>
      </div>
      <p style="margin: 0; color: #374151; line-height: 1.6;">
        Please make the necessary changes and resubmit your product for review.
      </p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}/vendor/products" style="display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Edit Product
        </a>
      </div>
    </div>
  `;
	await sendEmail({
		to: email,
		subject: `Product Needs Changes - ${productTitle} | KineDao Vendor`,
		html: emailWrapper(content)
	});
}
async function sendVendorApprovedEmail(email, vendorName, shopName) {
	await sendEmail({
		to: email,
		subject: `Welcome to KineDao - Vendor Approved | KineDao`,
		html: emailWrapper(`
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 30px 20px; text-align: center;">
      <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">
        Welcome to KineDao! 🎉
      </h1>
      <p style="margin: 10px 0 0 0; color: #EDE9FE; font-size: 14px;">
        Your vendor application has been approved
      </p>
    </div>
    <!-- Content -->
    <div style="padding: 30px 20px;">
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        Congratulations, ${vendorName}! Your vendor application for <strong>${shopName}</strong> has been approved.
      </p>
      <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
        You can now access your vendor dashboard and start listing your baby products on KineDao.
      </p>
      <div style="margin: 25px 0; padding: 15px; background: #F5F3FF; border-left: 4px solid #8B5CF6; border-radius: 4px;">
        <p style="margin: 0; font-size: 14px; color: #5B21B6;">
          <strong style="display: block; margin-bottom: 5px;">📋 Next Steps</strong>
          Log in to your vendor dashboard to add products, manage orders, and track your earnings.
        </p>
      </div>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${env.WEB_ORIGIN}/vendor/dashboard" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
          Go to Dashboard
        </a>
      </div>
    </div>
  `)
	});
}

//#endregion
//#region src/lib/web-push.ts
const vapidConfigured = env.VAPID_SUBJECT && env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY;
if (vapidConfigured) webPush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
/**
* Send push notification to a specific user
*/
async function sendPushNotification(userId, payload) {
	if (!vapidConfigured) {
		console.warn("[PUSH] VAPID keys not configured — skipping push notification");
		return;
	}
	try {
		const subscriptions = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
		if (subscriptions.length === 0) {
			console.log(`No push subscriptions found for user ${userId}`);
			return;
		}
		const results = await Promise.allSettled(subscriptions.map(async (sub) => {
			try {
				const pushSubscription = {
					endpoint: sub.endpoint,
					keys: {
						p256dh: sub.p256dh,
						auth: sub.auth
					}
				};
				const notificationPayload = JSON.stringify({
					title: payload.title,
					body: payload.body,
					icon: payload.icon || "/favicon.ico",
					badge: payload.badge || "/favicon.ico",
					data: payload.data || {}
				});
				await webPush.sendNotification(pushSubscription, notificationPayload);
				console.log(`Push sent to subscription ${sub.id}`);
			} catch (error$1) {
				if (error$1 && typeof error$1 === "object" && "statusCode" in error$1 && (error$1.statusCode === 410 || error$1.statusCode === 404)) {
					console.log(`Removing invalid/expired subscription ${sub.id} (status: ${error$1.statusCode})`);
					await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
				} else console.error(`Failed to send push to subscription ${sub.id}:`, error$1);
				throw error$1;
			}
		}));
		const successful = results.filter((r) => r.status === "fulfilled").length;
		const failed = results.filter((r) => r.status === "rejected").length;
		console.log(`Push notification sent: ${successful} successful, ${failed} failed`);
	} catch (error$1) {
		console.error("Error sending push notification:", error$1);
	}
}
/**
* Get VAPID public key for client-side subscription
*/
function getVapidPublicKey() {
	if (!env.VAPID_PUBLIC_KEY) throw new Error("VAPID_PUBLIC_KEY is not configured");
	return env.VAPID_PUBLIC_KEY;
}

//#endregion
//#region src/lib/notification-service.ts
const sseConnections = /* @__PURE__ */ new Map();
function addSSEConnection(userId, stream) {
	if (!sseConnections.has(userId)) sseConnections.set(userId, /* @__PURE__ */ new Set());
	sseConnections.get(userId).add(stream);
}
function removeSSEConnection(userId, stream) {
	const userStreams = sseConnections.get(userId);
	if (userStreams) {
		userStreams.delete(stream);
		if (userStreams.size === 0) sseConnections.delete(userId);
	}
}
function broadcastSSE(userId, data) {
	const userStreams = sseConnections.get(userId);
	if (userStreams) for (const stream of userStreams) try {
		stream.writeSSE({
			data: JSON.stringify(data),
			event: "notification",
			id: data.id
		});
	} catch (error$1) {
		console.error("SSE write error:", error$1);
	}
}
function getNotificationUrl(type, data) {
	switch (type) {
		case "order_placed":
		case "order_confirmed":
		case "order_processing":
		case "order_shipped":
		case "order_delivered":
		case "order_cancelled": return data?.orderId ? `/account/orders/${data.orderId}` : "/account/orders";
		case "new_order":
		case "cod_verified": return data?.orderId ? `/vendor/orders?orderId=${data.orderId}` : "/vendor/orders";
		case "product_approved":
		case "product_rejected": return "/vendor/products";
		case "vendor_approved": return "/vendor/dashboard";
		case "low_stock": return "/vendor/products";
		case "new_review":
		case "review_moderated": return data?.reviewId ? `/vendor/reviews?reviewId=${data.reviewId}` : "/vendor/reviews";
		case "failed_delivery":
		case "high_rejection_rate": return "/admin/dashboard";
		default: return "/";
	}
}
const EMAIL_NOTIFICATION_MAP = {
	order_placed: true,
	order_confirmed: true,
	order_processing: false,
	order_shipped: true,
	order_delivered: true,
	order_cancelled: true,
	cod_verification: false,
	new_order: true,
	cod_verified: false,
	product_approved: true,
	product_rejected: true,
	vendor_approved: true,
	low_stock: true,
	new_review: false,
	review_moderated: false,
	failed_delivery: true,
	high_rejection_rate: true
};
async function notify(params) {
	const { userId, type, title, titleBn, body, bodyBn, data, channel, emailData } = params;
	try {
		const [notification] = await db.insert(notifications).values({
			userId,
			type,
			title,
			titleBn: titleBn ?? null,
			body,
			bodyBn: bodyBn ?? null,
			data: data ?? null,
			channel
		}).returning();
		if (!notification) throw new Error("Failed to create notification");
		const unreadCount = await db.$count(notifications, eq(notifications.userId, userId));
		broadcastSSE(userId, {
			type,
			id: notification.id,
			title,
			body,
			unreadCount
		});
		const prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
		const emailEnabled = prefs[0]?.emailEnabled ?? true;
		const pushEnabled = prefs[0]?.pushEnabled ?? true;
		if (EMAIL_NOTIFICATION_MAP[type] && emailData && emailEnabled) sendNotificationEmail(type, emailData).catch((error$1) => {
			console.error(`Email send failed for ${type}:`, error$1);
		});
		if (pushEnabled) sendPushNotification(userId, {
			title,
			body,
			icon: "/favicon.ico",
			data: {
				url: getNotificationUrl(type, data),
				type,
				...data
			}
		}).catch((error$1) => {
			console.error(`Push notification failed for ${type}:`, error$1);
		});
	} catch (error$1) {
		console.error("Notification service error:", error$1);
	}
}
async function sendNotificationEmail(type, data) {
	const email = data.userEmail;
	const name = data.userName;
	switch (type) {
		case "order_confirmed":
			await sendOrderConfirmedEmail(email, name, data.orderNumber);
			break;
		case "order_shipped":
			await sendOrderShippedEmail(email, name, data.orderNumber, data.trackingNumber, data.trackingCarrier);
			break;
		case "order_delivered":
			await sendOrderDeliveredEmail(email, name, data.orderNumber);
			break;
		case "order_cancelled":
			await sendOrderCancelledEmail(email, name, data.orderNumber, data.reason);
			break;
		case "new_order":
			await sendNewOrderVendorEmail(email, name, data.orderNumber, data.total, data.itemCount);
			break;
		case "product_approved":
			await sendProductApprovedEmail(email, name, data.productTitle);
			break;
		case "product_rejected":
			await sendProductRejectedEmail(email, name, data.productTitle, data.reviewNotes);
			break;
		case "vendor_approved":
			await sendVendorApprovedEmail(email, name, data.shopName);
			break;
		default: break;
	}
}
async function notifyVendor(vendorId, params) {
	try {
		const application = await db.select({ userId: vendorApplications.userId }).from(vendorApplications).where(eq(vendorApplications.vendorId, vendorId)).limit(1);
		if (!application[0]) {
			console.error(`Vendor application not found for vendorId: ${vendorId}`);
			return;
		}
		await notify({
			...params,
			userId: application[0].userId,
			channel: "vendor"
		});
	} catch (error$1) {
		console.error("notifyVendor error:", error$1);
	}
}
async function closeAllSSEConnections() {
	for (const userStreams of sseConnections.values()) for (const stream of userStreams) try {
		await stream.writeSSE({
			data: JSON.stringify({ type: "shutdown" }),
			event: "system"
		});
		await stream.close();
	} catch (e) {}
	sseConnections.clear();
}

//#endregion
//#region src/routes/orders.ts
function calculateShippingCost(district) {
	for (const [zone, config] of Object.entries(SHIPPING_ZONES)) if (config.districts.includes(district)) return {
		zone,
		costPaisa: config.costPaisa,
		estimatedDays: config.estimatedDays,
		labelEn: config.labelEn,
		labelBn: config.labelBn
	};
	return {
		zone: "other",
		costPaisa: SHIPPING_ZONES.other.costPaisa,
		estimatedDays: SHIPPING_ZONES.other.estimatedDays,
		labelEn: SHIPPING_ZONES.other.labelEn,
		labelBn: SHIPPING_ZONES.other.labelBn
	};
}
const ordersRouter = new Hono().post("/place", describeRoute({
	tags: ["Orders"],
	summary: "Place order",
	description: "Place order from cart or direct Buy Now item. Creates separate orders per vendor and uses stock locking to prevent race conditions.",
	responses: {
		201: {
			description: "Order(s) created successfully",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		400: {
			description: "Bad request (cart empty, stock insufficient, etc.)",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Address not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", placeOrderSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const payload = c.req.valid("json");
	const { shippingAddressId, customerNotes } = payload;
	const isBuyNowMode = payload.mode === "buy_now";
	const mode = isBuyNowMode ? "buy_now" : "cart";
	const [address] = await db.select().from(shippingAddresses).where(and(eq(shippingAddresses.id, shippingAddressId), eq(shippingAddresses.userId, userId))).limit(1);
	if (!address) return c.json({ error: "Shipping address not found" }, 404);
	let sourceItems = [];
	let cartIdToClear = null;
	if (isBuyNowMode) {
		const buyNowItem = payload.item;
		const [product] = await db.select({
			id: products.id,
			status: products.status,
			isActive: products.isActive
		}).from(products).where(eq(products.id, buyNowItem.productId)).limit(1);
		if (!product) return c.json({ error: "Product not found" }, 404);
		if (product.status !== "approved" || !product.isActive) return c.json({ error: "Product unavailable" }, 400);
		sourceItems = [{
			itemId: `buy-now-${buyNowItem.productId}-${buyNowItem.skuId ?? "default"}`,
			productId: buyNowItem.productId,
			skuId: buyNowItem.skuId ?? null,
			quantity: buyNowItem.quantity,
			unitPrice: 0
		}];
	} else {
		const [cart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
		if (!cart) return c.json({ error: "Cart is empty" }, 400);
		const cartItemRows = await db.select({
			itemId: cartItems.id,
			productId: cartItems.productId,
			skuId: cartItems.skuId,
			quantity: cartItems.quantity,
			unitPrice: cartItems.unitPrice
		}).from(cartItems).where(eq(cartItems.cartId, cart.id));
		if (cartItemRows.length === 0) return c.json({ error: "Cart is empty" }, 400);
		cartIdToClear = cart.id;
		sourceItems = cartItemRows.map((item) => ({
			itemId: item.itemId,
			productId: item.productId,
			skuId: item.skuId ?? null,
			quantity: item.quantity,
			unitPrice: item.unitPrice
		}));
	}
	const result = await db.transaction(async (tx) => {
		const groupId = crypto.randomUUID();
		const productIds = Array.from(new Set(sourceItems.map((item) => item.productId)));
		const skuLockRows = await tx.execute(sql.raw(`SELECT ps.id, ps.product_id, ps.sku, ps.price_amount, ps.stock_qty, ps.is_available, ps.option_values
            FROM product_skus ps
            WHERE ps.product_id = ANY(ARRAY[${productIds.map((id) => `'${id}'`).join(", ")}]::uuid[])
            ORDER BY ps.product_id, ps.price_amount ASC
            FOR UPDATE`));
		const allSkuMap = /* @__PURE__ */ new Map();
		const stockMap = /* @__PURE__ */ new Map();
		for (const row of skuLockRows.rows) {
			allSkuMap.set(row.id, {
				skuId: row.id,
				skuCode: row.sku,
				stockQty: row.stock_qty,
				priceAmount: row.price_amount,
				optionValues: row.option_values
			});
			const pid = row.product_id;
			if (!stockMap.has(pid) && row.is_available && row.stock_qty > 0) stockMap.set(pid, {
				skuId: row.id,
				skuCode: row.sku,
				stockQty: row.stock_qty,
				priceAmount: row.price_amount,
				optionValues: row.option_values
			});
		}
		const resolvedSkuMap = /* @__PURE__ */ new Map();
		for (const item of sourceItems) {
			const specific = item.skuId ? allSkuMap.get(item.skuId) : null;
			const fallback = stockMap.get(item.productId);
			const resolved = specific ? specific.stockQty > 0 ? specific : mode === "buy_now" ? null : fallback : mode === "buy_now" && item.skuId ? null : fallback;
			if (!resolved || resolved.stockQty < item.quantity) {
				const [prod] = await tx.select({ title: products.title }).from(products).where(eq(products.id, item.productId)).limit(1);
				throw new Error(`Insufficient stock for product: ${prod?.title ?? item.productId}`);
			}
			resolvedSkuMap.set(item.itemId, resolved);
		}
		const productDetails = await tx.select({
			id: products.id,
			title: products.title,
			titleBn: products.titleBn,
			slug: products.slug,
			vendorId: products.vendorId,
			ageRange: products.ageRange,
			isBpaFree: products.isBpaFree,
			isOrganic: products.isOrganic,
			isHypoallergenic: products.isHypoallergenic
		}).from(products).where(inArray(products.id, productIds));
		const productDetailsMap = new Map(productDetails.map((p) => [p.id, p]));
		const imageRows = await tx.select({
			productId: productImages.productId,
			s3Key: productImages.s3Key
		}).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder));
		const imageMap = /* @__PURE__ */ new Map();
		for (const img of imageRows) if (!imageMap.has(img.productId)) imageMap.set(img.productId, getS3Url(img.s3Key));
		const vendorGroups = /* @__PURE__ */ new Map();
		for (const item of sourceItems) {
			const product = productDetailsMap.get(item.productId);
			if (!product) continue;
			const vendorId = product.vendorId;
			if (!vendorGroups.has(vendorId)) vendorGroups.set(vendorId, []);
			vendorGroups.get(vendorId).push(item);
		}
		const vendorIds = Array.from(vendorGroups.keys());
		const vendorRows = await tx.select({
			id: vendors.id,
			name: vendors.name
		}).from(vendors).where(inArray(vendors.id, vendorIds));
		const vendorMap = new Map(vendorRows.map((v) => [v.id, v.name]));
		const orderCount = vendorGroups.size;
		const seqResult = await tx.execute(sql`UPDATE order_number_sequence
            SET last_number = last_number + ${orderCount}
            WHERE id = 1
            RETURNING last_number`);
		if (!seqResult.rows[0]) throw new Error("Failed to generate order number");
		const lastNumber = seqResult.rows[0].last_number;
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		const shippingCostInfo = calculateShippingCost(address.district);
		const createdOrders = [];
		let orderIndex = 0;
		for (const [vendorId, items] of vendorGroups) {
			const orderNum = lastNumber - orderCount + 1 + orderIndex;
			const orderNumber = `KD-${year}-${String(orderNum).padStart(5, "0")}`;
			const subtotal = items.reduce((sum, item) => {
				const resolvedSku = resolvedSkuMap.get(item.itemId);
				return sum + (mode === "buy_now" ? resolvedSku.priceAmount : item.unitPrice) * item.quantity;
			}, 0);
			const total = subtotal + shippingCostInfo.costPaisa;
			const addressSnapshot = {
				fullName: address.fullName,
				phone: address.phone,
				alternatePhone: address.alternatePhone,
				addressLine1: address.addressLine1,
				addressLine2: address.addressLine2,
				city: address.city,
				district: address.district,
				postalCode: address.postalCode,
				deliveryInstructions: address.deliveryInstructions
			};
			const [order] = await tx.insert(orders).values({
				orderNumber,
				groupId,
				userId,
				vendorId,
				status: "pending",
				paymentMethod: "cod",
				subtotal,
				shippingCost: shippingCostInfo.costPaisa,
				codFee: 0,
				total,
				shippingAddress: addressSnapshot,
				customerNotes: customerNotes || null
			}).returning();
			if (!order) throw new Error("Failed to create order");
			const orderItemDTOs = [];
			for (const item of items) {
				const product = productDetailsMap.get(item.productId);
				const image = imageMap.get(item.productId) ?? null;
				const resolvedSku = resolvedSkuMap.get(item.itemId);
				const unitPrice = mode === "buy_now" ? resolvedSku.priceAmount : item.unitPrice;
				const lineTotal = unitPrice * item.quantity;
				const productSnapshot = {
					title: product.title,
					titleBn: product.titleBn,
					slug: product.slug,
					image,
					ageRange: product.ageRange,
					isBpaFree: product.isBpaFree,
					isOrganic: product.isOrganic,
					isHypoallergenic: product.isHypoallergenic,
					selectedOptions: resolvedSku.optionValues ?? null,
					skuCode: resolvedSku.skuCode ?? null
				};
				const [orderItem] = await tx.insert(orderItems).values({
					orderId: order.id,
					productId: item.productId,
					quantity: item.quantity,
					unitPrice,
					lineTotal,
					productSnapshot
				}).returning();
				if (!orderItem) throw new Error("Failed to create order item");
				orderItemDTOs.push({
					id: orderItem.id,
					productId: orderItem.productId,
					quantity: orderItem.quantity,
					unitPrice: orderItem.unitPrice,
					lineTotal: orderItem.lineTotal,
					productSnapshot
				});
				await tx.execute(sql`UPDATE product_skus
                SET stock_qty = stock_qty - ${item.quantity}
                WHERE id = ${resolvedSku.skuId} AND stock_qty >= ${item.quantity}`);
			}
			createdOrders.push({
				id: order.id,
				orderNumber: order.orderNumber,
				groupId: order.groupId,
				vendorId: order.vendorId,
				vendorName: vendorMap.get(vendorId) ?? "Unknown",
				status: order.status,
				paymentMethod: order.paymentMethod,
				subtotal: order.subtotal,
				shippingCost: order.shippingCost,
				codFee: order.codFee,
				total: order.total,
				shippingAddress: addressSnapshot,
				customerNotes: order.customerNotes,
				items: orderItemDTOs,
				createdAt: order.createdAt.toISOString()
			});
			orderIndex++;
		}
		if (mode === "cart" && cartIdToClear) await tx.delete(cartItems).where(eq(cartItems.cartId, cartIdToClear));
		return {
			groupId,
			orders: createdOrders
		};
	});
	const grandTotal = result.orders.reduce((sum, o) => sum + o.total, 0);
	sendOrderConfirmationEmail(c.var.user.email, c.var.user.name || "Customer", result.groupId, result.orders, grandTotal).catch((error$1) => {
		console.error("[ORDER] Failed to send confirmation email:", error$1);
	});
	notify({
		userId,
		type: "order_placed",
		title: "Order Placed Successfully",
		titleBn: "অর্ডার সফলভাবে সম্পন্ন হয়েছে",
		body: `Your order ${result.orders.map((o) => o.orderNumber).join(", ")} has been placed`,
		bodyBn: `আপনার অর্ডার ${result.orders.map((o) => o.orderNumber).join(", ")} সম্পন্ন হয়েছে`,
		data: {
			groupId: result.groupId,
			orderNumbers: result.orders.map((o) => o.orderNumber)
		},
		channel: "customer"
	}).catch((error$1) => {
		console.error("[ORDER] Failed to send customer notification:", error$1);
	});
	for (const order of result.orders) notifyVendor(order.vendorId, {
		type: "new_order",
		title: `New COD Order ${order.orderNumber}`,
		titleBn: `নতুন COD অর্ডার ${order.orderNumber}`,
		body: `You have received a new order worth ৳${(order.total / 100).toFixed(2)}`,
		bodyBn: `আপনি ${(order.total / 100).toFixed(2)} টাকার একটি নতুন অর্ডার পেয়েছেন`,
		data: {
			orderId: order.id,
			orderNumber: order.orderNumber,
			total: order.total,
			itemCount: order.items.length
		},
		emailData: {
			userEmail: c.var.user.email,
			userName: order.vendorName,
			orderNumber: order.orderNumber,
			total: order.total,
			itemCount: order.items.length
		}
	}).catch((error$1) => {
		console.error(`[ORDER] Failed to send vendor notification for ${order.vendorId}:`, error$1);
	});
	const response = {
		success: true,
		groupId: result.groupId,
		orders: result.orders,
		grandTotal
	};
	return c.json(response, 201);
}).get("/group/:groupId", describeRoute({
	tags: ["Orders"],
	summary: "Get order group",
	description: "Get all orders in a group (from same checkout). For order confirmation page.",
	responses: {
		200: {
			description: "Order group retrieved",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Order group not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ groupId: z.string().uuid() })), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { groupId } = c.req.valid("param");
	const orderRows = await db.select().from(orders).where(and(eq(orders.groupId, groupId), eq(orders.userId, userId))).orderBy(asc(orders.createdAt));
	if (orderRows.length === 0) return c.json({ error: "Order group not found" }, 404);
	const vendorIds = orderRows.map((o) => o.vendorId);
	const vendorRows = await db.select({
		id: vendors.id,
		name: vendors.name
	}).from(vendors).where(inArray(vendors.id, vendorIds));
	const vendorMap = new Map(vendorRows.map((v) => [v.id, v.name]));
	const orderIds = orderRows.map((o) => o.id);
	const itemRows = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
	const itemsByOrder = /* @__PURE__ */ new Map();
	for (const item of itemRows) {
		if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
		itemsByOrder.get(item.orderId).push(item);
	}
	const orderDTOs = orderRows.map((order) => {
		const itemDTOs = (itemsByOrder.get(order.id) ?? []).map((item) => ({
			id: item.id,
			productId: item.productId,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			lineTotal: item.lineTotal,
			productSnapshot: item.productSnapshot
		}));
		return {
			id: order.id,
			orderNumber: order.orderNumber,
			groupId: order.groupId,
			vendorId: order.vendorId,
			vendorName: vendorMap.get(order.vendorId) ?? "Unknown",
			status: order.status,
			paymentMethod: order.paymentMethod,
			subtotal: order.subtotal,
			shippingCost: order.shippingCost,
			codFee: order.codFee,
			total: order.total,
			shippingAddress: order.shippingAddress,
			customerNotes: order.customerNotes,
			items: itemDTOs,
			createdAt: order.createdAt.toISOString()
		};
	});
	const response = {
		groupId,
		orders: orderDTOs,
		grandTotal: orderDTOs.reduce((sum, o) => sum + o.total, 0),
		createdAt: orderRows[0]?.createdAt.toISOString() || (/* @__PURE__ */ new Date()).toISOString()
	};
	return c.json(response, 200);
}).get("/", describeRoute({
	tags: ["Orders"],
	summary: "List user's orders",
	description: "Get paginated, filtered list of user's orders for order history page",
	responses: {
		200: {
			description: "Orders retrieved",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("query", orderListQuerySchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { status, dateRange, page, limit } = c.req.valid("query");
	const conditions = [eq(orders.userId, userId)];
	if (status !== "all") conditions.push(eq(orders.status, status));
	if (dateRange === "30d") {
		const thirtyDaysAgo = /* @__PURE__ */ new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		conditions.push(sql`${orders.createdAt} >= ${thirtyDaysAgo.toISOString()}`);
	} else if (dateRange === "6mo") {
		const sixMonthsAgo = /* @__PURE__ */ new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
		conditions.push(sql`${orders.createdAt} >= ${sixMonthsAgo.toISOString()}`);
	}
	const total = (await db.select({ count: sql`count(*)::int` }).from(orders).where(and(...conditions)))[0]?.count || 0;
	const totalPages = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	const orderRows = await db.select().from(orders).where(and(...conditions)).orderBy(sql`${orders.createdAt} DESC`).limit(limit).offset(offset);
	if (orderRows.length === 0) {
		const response$1 = {
			orders: [],
			total: 0,
			page,
			totalPages: 0
		};
		return c.json(response$1, 200);
	}
	const vendorIds = orderRows.map((o) => o.vendorId);
	const vendorRows = await db.select({
		id: vendors.id,
		name: vendors.name
	}).from(vendors).where(inArray(vendors.id, vendorIds));
	const vendorMap = new Map(vendorRows.map((v) => [v.id, v.name]));
	const orderIds = orderRows.map((o) => o.id);
	const allItems = await db.select().from(orderItems).where(inArray(orderItems.orderId, orderIds));
	const itemsByOrder = /* @__PURE__ */ new Map();
	for (const item of allItems) {
		if (!itemsByOrder.has(item.orderId)) itemsByOrder.set(item.orderId, []);
		itemsByOrder.get(item.orderId).push(item);
	}
	const response = {
		orders: orderRows.map((order) => {
			const items = itemsByOrder.get(order.id) || [];
			const itemCount = items.length;
			const itemDTOs = items.map((item) => {
				const snapshot = item.productSnapshot;
				return {
					id: item.id,
					quantity: item.quantity,
					unitPrice: item.unitPrice,
					lineTotal: item.lineTotal,
					productSnapshot: {
						title: snapshot.title,
						titleBn: snapshot.titleBn,
						image: snapshot.image,
						ageRange: snapshot.ageRange,
						selectedOptions: snapshot.selectedOptions ?? null
					}
				};
			});
			return {
				id: order.id,
				orderNumber: order.orderNumber,
				groupId: order.groupId,
				vendorName: vendorMap.get(order.vendorId) ?? "Unknown",
				status: order.status,
				total: order.total,
				itemCount,
				items: itemDTOs,
				createdAt: order.createdAt.toISOString()
			};
		}),
		total,
		page,
		totalPages
	};
	return c.json(response, 200);
}).get("/:orderId", describeRoute({
	tags: ["Orders"],
	summary: "Get order detail",
	description: "Get full details of a single order by ID",
	responses: {
		200: {
			description: "Order retrieved",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		403: {
			description: "Forbidden - order belongs to different user",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Order not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", orderIdParamSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { orderId } = c.req.valid("param");
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
	if (!order) return c.json({ error: "Order not found" }, 404);
	if (order.userId !== userId) return c.json({ error: "Forbidden" }, 403);
	const [vendor] = await db.select({ name: vendors.name }).from(vendors).where(eq(vendors.id, order.vendorId)).limit(1);
	const vendorName = vendor?.name ?? "Unknown";
	const itemDTOs = (await db.select().from(orderItems).where(eq(orderItems.orderId, order.id))).map((item) => ({
		id: item.id,
		productId: item.productId,
		quantity: item.quantity,
		unitPrice: item.unitPrice,
		lineTotal: item.lineTotal,
		productSnapshot: item.productSnapshot
	}));
	const shippingCostInfo = calculateShippingCost(order.shippingAddress.district);
	const orderDetail = {
		id: order.id,
		orderNumber: order.orderNumber,
		groupId: order.groupId,
		vendorId: order.vendorId,
		vendorName,
		status: order.status,
		paymentMethod: order.paymentMethod,
		subtotal: order.subtotal,
		shippingCost: order.shippingCost,
		codFee: order.codFee,
		total: order.total,
		shippingAddress: order.shippingAddress,
		customerNotes: order.customerNotes,
		items: itemDTOs,
		createdAt: order.createdAt.toISOString(),
		confirmedAt: order.confirmedAt?.toISOString() ?? null,
		processingAt: order.processingAt?.toISOString() ?? null,
		shippedAt: order.shippedAt?.toISOString() ?? null,
		deliveredAt: order.deliveredAt?.toISOString() ?? null,
		cancelledAt: order.cancelledAt?.toISOString() ?? null,
		codVerifiedAt: order.codVerifiedAt?.toISOString() ?? null,
		estimatedDelivery: `${shippingCostInfo.estimatedDays} days`
	};
	return c.json(orderDetail, 200);
}).post("/:orderId/cancel", describeRoute({
	tags: ["Orders"],
	summary: "Cancel order",
	description: "Cancel a pending order and restore stock. Only pending orders can be cancelled.",
	responses: {
		200: {
			description: "Order cancelled successfully",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		400: {
			description: "Bad request - only pending orders can be cancelled",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		403: {
			description: "Forbidden",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Order not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", orderIdParamSchema), zValidator("json", cancelOrderSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { orderId } = c.req.valid("param");
	const { reason } = c.req.valid("json");
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
	if (!order) return c.json({ error: "Order not found" }, 404);
	if (order.userId !== userId) return c.json({ error: "Forbidden" }, 403);
	if (order.status !== "pending") return c.json({ error: "Only pending orders can be cancelled" }, 400);
	await db.transaction(async (tx) => {
		await tx.update(orders).set({
			status: "cancelled",
			cancelledAt: /* @__PURE__ */ new Date(),
			customerNotes: reason ? order.customerNotes ? `${order.customerNotes}\n\nCancellation reason: ${reason}` : `Cancellation reason: ${reason}` : order.customerNotes
		}).where(eq(orders.id, orderId));
		const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
		for (const item of items) await tx.execute(sql`UPDATE product_skus
              SET stock_qty = stock_qty + ${item.quantity}
              WHERE product_id = ${item.productId}
              AND id = (
                SELECT id FROM product_skus
                WHERE product_id = ${item.productId}
                AND is_available = true
                ORDER BY price_amount ASC
                LIMIT 1
                FOR UPDATE
              )`);
	});
	const [updatedOrder] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
	const [vendor] = await db.select({ name: vendors.name }).from(vendors).where(eq(vendors.id, updatedOrder.vendorId)).limit(1);
	const itemDTOs = (await db.select().from(orderItems).where(eq(orderItems.orderId, orderId))).map((item) => ({
		id: item.id,
		productId: item.productId,
		quantity: item.quantity,
		unitPrice: item.unitPrice,
		lineTotal: item.lineTotal,
		productSnapshot: item.productSnapshot
	}));
	const shippingCostInfo = calculateShippingCost(updatedOrder.shippingAddress.district);
	const orderDetail = {
		id: updatedOrder.id,
		orderNumber: updatedOrder.orderNumber,
		groupId: updatedOrder.groupId,
		vendorId: updatedOrder.vendorId,
		vendorName: vendor?.name ?? "Unknown",
		status: updatedOrder.status,
		paymentMethod: updatedOrder.paymentMethod,
		subtotal: updatedOrder.subtotal,
		shippingCost: updatedOrder.shippingCost,
		codFee: updatedOrder.codFee,
		total: updatedOrder.total,
		shippingAddress: updatedOrder.shippingAddress,
		customerNotes: updatedOrder.customerNotes,
		items: itemDTOs,
		createdAt: updatedOrder.createdAt.toISOString(),
		confirmedAt: updatedOrder.confirmedAt?.toISOString() ?? null,
		processingAt: updatedOrder.processingAt?.toISOString() ?? null,
		shippedAt: updatedOrder.shippedAt?.toISOString() ?? null,
		deliveredAt: updatedOrder.deliveredAt?.toISOString() ?? null,
		cancelledAt: updatedOrder.cancelledAt?.toISOString() ?? null,
		codVerifiedAt: updatedOrder.codVerifiedAt?.toISOString() ?? null,
		estimatedDelivery: `${shippingCostInfo.estimatedDays} days`
	};
	return c.json(orderDetail, 200);
}).patch("/:orderId/verify-cod", describeRoute({
	tags: ["Orders"],
	summary: "Verify COD readiness",
	description: "Customer confirms they have cash ready for COD order",
	responses: {
		200: {
			description: "COD verified",
			content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		403: {
			description: "Forbidden",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Order not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ orderId: z.string().uuid() })), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { orderId } = c.req.valid("param");
	const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
	if (!order) return c.json({ error: "Order not found" }, 404);
	if (order.userId !== userId) return c.json({ error: "Forbidden" }, 403);
	await db.update(orders).set({ codVerifiedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, orderId));
	notifyVendor(order.vendorId, {
		type: "cod_verified",
		title: "Customer Verified COD",
		titleBn: "গ্রাহক COD যাচাই করেছে",
		body: `Customer confirmed cash readiness for order ${order.orderNumber}`,
		bodyBn: `গ্রাহক অর্ডার ${order.orderNumber} এর জন্য নগদ প্রস্তুতি নিশ্চিত করেছে`,
		data: {
			orderId: order.id,
			orderNumber: order.orderNumber
		}
	}).catch((error$1) => {
		console.error(`[ORDER] Failed to send COD verification notification:`, error$1);
	});
	return c.json({ success: true }, 200);
});

//#endregion
//#region ../../packages/api-types/src/vendor-dashboard.ts
const vendorProductListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum([
		"all",
		"draft",
		"pending",
		"approved",
		"rejected"
	]).default("all"),
	active: z.enum([
		"all",
		"active",
		"inactive"
	]).default("all"),
	search: z.string().optional(),
	categoryId: z.string().uuid().optional(),
	sort: z.enum([
		"newest",
		"oldest",
		"price_asc",
		"price_desc",
		"stock_asc"
	]).default("newest")
});
const vendorProductImageSchema = z.object({
	s3Key: z.string().min(1),
	variant: z.enum([
		"original",
		"medium",
		"thumbnail"
	]).default("original"),
	sortOrder: z.number().int().min(0)
});
const vendorProductOptionSchema = z.object({
	name: z.string().min(1).max(50),
	nameBn: z.string().max(50).optional(),
	values: z.array(z.string().min(1)).min(1),
	valuesBn: z.array(z.string()).optional()
});
const vendorProductSkuSchema = z.object({
	sku: z.string().max(50).default(""),
	optionValues: z.record(z.string(), z.string()).optional(),
	priceAmount: z.coerce.number().int().min(0).default(0),
	compareAtAmount: z.coerce.number().int().min(0).optional(),
	stockQty: z.coerce.number().int().min(0).default(0),
	isAvailable: z.boolean().default(true)
});
const vendorProductFormSchema = z.object({
	title: z.string().trim().min(1, "Title is required").max(300),
	titleBn: z.string().max(300).optional(),
	categoryId: z.string().uuid("Please select a category"),
	brand: z.string().max(100).optional(),
	shortDescription: z.string().max(500).optional(),
	shortDescriptionBn: z.string().max(500).optional(),
	description: z.string().max(5e3).optional(),
	descriptionBn: z.string().max(5e3).optional(),
	ageRange: z.string().max(50).optional(),
	ageRangeMin: z.coerce.number().int().min(0).max(36).optional(),
	ageRangeMax: z.coerce.number().int().min(0).max(36).optional(),
	isBpaFree: z.boolean().default(false),
	isOrganic: z.boolean().default(false),
	isHypoallergenic: z.boolean().default(false),
	hasSmallParts: z.boolean().default(false),
	safetyWarningEn: z.string().max(1e3).optional(),
	safetyWarningBn: z.string().max(1e3).optional(),
	safetyCertifications: z.array(z.string()).optional(),
	weightLimitKg: z.coerce.number().min(0).optional(),
	expiryDate: z.string().optional(),
	images: z.array(vendorProductImageSchema).max(5, "Maximum 5 images allowed").default([]),
	options: z.array(vendorProductOptionSchema).optional(),
	skus: z.array(vendorProductSkuSchema).default([]),
	isDraft: z.boolean().default(false)
}).superRefine((data, ctx) => {
	if (data.ageRangeMin != null && data.ageRangeMax != null && data.ageRangeMin > data.ageRangeMax) ctx.addIssue({
		code: z.ZodIssueCode.custom,
		path: ["ageRangeMax"],
		message: "Age range max must be greater than or equal to age range min"
	});
	if (data.isDraft) return;
	if (data.title.trim().length < 3) ctx.addIssue({
		code: z.ZodIssueCode.custom,
		path: ["title"],
		message: "Title must be at least 3 characters"
	});
	if (data.images.length < 1) ctx.addIssue({
		code: z.ZodIssueCode.custom,
		path: ["images"],
		message: "At least one image is required"
	});
	if (data.skus.length < 1) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: ["skus"],
			message: "At least one SKU is required"
		});
		return;
	}
	data.skus.forEach((sku, index$1) => {
		if (!sku.sku.trim()) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: [
				"skus",
				index$1,
				"sku"
			],
			message: "SKU is required"
		});
		if (sku.priceAmount < 100) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: [
				"skus",
				index$1,
				"priceAmount"
			],
			message: "Price must be at least 1 BDT"
		});
		if (sku.compareAtAmount != null && sku.compareAtAmount > 0 && sku.compareAtAmount < sku.priceAmount) ctx.addIssue({
			code: z.ZodIssueCode.custom,
			path: [
				"skus",
				index$1,
				"compareAtAmount"
			],
			message: "Compare-at price should be greater than or equal to price"
		});
	});
});
const vendorOrderListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum([
		"all",
		"pending",
		"confirmed",
		"processing",
		"shipped",
		"delivered",
		"paid_to_admin",
		"completed",
		"returned",
		"cancelled"
	]).default("all"),
	search: z.string().optional(),
	sort: z.enum(["newest", "oldest"]).default("newest")
});
const vendorOrderStatusUpdateSchema = z.object({
	status: z.enum([
		"confirmed",
		"processing",
		"shipped",
		"delivered",
		"cancelled"
	]),
	trackingNumber: z.string().max(100).optional(),
	trackingCarrier: z.string().max(100).optional()
}).refine((data) => {
	if (data.status === "shipped") return !!data.trackingNumber;
	return true;
}, {
	message: "Tracking number is required when marking as shipped",
	path: ["trackingNumber"]
});
const VENDOR_STATUS_TRANSITIONS = {
	pending: ["confirmed", "cancelled"],
	confirmed: ["processing", "cancelled"],
	processing: ["shipped"],
	shipped: ["delivered"]
};
const vendorTransactionsQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
	status: z.enum([
		"all",
		"pending",
		"cleared",
		"cancelled"
	]).default("all")
});

//#endregion
//#region src/lib/role-service.ts
const USER_ROLES = [
	"customer",
	"vendor",
	"admin",
	"super_admin"
];
const ADMIN_ROLES = ["admin", "super_admin"];
function isUserRole(role) {
	return USER_ROLES.includes(role);
}
function normalizeRoles(roles) {
	const deduped = /* @__PURE__ */ new Set();
	for (const role of roles ?? []) if (isUserRole(role)) deduped.add(role);
	deduped.add("customer");
	return [...deduped];
}
function areEqualRoles(a, b) {
	if (a.length !== b.length) return false;
	return a.every((role, index$1) => role === b[index$1]);
}
async function syncAdminLookup(tx, userId, roles) {
	if (hasAnyRole(roles, ADMIN_ROLES)) {
		await tx.insert(adminUsers).values({ userId }).onConflictDoNothing({ target: adminUsers.userId });
		return;
	}
	await tx.delete(adminUsers).where(eq(adminUsers.userId, userId));
}
function hasRole(userRoles, role) {
	return normalizeRoles(userRoles).includes(role);
}
function hasAnyRole(userRoles, roles) {
	const normalized$1 = normalizeRoles(userRoles);
	return roles.some((role) => normalized$1.includes(role));
}
async function getUserRoles(userId) {
	const [record] = await db.select({ roles: user.roles }).from(user).where(eq(user.id, userId)).limit(1);
	if (!record) return [];
	return normalizeRoles(record.roles);
}
async function grantRole(userId, role) {
	return db.transaction(async (tx) => {
		const [record] = await tx.select({ roles: user.roles }).from(user).where(eq(user.id, userId)).limit(1);
		if (!record) throw new Error(`User not found for grantRole: ${userId}`);
		const currentRoles = normalizeRoles(record.roles);
		const nextRoles = currentRoles.includes(role) ? currentRoles : [...currentRoles, role];
		if (!areEqualRoles(currentRoles, nextRoles)) await tx.update(user).set({
			roles: nextRoles,
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(user.id, userId));
		await syncAdminLookup(tx, userId, nextRoles);
		return nextRoles;
	});
}
async function revokeRole(userId, role) {
	if (role === "customer") throw new Error("customer role cannot be revoked");
	return db.transaction(async (tx) => {
		const [record] = await tx.select({ roles: user.roles }).from(user).where(eq(user.id, userId)).limit(1);
		if (!record) throw new Error(`User not found for revokeRole: ${userId}`);
		const currentRoles = normalizeRoles(record.roles);
		if (!currentRoles.includes(role)) {
			await syncAdminLookup(tx, userId, currentRoles);
			return currentRoles;
		}
		if (role === "super_admin") {
			const [result] = await tx.select({ count: sql`count(*)::int` }).from(user).where(sql`${user.roles} @> ARRAY['super_admin']::text[]`);
			if (Number(result?.count ?? 0) <= 1) throw new Error("Cannot revoke the last super_admin");
		}
		const nextRoles = currentRoles.filter((currentRole) => currentRole !== role);
		if (!nextRoles.includes("customer")) nextRoles.unshift("customer");
		await tx.update(user).set({
			roles: nextRoles,
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(user.id, userId));
		await syncAdminLookup(tx, userId, nextRoles);
		return nextRoles;
	});
}
async function syncVendorRole(userId) {
	const [approvedApplication] = await db.select({ id: vendorApplications.id }).from(vendorApplications).where(and(eq(vendorApplications.userId, userId), eq(vendorApplications.status, "approved"))).limit(1);
	if (!approvedApplication) return false;
	await grantRole(userId, "vendor");
	return true;
}

//#endregion
//#region src/middleware/vendor-auth.ts
/**
* Helper: generate slug from shop name
*/
function generateSlug$2(name) {
	return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 200);
}
/**
* Vendor Auth Middleware
*
* Verifies the authenticated user is an approved vendor and injects
* vendorId + vendorName into the Hono context.
*
* Returns 401 if not authenticated, 403 if not an approved vendor.
*
* If an approved application doesn't have a vendorId, creates a vendor
* record and links it to the application.
*/
const vendorAuthMiddleware = createMiddleware(async (c, next) => {
	const authUser = c.var.user;
	const userId = authUser?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	if (!hasRole(authUser?.roles, "vendor")) {
		if (!await syncVendorRole(userId)) return c.json({ error: "Not an approved vendor" }, 403);
		if (!hasRole(await getUserRoles(userId), "vendor")) return c.json({ error: "Not an approved vendor" }, 403);
	}
	const [application] = await db.select({
		id: vendorApplications.id,
		vendorId: vendorApplications.vendorId,
		shopNameEn: vendorApplications.shopNameEn
	}).from(vendorApplications).where(and(eq(vendorApplications.userId, userId), eq(vendorApplications.status, "approved"))).limit(1);
	if (!application) return c.json({ error: "Not an approved vendor" }, 403);
	let vendorId = application.vendorId;
	if (!vendorId) {
		const slug = generateSlug$2(application.shopNameEn);
		const [newVendor] = await db.insert(vendors).values({
			name: application.shopNameEn,
			slug,
			isVerified: true
		}).returning({ id: vendors.id });
		if (!newVendor) return c.json({ error: "Failed to create vendor" }, 500);
		vendorId = newVendor.id;
		await db.update(vendorApplications).set({ vendorId }).where(eq(vendorApplications.id, application.id));
	}
	c.set("vendorId", vendorId);
	c.set("vendorName", application.shopNameEn);
	await next();
});

//#endregion
//#region src/routes/vendor-dashboard.ts
function generateSlug$1(title) {
	return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 200);
}
const vendorDashboardRouter = new Hono().use("*", vendorAuthMiddleware).get("/overview", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Get vendor dashboard overview",
	description: "Returns dashboard stats, recent orders, and low stock alerts for the authenticated vendor",
	responses: { 200: {
		description: "Dashboard overview data",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const vendorId = c.var.vendorId;
	const [vendorRows, totalOrdersResult, pendingOrdersResult, totalEarningsResult, totalPaidOutResult, productsListedResult, productsPendingResult, recentOrderRows, lowStockRows] = await Promise.all([
		db.select({
			id: vendors.id,
			name: vendors.name,
			slug: vendors.slug,
			logoUrl: vendors.logoUrl,
			isVerified: vendors.isVerified
		}).from(vendors).where(eq(vendors.id, vendorId)).limit(1),
		db.select({ count: sql`count(*)::int` }).from(orders).where(eq(orders.vendorId, vendorId)),
		db.select({ count: sql`count(*)::int` }).from(orders).where(and(eq(orders.vendorId, vendorId), sql`${orders.status} IN ('pending', 'confirmed', 'processing')`)),
		db.select({ total: sql`coalesce(sum(${transactions.amountPaisa}), 0)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), inArray(transactions.type, [
			"sale",
			"commission_deduction",
			"delivery_charge",
			"return_fee",
			"adjustment"
		]))),
		db.select({ total: sql`coalesce(sum(abs(${transactions.amountPaisa})), 0)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), inArray(transactions.type, ["payout", "payout_fee"]))),
		db.select({ count: sql`count(*)::int` }).from(products).where(and(eq(products.vendorId, vendorId), eq(products.isActive, true))),
		db.select({ count: sql`count(*)::int` }).from(products).where(and(eq(products.vendorId, vendorId), eq(products.status, "pending"), eq(products.isActive, true))),
		db.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			status: orders.status,
			total: orders.total,
			createdAt: orders.createdAt,
			shippingAddress: orders.shippingAddress
		}).from(orders).where(eq(orders.vendorId, vendorId)).orderBy(desc(orders.createdAt)).limit(5),
		db.select({
			productId: products.id,
			title: products.title,
			slug: products.slug,
			skuId: productSkus.id,
			sku: productSkus.sku,
			stockQty: productSkus.stockQty
		}).from(productSkus).innerJoin(products, eq(productSkus.productId, products.id)).where(and(eq(products.vendorId, vendorId), eq(products.isActive, true), eq(productSkus.isAvailable, true), sql`${productSkus.stockQty} <= 5`)).orderBy(asc(productSkus.stockQty)).limit(10)
	]);
	const vendor = vendorRows[0];
	if (!vendor) return c.json({ error: "Vendor not found" }, 404);
	const totalEarnings = totalEarningsResult[0]?.total ?? 0;
	const totalPaidOut = totalPaidOutResult[0]?.total ?? 0;
	const recentOrderIds = recentOrderRows.map((o) => o.id);
	const lowStockProductIds = [...new Set(lowStockRows.map((r) => r.productId))];
	const [itemCounts, images] = await Promise.all([recentOrderIds.length > 0 ? db.select({
		orderId: orderItems.orderId,
		count: sql`count(*)::int`
	}).from(orderItems).where(inArray(orderItems.orderId, recentOrderIds)).groupBy(orderItems.orderId) : Promise.resolve([]), lowStockProductIds.length > 0 ? db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key
	}).from(productImages).where(inArray(productImages.productId, lowStockProductIds)).orderBy(asc(productImages.sortOrder)) : Promise.resolve([])]);
	const itemCountMap = new Map(itemCounts.map((itemCount) => [itemCount.orderId, itemCount.count]));
	const imageMap = /* @__PURE__ */ new Map();
	for (const img of images) if (!imageMap.has(img.productId)) imageMap.set(img.productId, getS3Url(img.s3Key));
	const recentOrders = recentOrderRows.map((order) => ({
		id: order.id,
		orderNumber: order.orderNumber,
		customerName: order.shippingAddress.fullName,
		status: order.status,
		total: order.total,
		itemCount: itemCountMap.get(order.id) ?? 0,
		createdAt: order.createdAt.toISOString()
	}));
	const lowStockProducts = lowStockRows.map((row) => ({
		id: row.productId,
		title: row.title,
		slug: row.slug,
		imageUrl: imageMap.get(row.productId) ?? null,
		skuId: row.skuId,
		sku: row.sku,
		stockQty: row.stockQty
	}));
	const response = {
		vendor: {
			vendorId: vendor.id,
			vendorName: vendor.name,
			vendorSlug: vendor.slug,
			vendorLogo: vendor.logoUrl,
			isVerified: vendor.isVerified ?? false
		},
		stats: {
			totalOrders: totalOrdersResult[0]?.count ?? 0,
			pendingOrders: pendingOrdersResult[0]?.count ?? 0,
			totalEarnings,
			pendingPayout: totalEarnings - totalPaidOut,
			productsListed: productsListedResult[0]?.count ?? 0,
			productsPendingApproval: productsPendingResult[0]?.count ?? 0
		},
		recentOrders,
		lowStockProducts
	};
	return c.json(response, 200);
}).get("/products", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "List vendor's products",
	description: "Paginated, filterable list of vendor's products",
	responses: { 200: {
		description: "Product list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", vendorProductListQuerySchema), async (c) => {
	const vendorId = c.var.vendorId;
	const { page, limit, status, active, search, categoryId, sort } = c.req.valid("query");
	const conditions = [eq(products.vendorId, vendorId)];
	if (active === "active") conditions.push(eq(products.isActive, true));
	else if (active === "inactive") conditions.push(eq(products.isActive, false));
	if (status !== "all") conditions.push(eq(products.status, status));
	if (search) conditions.push(ilike(products.title, `%${search}%`));
	if (categoryId) conditions.push(eq(products.categoryId, categoryId));
	const offset = (page - 1) * limit;
	let orderBy;
	switch (sort) {
		case "oldest":
			orderBy = asc(products.createdAt);
			break;
		case "newest":
		default:
			orderBy = desc(products.createdAt);
			break;
	}
	const [countRows, productRows] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(products).where(and(...conditions)), db.select({
		id: products.id,
		title: products.title,
		titleBn: products.titleBn,
		slug: products.slug,
		status: products.status,
		categoryId: products.categoryId,
		isActive: products.isActive,
		createdAt: products.createdAt,
		updatedAt: products.updatedAt
	}).from(products).where(and(...conditions)).orderBy(orderBy).limit(limit).offset(offset)]);
	const total = countRows[0]?.count ?? 0;
	const totalPages = Math.ceil(total / limit);
	if (productRows.length === 0) {
		const emptyResponse = {
			products: [],
			total: 0,
			page,
			limit,
			totalPages: 0
		};
		return c.json(emptyResponse, 200);
	}
	const productIds = productRows.map((p) => p.id);
	const [imageRows, skuRows, categoryRows] = await Promise.all([
		db.select({
			productId: productImages.productId,
			s3Key: productImages.s3Key
		}).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder)),
		db.select({
			productId: productSkus.productId,
			priceAmount: productSkus.priceAmount,
			stockQty: productSkus.stockQty
		}).from(productSkus).where(inArray(productSkus.productId, productIds)),
		db.select({
			id: categories.id,
			name: categories.name
		}).from(categories).where(inArray(categories.id, productRows.map((p) => p.categoryId)))
	]);
	const firstImageMap = /* @__PURE__ */ new Map();
	for (const img of imageRows) if (!firstImageMap.has(img.productId)) firstImageMap.set(img.productId, getS3Url(img.s3Key));
	const skuStatsMap = /* @__PURE__ */ new Map();
	for (const sku of skuRows) {
		const existing = skuStatsMap.get(sku.productId);
		if (existing) {
			existing.minPrice = Math.min(existing.minPrice, sku.priceAmount);
			existing.totalStock += sku.stockQty;
		} else skuStatsMap.set(sku.productId, {
			minPrice: sku.priceAmount,
			totalStock: sku.stockQty
		});
	}
	const categoryMap = new Map(categoryRows.map((c$1) => [c$1.id, c$1.name]));
	const response = {
		products: productRows.map((p) => {
			const skuStats = skuStatsMap.get(p.id);
			return {
				id: p.id,
				title: p.title,
				titleBn: p.titleBn,
				slug: p.slug,
				status: p.status,
				imageUrl: firstImageMap.get(p.id) ?? null,
				categoryName: categoryMap.get(p.categoryId) ?? "Unknown",
				categoryId: p.categoryId,
				priceAmount: skuStats?.minPrice ?? 0,
				totalStock: skuStats?.totalStock ?? 0,
				isActive: p.isActive ?? true,
				createdAt: p.createdAt.toISOString(),
				updatedAt: p.updatedAt.toISOString()
			};
		}),
		total,
		page,
		limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/products/:productId", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Get product detail for editing",
	description: "Returns full product detail including images, options, and SKUs",
	responses: {
		200: {
			description: "Product detail",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ productId: z.string().uuid() })), async (c) => {
	const vendorId = c.var.vendorId;
	const { productId } = c.req.valid("param");
	const [product] = await db.select().from(products).where(and(eq(products.id, productId), eq(products.vendorId, vendorId))).limit(1);
	if (!product) return c.json({ error: "Product not found" }, 404);
	const [images, options, skus, [category]] = await Promise.all([
		db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder)),
		db.select().from(productOptions).where(eq(productOptions.productId, productId)).orderBy(asc(productOptions.sortOrder)),
		db.select().from(productSkus).where(eq(productSkus.productId, productId)),
		db.select({ name: categories.name }).from(categories).where(eq(categories.id, product.categoryId)).limit(1)
	]);
	const response = {
		id: product.id,
		title: product.title,
		titleBn: product.titleBn,
		slug: product.slug,
		categoryId: product.categoryId,
		categoryName: category?.name ?? "Unknown",
		brand: product.brand,
		shortDescription: product.shortDescription,
		shortDescriptionBn: product.shortDescriptionBn,
		description: product.description,
		descriptionBn: product.descriptionBn,
		ageRange: product.ageRange,
		ageRangeMin: product.ageRangeMin,
		ageRangeMax: product.ageRangeMax,
		isBpaFree: product.isBpaFree,
		isOrganic: product.isOrganic,
		isHypoallergenic: product.isHypoallergenic,
		hasSmallParts: product.hasSmallParts,
		safetyWarningEn: product.safetyWarningEn,
		safetyWarningBn: product.safetyWarningBn,
		safetyCertifications: product.safetyCertifications,
		weightLimitKg: product.weightLimitKg,
		expiryDate: product.expiryDate?.toISOString() ?? null,
		status: product.status,
		isActive: product.isActive ?? true,
		images: images.map((img) => ({
			id: img.id,
			s3Key: img.s3Key,
			variant: img.variant,
			isPrimary: img.isPrimary ?? false,
			sortOrder: img.sortOrder
		})),
		options: options.map((opt) => ({
			id: opt.id,
			name: opt.name,
			nameBn: opt.nameBn,
			values: opt.values,
			valuesBn: opt.valuesBn,
			sortOrder: opt.sortOrder
		})),
		skus: skus.map((sku) => ({
			id: sku.id,
			sku: sku.sku,
			optionValues: sku.optionValues,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		})),
		createdAt: product.createdAt.toISOString(),
		updatedAt: product.updatedAt.toISOString()
	};
	return c.json(response, 200);
}).post("/products", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Create a new product",
	description: "Creates a product with images, options, and SKUs in a single transaction",
	responses: {
		201: {
			description: "Product created",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		400: {
			description: "Validation error",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", vendorProductFormSchema), async (c) => {
	const vendorId = c.var.vendorId;
	const input = c.req.valid("json");
	const normalizedImages = input.images ?? [];
	const normalizedOptions = input.options ?? [];
	const normalizedSkus = input.isDraft ? input.skus.filter((sku) => sku.sku.trim().length > 0) : input.skus;
	let slug = generateSlug$1(input.title);
	const [existing] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
	if (existing) slug = `${slug}-${Date.now().toString(36)}`;
	const productStatus = input.isDraft ? "draft" : "pending";
	const result = await db.transaction(async (tx) => {
		const [product] = await tx.insert(products).values({
			title: input.title,
			titleBn: input.titleBn || null,
			slug,
			vendorId,
			categoryId: input.categoryId,
			brand: input.brand || null,
			shortDescription: input.shortDescription || null,
			shortDescriptionBn: input.shortDescriptionBn || null,
			description: input.description || null,
			descriptionBn: input.descriptionBn || null,
			ageRange: input.ageRange || null,
			ageRangeMin: input.ageRangeMin ?? null,
			ageRangeMax: input.ageRangeMax ?? null,
			isBpaFree: input.isBpaFree,
			isOrganic: input.isOrganic,
			isHypoallergenic: input.isHypoallergenic,
			hasSmallParts: input.hasSmallParts,
			safetyWarningEn: input.safetyWarningEn || null,
			safetyWarningBn: input.safetyWarningBn || null,
			safetyCertifications: input.safetyCertifications || null,
			weightLimitKg: input.weightLimitKg ?? null,
			expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
			status: productStatus,
			pendingReason: input.isDraft ? null : "new_submission",
			submittedAt: input.isDraft ? null : /* @__PURE__ */ new Date(),
			isActive: true
		}).returning();
		if (!product) throw new Error("Failed to create product");
		if (normalizedImages.length > 0) await tx.insert(productImages).values(normalizedImages.map((img, idx) => ({
			productId: product.id,
			s3Key: img.s3Key,
			variant: img.variant || "original",
			isPrimary: idx === 0,
			sortOrder: img.sortOrder
		})));
		if (normalizedOptions.length > 0) await tx.insert(productOptions).values(normalizedOptions.map((opt, idx) => ({
			productId: product.id,
			name: opt.name,
			nameBn: opt.nameBn || null,
			values: opt.values,
			valuesBn: opt.valuesBn || null,
			sortOrder: idx
		})));
		if (normalizedSkus.length > 0) await tx.insert(productSkus).values(normalizedSkus.map((sku) => ({
			productId: product.id,
			sku: sku.sku.trim(),
			optionValues: sku.optionValues || null,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount ?? null,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		})));
		return product;
	});
	return c.json({
		id: result.id,
		slug: result.slug,
		status: result.status
	}, 201);
}).put("/products/:productId", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Update a product",
	description: "Updates product, replaces images/options/SKUs in a transaction",
	responses: {
		200: {
			description: "Product updated",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ productId: z.string().uuid() })), zValidator("json", vendorProductFormSchema), async (c) => {
	const vendorId = c.var.vendorId;
	const { productId } = c.req.valid("param");
	const input = c.req.valid("json");
	const normalizedImages = input.images ?? [];
	const normalizedOptions = input.options ?? [];
	const normalizedSkus = input.isDraft ? input.skus.filter((sku) => sku.sku.trim().length > 0) : input.skus;
	const [existing] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.vendorId, vendorId))).limit(1);
	if (!existing) return c.json({ error: "Product not found" }, 404);
	const updateStatus = input.isDraft ? "draft" : "pending";
	await db.transaction(async (tx) => {
		await tx.update(products).set({
			title: input.title,
			titleBn: input.titleBn || null,
			categoryId: input.categoryId,
			brand: input.brand || null,
			shortDescription: input.shortDescription || null,
			shortDescriptionBn: input.shortDescriptionBn || null,
			description: input.description || null,
			descriptionBn: input.descriptionBn || null,
			ageRange: input.ageRange || null,
			ageRangeMin: input.ageRangeMin ?? null,
			ageRangeMax: input.ageRangeMax ?? null,
			isBpaFree: input.isBpaFree,
			isOrganic: input.isOrganic,
			isHypoallergenic: input.isHypoallergenic,
			hasSmallParts: input.hasSmallParts,
			safetyWarningEn: input.safetyWarningEn || null,
			safetyWarningBn: input.safetyWarningBn || null,
			safetyCertifications: input.safetyCertifications || null,
			weightLimitKg: input.weightLimitKg ?? null,
			expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
			status: updateStatus,
			pendingReason: input.isDraft ? null : "vendor_update",
			submittedAt: input.isDraft ? null : /* @__PURE__ */ new Date()
		}).where(eq(products.id, productId));
		await tx.delete(productImages).where(eq(productImages.productId, productId));
		if (normalizedImages.length > 0) await tx.insert(productImages).values(normalizedImages.map((img, idx) => ({
			productId,
			s3Key: img.s3Key,
			variant: img.variant || "original",
			isPrimary: idx === 0,
			sortOrder: img.sortOrder
		})));
		await tx.delete(productOptions).where(eq(productOptions.productId, productId));
		if (normalizedOptions.length > 0) await tx.insert(productOptions).values(normalizedOptions.map((opt, idx) => ({
			productId,
			name: opt.name,
			nameBn: opt.nameBn || null,
			values: opt.values,
			valuesBn: opt.valuesBn || null,
			sortOrder: idx
		})));
		await tx.delete(productSkus).where(eq(productSkus.productId, productId));
		if (normalizedSkus.length > 0) await tx.insert(productSkus).values(normalizedSkus.map((sku) => ({
			productId,
			sku: sku.sku.trim(),
			optionValues: sku.optionValues || null,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount ?? null,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		})));
	});
	return c.json({
		id: productId,
		status: updateStatus
	}, 200);
}).delete("/products/:productId", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Deactivate a product",
	description: "Soft-deletes a product by setting isActive to false",
	responses: {
		200: {
			description: "Product deactivated",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ productId: z.string().uuid() })), async (c) => {
	const vendorId = c.var.vendorId;
	const { productId } = c.req.valid("param");
	const [existing] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.vendorId, vendorId))).limit(1);
	if (!existing) return c.json({ error: "Product not found" }, 404);
	await db.update(products).set({ isActive: false }).where(eq(products.id, productId));
	return c.json({
		id: productId,
		isActive: false
	}, 200);
}).patch("/products/:productId/reactivate", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Reactivate a product",
	description: "Sets isActive to true for a vendor-owned product",
	responses: {
		200: {
			description: "Product reactivated",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ productId: z.string().uuid() })), async (c) => {
	const vendorId = c.var.vendorId;
	const { productId } = c.req.valid("param");
	const [existing] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.vendorId, vendorId))).limit(1);
	if (!existing) return c.json({ error: "Product not found" }, 404);
	await db.update(products).set({ isActive: true }).where(eq(products.id, productId));
	return c.json({
		id: productId,
		isActive: true
	}, 200);
}).get("/orders", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "List vendor's orders",
	description: "Paginated, filterable list of orders for this vendor",
	responses: { 200: {
		description: "Order list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", vendorOrderListQuerySchema), async (c) => {
	const vendorId = c.var.vendorId;
	const { page, limit, status, search, sort } = c.req.valid("query");
	const conditions = [eq(orders.vendorId, vendorId)];
	if (status !== "all") conditions.push(eq(orders.status, status));
	if (search) conditions.push(ilike(orders.orderNumber, `%${search}%`));
	const [countResult] = await db.select({ count: sql`count(*)::int` }).from(orders).where(and(...conditions));
	const total = countResult?.count ?? 0;
	const totalPages = Math.ceil(total / limit);
	const offset = (page - 1) * limit;
	const orderBy = sort === "oldest" ? asc(orders.createdAt) : desc(orders.createdAt);
	const orderRows = await db.select({
		id: orders.id,
		orderNumber: orders.orderNumber,
		status: orders.status,
		total: orders.total,
		paymentMethod: orders.paymentMethod,
		shippingAddress: orders.shippingAddress,
		createdAt: orders.createdAt
	}).from(orders).where(and(...conditions)).orderBy(orderBy).limit(limit).offset(offset);
	const orderIds = orderRows.map((o) => o.id);
	let itemCountMap = /* @__PURE__ */ new Map();
	if (orderIds.length > 0) {
		const itemCounts = await db.select({
			orderId: orderItems.orderId,
			count: sql`count(*)::int`
		}).from(orderItems).where(inArray(orderItems.orderId, orderIds)).groupBy(orderItems.orderId);
		itemCountMap = new Map(itemCounts.map((ic) => [ic.orderId, ic.count]));
	}
	const response = {
		orders: orderRows.map((order) => {
			const addr = order.shippingAddress;
			return {
				id: order.id,
				orderNumber: order.orderNumber,
				customerName: addr.fullName,
				customerPhone: addr.phone,
				status: order.status,
				total: order.total,
				itemCount: itemCountMap.get(order.id) ?? 0,
				paymentMethod: order.paymentMethod,
				createdAt: order.createdAt.toISOString()
			};
		}),
		total,
		page,
		limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/orders/:orderId", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Get order detail",
	description: "Full order detail for vendor's order",
	responses: {
		200: {
			description: "Order detail",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Order not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ orderId: z.string().uuid() })), async (c) => {
	const vendorId = c.var.vendorId;
	const { orderId } = c.req.valid("param");
	const [order] = await db.select().from(orders).where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId))).limit(1);
	if (!order) return c.json({ error: "Order not found" }, 404);
	const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
	const addr = order.shippingAddress;
	const response = {
		id: order.id,
		orderNumber: order.orderNumber,
		status: order.status,
		paymentMethod: order.paymentMethod,
		subtotal: order.subtotal,
		shippingCost: order.shippingCost,
		codFee: order.codFee,
		total: order.total,
		customerNotes: order.customerNotes,
		trackingNumber: order.trackingNumber,
		trackingCarrier: order.trackingCarrier,
		shippingAddress: addr,
		items: items.map((item) => {
			const snapshot = item.productSnapshot;
			return {
				id: item.id,
				productId: item.productId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				lineTotal: item.lineTotal,
				productSnapshot: {
					title: snapshot.title,
					titleBn: snapshot.titleBn,
					slug: snapshot.slug,
					image: snapshot.image,
					selectedOptions: snapshot.selectedOptions ?? null,
					skuCode: snapshot.skuCode ?? null
				}
			};
		}),
		createdAt: order.createdAt.toISOString(),
		confirmedAt: order.confirmedAt?.toISOString() ?? null,
		processingAt: order.processingAt?.toISOString() ?? null,
		shippedAt: order.shippedAt?.toISOString() ?? null,
		deliveredAt: order.deliveredAt?.toISOString() ?? null,
		cancelledAt: order.cancelledAt?.toISOString() ?? null
	};
	return c.json(response, 200);
}).patch("/orders/:orderId/status", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Update order status",
	description: "Update order status with valid transitions. Tracking required for shipped.",
	responses: {
		200: {
			description: "Status updated",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		400: {
			description: "Invalid status transition",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "Order not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("param", z.object({ orderId: z.string().uuid() })), zValidator("json", vendorOrderStatusUpdateSchema), async (c) => {
	const vendorId = c.var.vendorId;
	const { orderId } = c.req.valid("param");
	const { status: newStatus, trackingNumber, trackingCarrier } = c.req.valid("json");
	const [order] = await db.select({
		id: orders.id,
		orderNumber: orders.orderNumber,
		status: orders.status,
		userId: orders.userId,
		trackingNumber: orders.trackingNumber,
		trackingCarrier: orders.trackingCarrier
	}).from(orders).where(and(eq(orders.id, orderId), eq(orders.vendorId, vendorId))).limit(1);
	if (!order) return c.json({ error: "Order not found" }, 404);
	if (!(VENDOR_STATUS_TRANSITIONS[order.status] ?? []).includes(newStatus)) return c.json({ error: `Cannot transition from '${order.status}' to '${newStatus}'` }, 400);
	const updateData = { status: newStatus };
	if (newStatus === "confirmed") updateData.confirmedAt = /* @__PURE__ */ new Date();
	else if (newStatus === "processing") updateData.processingAt = /* @__PURE__ */ new Date();
	else if (newStatus === "shipped") {
		updateData.shippedAt = /* @__PURE__ */ new Date();
		updateData.trackingNumber = trackingNumber;
		updateData.trackingCarrier = trackingCarrier || null;
	} else if (newStatus === "delivered") updateData.deliveredAt = /* @__PURE__ */ new Date();
	else if (newStatus === "cancelled") updateData.cancelledAt = /* @__PURE__ */ new Date();
	await db.update(orders).set(updateData).where(and(eq(orders.id, orderId), eq(orders.status, order.status)));
	const [customer] = await db.select({
		email: user.email,
		name: user.name
	}).from(user).where(eq(user.id, order.userId)).limit(1);
	if (customer) {
		const notificationData = {
			confirmed: {
				type: "order_confirmed",
				title: "Order Confirmed",
				titleBn: "অর্ডার নিশ্চিত করা হয়েছে",
				body: `Your order ${order.orderNumber} has been confirmed`,
				bodyBn: `আপনার অর্ডার ${order.orderNumber} নিশ্চিত করা হয়েছে`
			},
			processing: {
				type: "order_processing",
				title: "Order is Being Prepared",
				titleBn: "অর্ডার প্রস্তুত করা হচ্ছে",
				body: `Your order ${order.orderNumber} is being prepared`,
				bodyBn: `আপনার অর্ডার ${order.orderNumber} প্রস্তুত করা হচ্ছে`
			},
			shipped: {
				type: "order_shipped",
				title: "Order Shipped",
				titleBn: "অর্ডার পাঠানো হয়েছে",
				body: trackingNumber ? `Your order ${order.orderNumber} is on the way (Tracking: ${trackingNumber})` : `Your order ${order.orderNumber} is on the way`,
				bodyBn: trackingNumber ? `আপনার অর্ডার ${order.orderNumber} পথে আছে (ট্র্যাকিং: ${trackingNumber})` : `আপনার অর্ডার ${order.orderNumber} পথে আছে`
			},
			delivered: {
				type: "order_delivered",
				title: "Order Delivered",
				titleBn: "অর্ডার সরবরাহ করা হয়েছে",
				body: `Your order ${order.orderNumber} has been delivered`,
				bodyBn: `আপনার অর্ডার ${order.orderNumber} সরবরাহ করা হয়েছে`
			},
			cancelled: {
				type: "order_cancelled",
				title: "Order Cancelled",
				titleBn: "অর্ডার বাতিল করা হয়েছে",
				body: `Your order ${order.orderNumber} has been cancelled`,
				bodyBn: `আপনার অর্ডার ${order.orderNumber} বাতিল করা হয়েছে`
			}
		}[newStatus];
		if (notificationData) notify({
			userId: order.userId,
			type: notificationData.type,
			title: notificationData.title,
			titleBn: notificationData.titleBn,
			body: notificationData.body,
			bodyBn: notificationData.bodyBn,
			data: {
				orderId: order.id,
				orderNumber: order.orderNumber,
				trackingNumber: trackingNumber ?? order.trackingNumber,
				trackingCarrier: trackingCarrier ?? order.trackingCarrier
			},
			channel: "customer",
			emailData: {
				userEmail: customer.email,
				userName: customer.name,
				orderNumber: order.orderNumber,
				trackingNumber: trackingNumber ?? order.trackingNumber,
				trackingCarrier: trackingCarrier ?? order.trackingCarrier
			}
		}).catch((error$1) => {
			console.error(`[VENDOR] Failed to send notification for ${order.orderNumber}:`, error$1);
		});
	}
	return c.json({
		id: orderId,
		status: newStatus
	}, 200);
}).get("/earnings", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Get vendor earnings summary",
	description: "Returns earnings summary from delivered orders and payouts",
	responses: { 200: {
		description: "Earnings summary",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const vendorId = c.var.vendorId;
	const now = /* @__PURE__ */ new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const [ledgerBalanceResult, totalNetResult, thisMonthNetResult, totalPaidOutResult, orderCountResult] = await Promise.all([
		db.select({
			availableBalance: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
			pendingBalance: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`
		}).from(transactions).where(eq(transactions.vendorId, vendorId)),
		db.select({ total: sql`coalesce(sum(${transactions.amountPaisa}), 0)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), inArray(transactions.type, [
			"sale",
			"commission_deduction",
			"delivery_charge",
			"return_fee",
			"adjustment"
		]))),
		db.select({ total: sql`coalesce(sum(${transactions.amountPaisa}), 0)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), inArray(transactions.type, [
			"sale",
			"commission_deduction",
			"delivery_charge",
			"return_fee",
			"adjustment"
		]), gte(transactions.createdAt, startOfMonth))),
		db.select({ total: sql`coalesce(sum(abs(${transactions.amountPaisa})), 0)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), inArray(transactions.type, ["payout", "payout_fee"]))),
		db.select({ count: sql`count(*)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), eq(transactions.type, "sale")))
	]);
	const totalEarnings = totalNetResult[0]?.total ?? 0;
	const totalPaidOut = totalPaidOutResult[0]?.total ?? 0;
	const availableBalance = ledgerBalanceResult[0]?.availableBalance ?? 0;
	const pendingBalance = ledgerBalanceResult[0]?.pendingBalance ?? 0;
	const response = {
		totalEarnings,
		pendingPayout: availableBalance,
		totalPaidOut,
		thisMonthEarnings: thisMonthNetResult[0]?.total ?? 0,
		orderCount: orderCountResult[0]?.count ?? 0,
		availableBalance,
		pendingBalance
	};
	return c.json(response, 200);
}).get("/wallet", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Get wallet summary",
	description: "Returns available and pending wallet balances with total paid out.",
	responses: { 200: {
		description: "Wallet summary",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const vendorId = c.var.vendorId;
	const [ledgerResult, paidOutResult] = await Promise.all([db.select({
		availableBalance: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
		pendingBalance: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`
	}).from(transactions).where(eq(transactions.vendorId, vendorId)), db.select({ total: sql`coalesce(sum(abs(${transactions.amountPaisa})), 0)::int` }).from(transactions).where(and(eq(transactions.vendorId, vendorId), inArray(transactions.type, ["payout", "payout_fee"])))]);
	const response = {
		availableBalance: ledgerResult[0]?.availableBalance ?? 0,
		pendingBalance: ledgerResult[0]?.pendingBalance ?? 0,
		totalPaidOut: paidOutResult[0]?.total ?? 0
	};
	return c.json(response, 200);
}).get("/transactions", describeRoute({
	tags: ["Vendor Dashboard"],
	summary: "Get vendor ledger statement",
	description: "Returns paginated wallet transactions for the vendor.",
	responses: { 200: {
		description: "Transaction statement",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", vendorTransactionsQuerySchema), async (c) => {
	const vendorId = c.var.vendorId;
	const query$1 = c.req.valid("query");
	const offset = (query$1.page - 1) * query$1.limit;
	const whereClause = query$1.status === "all" ? eq(transactions.vendorId, vendorId) : and(eq(transactions.vendorId, vendorId), eq(transactions.status, query$1.status));
	const [totalResult, rows] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(transactions).where(whereClause), db.select({
		id: transactions.id,
		orderId: transactions.orderId,
		payoutId: transactions.payoutId,
		type: transactions.type,
		status: transactions.status,
		amountPaisa: transactions.amountPaisa,
		description: transactions.description,
		referenceId: transactions.referenceId,
		referenceType: transactions.referenceType,
		createdAt: transactions.createdAt
	}).from(transactions).where(whereClause).orderBy(desc(transactions.createdAt)).limit(query$1.limit).offset(offset)]);
	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / query$1.limit);
	const response = {
		transactions: rows.map((row) => ({
			id: row.id,
			orderId: row.orderId,
			payoutId: row.payoutId,
			type: row.type,
			status: row.status,
			amountPaisa: row.amountPaisa,
			description: row.description,
			referenceId: row.referenceId,
			referenceType: row.referenceType,
			createdAt: row.createdAt.toISOString()
		})),
		total,
		page: query$1.page,
		limit: query$1.limit,
		totalPages
	};
	return c.json(response, 200);
});

//#endregion
//#region ../../packages/api-types/src/admin.ts
const adminVendorListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum([
		"all",
		"pending",
		"approved",
		"rejected"
	]).default("all"),
	search: z.string().optional()
});
const adminVendorStatusUpdateSchema = z.object({
	status: z.enum(["approved", "rejected"]),
	reviewNotes: z.string().max(1e3).optional()
});
const adminProductListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum([
		"all",
		"pending",
		"approved",
		"rejected"
	]).default("all"),
	search: z.string().optional(),
	vendorId: z.string().uuid().optional(),
	sort: z.enum(["newest", "oldest"]).default("newest")
});
const adminProductStatusUpdateSchema = z.object({
	status: z.enum(["approved", "rejected"]),
	reviewNotes: z.string().max(1e3).optional()
});
const adminProductActiveUpdateSchema = z.object({
	isActive: z.boolean(),
	reason: z.string().max(1e3).optional()
});
const adminOrderListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	status: z.enum([
		"all",
		"pending",
		"confirmed",
		"processing",
		"shipped",
		"delivered",
		"paid_to_admin",
		"completed",
		"returned",
		"cancelled"
	]).default("all"),
	search: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	sort: z.enum(["newest", "oldest"]).default("newest")
});
const adminUserListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	search: z.string().optional()
});
const adminPayoutProcessSchema = z.object({
	vendorId: z.string().uuid(),
	amountPaisa: z.coerce.number().int().min(1).optional(),
	payoutFeePaisa: z.coerce.number().int().min(0).optional(),
	paymentMethod: z.enum([
		"bank",
		"bkash",
		"nagad"
	]),
	paymentReference: z.string().min(1, "Payment reference is required").max(100),
	notes: z.string().max(500).optional(),
	periodStart: z.string().optional(),
	periodEnd: z.string().optional()
});
const adminPayoutHistoryQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	vendorId: z.string().uuid().optional()
});
const adminOrderReconcileSchema = z.object({
	actualCourierCostPaisa: z.coerce.number().int().min(0),
	returnFeePaisa: z.coerce.number().int().min(0).optional().default(0),
	deductDeliveryFromVendor: z.boolean().optional().default(false),
	deductReturnFeeFromVendor: z.boolean().optional().default(false),
	courierName: z.string().max(40).optional(),
	courierOrderRef: z.string().max(120).optional(),
	notes: z.string().max(500).optional()
});
const adminSettlementClearSchema = z.object({ maturityDays: z.coerce.number().int().min(0).max(30).optional().default(7) });
const adminBannerFormSchema = z.object({
	titleEn: z.string().min(1, "English title is required").max(200),
	titleBn: z.string().max(200).optional(),
	subtitleEn: z.string().max(300).optional(),
	subtitleBn: z.string().max(300).optional(),
	priceLabel: z.string().max(100).optional(),
	badgeText: z.string().max(50).optional(),
	badgeColor: z.enum([
		"red",
		"teal",
		"purple",
		"orange",
		"green"
	]).optional(),
	ctaText: z.string().max(100).optional(),
	discountPercentage: z.coerce.number().int().min(1).max(100).optional(),
	imageUrl: z.string().url("Invalid image URL"),
	s3Key: z.string().min(1, "S3 key is required"),
	linkUrl: z.string().refine((val$1) => !val$1 || val$1.startsWith("/") || val$1.startsWith("http://") || val$1.startsWith("https://"), { message: "Link URL must be a relative path (starting with /) or absolute URL (starting with http:// or https://)" }).optional(),
	placement: z.enum([
		"hero_carousel",
		"promotional_card",
		"homepage_middle",
		"sidebar"
	]),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().default(0),
	startsAt: z.string().optional(),
	endsAt: z.string().optional()
});
const adminHeroBannerFormSchema = z.object({
	imageUrl: z.string().url("Invalid image URL"),
	s3Key: z.string().min(1, "S3 key is required"),
	linkUrl: z.string().refine((val$1) => val$1.startsWith("/") || val$1.startsWith("http://") || val$1.startsWith("https://"), { message: "Link URL must be a relative path (starting with /) or absolute URL (starting with http:// or https://)" }),
	altText: z.string().max(200).optional(),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().default(0),
	startsAt: z.string().optional(),
	endsAt: z.string().optional()
});
const adminSideCardFormSchema = z.object({
	titleEn: z.string().min(1, "English title is required").max(200),
	titleBn: z.string().max(200).optional(),
	subtitleEn: z.string().max(300).optional(),
	subtitleBn: z.string().max(300).optional(),
	imageUrl: z.string().url("Invalid image URL"),
	s3Key: z.string().min(1, "S3 key is required"),
	linkUrl: z.string().refine((val$1) => !val$1 || val$1.startsWith("/") || val$1.startsWith("http://") || val$1.startsWith("https://"), { message: "Link URL must be a relative path (starting with /) or absolute URL (starting with http:// or https://)" }).optional(),
	discountPercentage: z.coerce.number().int().min(1).max(100).optional(),
	badgeText: z.string().max(50).optional(),
	badgeColor: z.enum([
		"red",
		"teal",
		"purple",
		"orange",
		"green"
	]).optional(),
	isActive: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).max(2).default(0)
});
const adminBannerReorderSchema = z.object({ banners: z.array(z.object({
	id: z.string().uuid(),
	sortOrder: z.number().int()
})) });
const adminCategoryFormSchema = z.object({
	name: z.string().min(1, "Category name is required").max(200),
	nameBn: z.string().max(200).optional(),
	slug: z.string().min(1, "Slug is required").max(200),
	parentId: z.string().uuid().nullable().optional(),
	iconKey: z.string().max(50).optional(),
	sortOrder: z.coerce.number().int().default(0),
	isFeatured: z.boolean().default(false),
	isPopular: z.boolean().default(false)
});
const adminBrandFormSchema = z.object({
	name: z.string().min(1, "Brand name is required").max(100),
	slug: z.string().min(1, "Slug is required").max(100),
	logoUrl: z.string().url("Invalid logo URL").optional(),
	s3Key: z.string().optional(),
	sortOrder: z.coerce.number().int().default(0),
	isActive: z.boolean().default(true)
});

//#endregion
//#region src/middleware/admin-auth.ts
/**
* Admin Auth Middleware
*
* Verifies the authenticated user is an admin and injects
* adminUserId into the Hono context.
*
* Returns 401 if not authenticated, 403 if not an admin.
*/
const adminAuthMiddleware = createMiddleware(async (c, next) => {
	const user$2 = c.var.user;
	console.log(`[AdminAuth] Checking access for User: ${user$2?.email || "NONE"} (ID: ${user$2?.id || "NONE"})`);
	if (!user$2?.id) {
		console.log("[AdminAuth] No user ID in context, returning 401");
		return c.json({ error: "Unauthorized" }, 401);
	}
	const sessionRoles = user$2.roles;
	const [dbUser] = await db.select({ roles: user.roles }).from(user).where(eq(user.id, user$2.id)).limit(1);
	const effectiveRoles = dbUser?.roles ?? sessionRoles;
	if (hasAnyRole(effectiveRoles, ["admin", "super_admin"])) {
		const isSuperAdmin = hasRole(effectiveRoles, "super_admin");
		console.log(`[AdminAuth] Access GRANTED via roles for ${user$2.email}`);
		c.set("adminUserId", user$2.id);
		c.set("isSuperAdmin", isSuperAdmin);
		await next();
		return;
	}
	const [adminUser] = await db.select({
		id: adminUsers.id,
		userId: adminUsers.userId
	}).from(adminUsers).where(eq(adminUsers.userId, user$2.id)).limit(1);
	if (!adminUser) {
		console.log(`[AdminAuth] User ${user$2.email} (ID: ${user$2.id}) not found in adminUsers table, returning 403`);
		return c.json({ error: "Not an admin user" }, 403);
	}
	await grantRole(user$2.id, "admin");
	console.log(`[AdminAuth] Access GRANTED for Admin ${user$2.email} via legacy table fallback`);
	c.set("adminUserId", user$2.id);
	c.set("isSuperAdmin", false);
	await next();
});

//#endregion
//#region ../../packages/api-types/src/site-settings.ts
const topBarAnnouncementSchema = z.object({
	textEn: z.string().trim().min(1, "English announcement is required").max(180, "Maximum 180 characters"),
	textBn: z.string().trim().max(180, "Maximum 180 characters").nullable(),
	isActive: z.boolean()
});
const adminTopBarAnnouncementUpdateSchema = z.object({
	textEn: z.string().trim().min(1, "English announcement is required").max(180, "Maximum 180 characters"),
	textBn: z.string().trim().max(180, "Maximum 180 characters").optional(),
	isActive: z.boolean().default(true)
});

//#endregion
//#region src/lib/top-bar-announcement.ts
const TOP_BAR_ANNOUNCEMENT_SETTING_KEY = "top_bar_announcement";
const DEFAULT_TOP_BAR_ANNOUNCEMENT = {
	textEn: "Free shipping on orders over ৳1,000",
	textBn: "৳১,০০০+ অর্ডারে ফ্রি শিপিং",
	isActive: true
};
function parseTopBarAnnouncement(value) {
	const parsed = topBarAnnouncementSchema.safeParse(value);
	if (!parsed.success) return DEFAULT_TOP_BAR_ANNOUNCEMENT;
	return {
		textEn: parsed.data.textEn,
		textBn: parsed.data.textBn ? parsed.data.textBn : null,
		isActive: parsed.data.isActive
	};
}

//#endregion
//#region src/routes/admin.ts
function generateSlug(name) {
	return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 200);
}
async function logAdminAction$1(adminUserId, action, entityType, entityId, details) {
	await db.insert(adminAuditLog).values({
		adminUserId,
		action,
		entityType,
		entityId,
		details: details || null
	});
}
function defaultPayoutFeePaisa(paymentMethod) {
	if (paymentMethod === "bank") return 0;
	return 1e3;
}
function getHeroBannerStatus(params) {
	const { isActive, startsAt, endsAt } = params;
	if (!isActive) return "inactive";
	const now = /* @__PURE__ */ new Date();
	if (startsAt && startsAt > now) return "scheduled";
	if (endsAt && endsAt < now) return "inactive";
	return "active";
}
const adminRouter = new Hono().use("*", adminAuthMiddleware).get("/me", describeRoute({
	tags: ["Admin Dashboard"],
	summary: "Get current admin session info",
	description: "Returns info about the currently authenticated admin",
	responses: { 200: {
		description: "Admin session info",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	return c.json({
		user: c.var.user,
		adminUserId: c.var.adminUserId,
		isSuperAdmin: c.var.isSuperAdmin
	}, 200);
}).get("/overview", describeRoute({
	tags: ["Admin Dashboard"],
	summary: "Get admin dashboard overview",
	description: "Returns platform-wide stats, recent orders, and pending counts",
	responses: { 200: {
		description: "Dashboard overview data",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const now = /* @__PURE__ */ new Date();
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
	const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
	const [totalUsersResult, activeVendorsResult, totalOrdersResult, totalRevenueResult, pendingVendorsResult, pendingProductsResult, pendingPayoutVendorsResult, recentOrderRows, thisMonthUsersResult, lastMonthUsersResult, thisMonthVendorsResult, lastMonthVendorsResult, thisMonthOrdersResult, lastMonthOrdersResult, thisMonthRevenueResult, lastMonthRevenueResult] = await Promise.all([
		db.select({ count: sql`count(*)::int` }).from(user),
		db.select({ count: sql`count(*)::int` }).from(vendors).where(eq(vendors.isVerified, true)),
		db.select({ count: sql`count(*)::int` }).from(orders),
		db.select({ total: sql`coalesce(sum(${orders.total}), 0)::int` }).from(orders).where(eq(orders.status, "delivered")),
		db.select({ count: sql`count(*)::int` }).from(vendorApplications).where(eq(vendorApplications.status, "pending")),
		db.select({ count: sql`count(*)::int` }).from(products).where(eq(products.status, "pending")),
		db.select({ vendorId: transactions.vendorId }).from(transactions).where(eq(transactions.status, "cleared")).groupBy(transactions.vendorId).having(sql`COALESCE(SUM(${transactions.amountPaisa}), 0) > 0`),
		db.select({
			id: orders.id,
			orderNumber: orders.orderNumber,
			status: orders.status,
			total: orders.total,
			createdAt: orders.createdAt,
			customerName: user.name,
			vendorName: vendors.name
		}).from(orders).leftJoin(user, eq(orders.userId, user.id)).leftJoin(vendors, eq(orders.vendorId, vendors.id)).orderBy(desc(orders.createdAt)).limit(5),
		db.select({ count: sql`count(*)::int` }).from(user).where(gte(user.createdAt, startOfMonth)),
		db.select({ count: sql`count(*)::int` }).from(user).where(and(gte(user.createdAt, startOfLastMonth), lte(user.createdAt, endOfLastMonth))),
		db.select({ count: sql`count(*)::int` }).from(vendors).where(and(eq(vendors.isVerified, true), gte(vendors.createdAt, startOfMonth))),
		db.select({ count: sql`count(*)::int` }).from(vendors).where(and(eq(vendors.isVerified, true), gte(vendors.createdAt, startOfLastMonth), lte(vendors.createdAt, endOfLastMonth))),
		db.select({ count: sql`count(*)::int` }).from(orders).where(gte(orders.createdAt, startOfMonth)),
		db.select({ count: sql`count(*)::int` }).from(orders).where(and(gte(orders.createdAt, startOfLastMonth), lte(orders.createdAt, endOfLastMonth))),
		db.select({ total: sql`coalesce(sum(${orders.total}), 0)::int` }).from(orders).where(and(eq(orders.status, "delivered"), gte(orders.createdAt, startOfMonth))),
		db.select({ total: sql`coalesce(sum(${orders.total}), 0)::int` }).from(orders).where(and(eq(orders.status, "delivered"), gte(orders.createdAt, startOfLastMonth), lte(orders.createdAt, endOfLastMonth)))
	]);
	const calculateGrowth = (current, previous) => {
		if (previous === 0) return current > 0 ? 100 : 0;
		const raw = (current - previous) / previous * 100;
		if (!Number.isFinite(raw)) return 0;
		return Math.max(-999, Math.min(999, Math.round(raw)));
	};
	const response = {
		totalUsers: totalUsersResult[0]?.count ?? 0,
		activeVendors: activeVendorsResult[0]?.count ?? 0,
		totalOrders: totalOrdersResult[0]?.count ?? 0,
		totalRevenue: totalRevenueResult[0]?.total ?? 0,
		pendingVendors: pendingVendorsResult[0]?.count ?? 0,
		pendingProducts: pendingProductsResult[0]?.count ?? 0,
		pendingPayouts: pendingPayoutVendorsResult.length,
		recentOrders: recentOrderRows.map((row) => ({
			id: row.id,
			orderNumber: row.orderNumber,
			customerName: row.customerName || "Unknown",
			vendorName: row.vendorName || "Unknown",
			status: row.status,
			total: row.total,
			createdAt: row.createdAt.toISOString()
		})),
		monthOverMonth: {
			users: calculateGrowth(thisMonthUsersResult[0]?.count ?? 0, lastMonthUsersResult[0]?.count ?? 0),
			vendors: calculateGrowth(thisMonthVendorsResult[0]?.count ?? 0, lastMonthVendorsResult[0]?.count ?? 0),
			orders: calculateGrowth(thisMonthOrdersResult[0]?.count ?? 0, lastMonthOrdersResult[0]?.count ?? 0),
			revenue: calculateGrowth(thisMonthRevenueResult[0]?.total ?? 0, lastMonthRevenueResult[0]?.total ?? 0)
		}
	};
	return c.json(response, 200);
}).get("/vendors", describeRoute({
	tags: ["Admin - Vendors"],
	summary: "List vendor applications",
	description: "Paginated list of vendor applications with status filters",
	responses: { 200: {
		description: "Vendor applications list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminVendorListQuerySchema), async (c) => {
	const query$1 = c.req.valid("query");
	const offset = (query$1.page - 1) * query$1.limit;
	const conditions = [];
	if (query$1.status !== "all") conditions.push(eq(vendorApplications.status, query$1.status));
	if (query$1.search) conditions.push(sql`(${vendorApplications.shopNameEn} ILIKE ${`%${query$1.search}%`} OR ${vendorApplications.ownerName} ILIKE ${`%${query$1.search}%`} OR ${vendorApplications.email} ILIKE ${`%${query$1.search}%`})`);
	const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
	const [totalResult, items] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(vendorApplications).where(whereClause), db.select({
		id: vendorApplications.id,
		shopNameEn: vendorApplications.shopNameEn,
		shopNameBn: vendorApplications.shopNameBn,
		ownerName: vendorApplications.ownerName,
		email: vendorApplications.email,
		phone: vendorApplications.phone,
		status: vendorApplications.status,
		createdAt: vendorApplications.createdAt,
		reviewedAt: vendorApplications.reviewedAt
	}).from(vendorApplications).where(whereClause).orderBy(desc(vendorApplications.createdAt)).limit(query$1.limit).offset(offset)]);
	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / query$1.limit);
	const response = {
		vendors: items.map((item) => ({
			id: item.id,
			shopNameEn: item.shopNameEn,
			shopNameBn: item.shopNameBn,
			ownerName: item.ownerName,
			email: item.email,
			phone: item.phone,
			status: item.status,
			createdAt: item.createdAt.toISOString(),
			reviewedAt: item.reviewedAt?.toISOString() || null
		})),
		total,
		page: query$1.page,
		limit: query$1.limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/vendors/counts", describeRoute({
	tags: ["Admin - Vendors"],
	summary: "Get vendor application counts",
	description: "Returns count of applications by status",
	responses: { 200: {
		description: "Vendor application counts",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
		db.select({ count: sql`count(*)::int` }).from(vendorApplications).where(eq(vendorApplications.status, "pending")),
		db.select({ count: sql`count(*)::int` }).from(vendorApplications).where(eq(vendorApplications.status, "approved")),
		db.select({ count: sql`count(*)::int` }).from(vendorApplications).where(eq(vendorApplications.status, "rejected"))
	]);
	const response = {
		pending: pendingResult[0]?.count ?? 0,
		approved: approvedResult[0]?.count ?? 0,
		rejected: rejectedResult[0]?.count ?? 0
	};
	return c.json(response, 200);
}).get("/vendors/:applicationId", describeRoute({
	tags: ["Admin - Vendors"],
	summary: "Get vendor application detail",
	description: "Returns full application info including documents",
	responses: {
		200: {
			description: "Vendor application detail",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Application not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const applicationId = c.req.param("applicationId");
	const [application] = await db.select().from(vendorApplications).where(eq(vendorApplications.id, applicationId)).limit(1);
	if (!application) return c.json({ error: "Application not found" }, 404);
	const response = {
		id: application.id,
		userId: application.userId,
		status: application.status,
		shopNameEn: application.shopNameEn,
		shopNameBn: application.shopNameBn,
		ownerName: application.ownerName,
		phone: application.phone,
		email: application.email,
		businessType: application.businessType,
		addressLine1: application.addressLine1,
		addressLine2: application.addressLine2,
		district: application.district,
		city: application.city,
		postalCode: application.postalCode,
		nidNumber: application.nidNumber,
		nidFrontUrl: resolvePrivateFileUrl(application.nidFrontUrl),
		nidBackUrl: resolvePrivateFileUrl(application.nidBackUrl),
		tradeLicenseUrl: application.tradeLicenseUrl ? resolvePrivateFileUrl(application.tradeLicenseUrl) : null,
		shopLogoUrl: application.shopLogoUrl,
		bankName: application.bankName,
		bankAccountNumber: application.bankAccountNumber,
		bankAccountName: application.bankAccountName,
		bkashNumber: application.bkashNumber,
		nagadNumber: application.nagadNumber,
		slug: application.slug,
		reviewNotes: application.reviewNotes,
		reviewedAt: application.reviewedAt?.toISOString() || null,
		reviewedBy: application.reviewedBy,
		vendorId: application.vendorId,
		createdAt: application.createdAt.toISOString(),
		updatedAt: application.updatedAt.toISOString()
	};
	return c.json(response, 200);
}).patch("/vendors/:applicationId/status", describeRoute({
	tags: ["Admin - Vendors"],
	summary: "Update vendor application status",
	description: "Approve or reject a vendor application",
	responses: {
		200: {
			description: "Status updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Application not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminVendorStatusUpdateSchema), async (c) => {
	const applicationId = c.req.param("applicationId");
	const adminUserId = c.var.adminUserId;
	const { status, reviewNotes } = c.req.valid("json");
	const [application] = await db.select().from(vendorApplications).where(eq(vendorApplications.id, applicationId)).limit(1);
	if (!application) return c.json({ error: "Application not found" }, 404);
	if (status === "approved") {
		let vendorId = application.vendorId;
		if (!vendorId) {
			const slug = generateSlug(application.shopNameEn);
			const [newVendor] = await db.insert(vendors).values({
				name: application.shopNameEn,
				slug,
				isVerified: true,
				logoUrl: application.shopLogoUrl
			}).returning({ id: vendors.id });
			if (!newVendor) return c.json({ error: "Failed to create vendor" }, 500);
			vendorId = newVendor.id;
		}
		await db.update(vendorApplications).set({
			status: "approved",
			reviewedAt: /* @__PURE__ */ new Date(),
			reviewedBy: adminUserId,
			reviewNotes: reviewNotes || null,
			vendorId
		}).where(eq(vendorApplications.id, applicationId));
		await grantRole(application.userId, "vendor");
		await logAdminAction$1(adminUserId, "approve_vendor", "vendor_application", applicationId, {
			vendorId,
			reviewNotes
		});
		const [vendorUser] = await db.select({
			email: user.email,
			name: user.name
		}).from(user).where(eq(user.id, application.userId)).limit(1);
		if (vendorUser) notify({
			userId: application.userId,
			type: "vendor_approved",
			title: "Vendor Application Approved",
			titleBn: "বিক্রেতার আবেদন অনুমোদিত",
			body: `Congratulations! Your vendor application for ${application.shopNameEn} has been approved`,
			bodyBn: `অভিনন্দন! ${application.shopNameEn} এর জন্য আপনার বিক্রেতার আবেদন অনুমোদিত হয়েছে`,
			data: {
				applicationId,
				vendorId,
				shopName: application.shopNameEn
			},
			channel: "vendor",
			emailData: {
				userEmail: vendorUser.email,
				userName: application.ownerName,
				shopName: application.shopNameEn
			}
		}).catch((error$1) => {
			console.error(`[ADMIN] Failed to send vendor approval notification:`, error$1);
		});
	} else {
		await db.update(vendorApplications).set({
			status: "rejected",
			reviewedAt: /* @__PURE__ */ new Date(),
			reviewedBy: adminUserId,
			reviewNotes: reviewNotes || null
		}).where(eq(vendorApplications.id, applicationId));
		try {
			await revokeRole(application.userId, "vendor");
		} catch (error$1) {
			console.error("[ADMIN] Failed to revoke vendor role:", error$1);
		}
		await logAdminAction$1(adminUserId, "reject_vendor", "vendor_application", applicationId, { reviewNotes });
	}
	return c.json({ message: "Status updated successfully" }, 200);
}).get("/products", describeRoute({
	tags: ["Admin - Products"],
	summary: "List products for moderation",
	description: "Cross-vendor paginated product list with filters",
	responses: { 200: {
		description: "Products list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminProductListQuerySchema), async (c) => {
	const query$1 = c.req.valid("query");
	const offset = (query$1.page - 1) * query$1.limit;
	const conditions = [];
	if (query$1.status !== "all") conditions.push(eq(products.status, query$1.status));
	if (query$1.vendorId) conditions.push(eq(products.vendorId, query$1.vendorId));
	if (query$1.search) conditions.push(ilike(products.title, `%${query$1.search}%`));
	const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
	const [totalResult, items] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(products).where(whereClause), db.select({
		id: products.id,
		title: products.title,
		titleBn: products.titleBn,
		slug: products.slug,
		status: products.status,
		pendingReason: products.pendingReason,
		submittedAt: products.submittedAt,
		isActive: products.isActive,
		createdAt: products.createdAt,
		updatedAt: products.updatedAt,
		vendorId: vendors.id,
		vendorName: vendors.name,
		categoryId: categories.id,
		categoryName: categories.name,
		minPrice: sql`(
							SELECT COALESCE(MIN(${productSkus.priceAmount}), 0)
							FROM ${productSkus}
							WHERE ${productSkus.productId} = ${products.id}
						)`,
		imageUrl: sql`(
							SELECT ${productImages.s3Key}
							FROM ${productImages}
							WHERE ${productImages.productId} = ${products.id}
							AND ${productImages.isPrimary} = true
							LIMIT 1
						)`
	}).from(products).leftJoin(vendors, eq(products.vendorId, vendors.id)).leftJoin(categories, eq(products.categoryId, categories.id)).where(whereClause).orderBy(query$1.sort === "newest" ? desc(products.createdAt) : asc(products.createdAt)).limit(query$1.limit).offset(offset)]);
	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / query$1.limit);
	const response = {
		products: items.map((item) => ({
			id: item.id,
			title: item.title,
			titleBn: item.titleBn,
			slug: item.slug,
			status: item.status,
			imageUrl: item.imageUrl ? getS3Url(item.imageUrl) : null,
			vendorName: item.vendorName || "Unknown",
			vendorId: item.vendorId || "",
			categoryName: item.categoryName || "Uncategorized",
			priceAmount: item.minPrice,
			isActive: item.isActive ?? true,
			createdAt: item.createdAt.toISOString(),
			updatedAt: item.updatedAt.toISOString(),
			submittedAt: item.submittedAt?.toISOString() ?? null,
			pendingReason: item.pendingReason ?? null,
			hasVendorUpdate: item.pendingReason === "vendor_update"
		})),
		total,
		page: query$1.page,
		limit: query$1.limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/products/counts", describeRoute({
	tags: ["Admin - Products"],
	summary: "Get product counts",
	description: "Returns count of products by status",
	responses: { 200: {
		description: "Product counts",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
		db.select({ count: sql`count(*)::int` }).from(products).where(eq(products.status, "pending")),
		db.select({ count: sql`count(*)::int` }).from(products).where(eq(products.status, "approved")),
		db.select({ count: sql`count(*)::int` }).from(products).where(eq(products.status, "rejected"))
	]);
	const response = {
		pending: pendingResult[0]?.count ?? 0,
		approved: approvedResult[0]?.count ?? 0,
		rejected: rejectedResult[0]?.count ?? 0
	};
	return c.json(response, 200);
}).get("/products/:productId", describeRoute({
	tags: ["Admin - Products"],
	summary: "Get product detail",
	description: "Returns full product info including vendor, images, SKUs",
	responses: {
		200: {
			description: "Product detail",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const productId = c.req.param("productId");
	const [productRow] = await db.select({
		id: products.id,
		title: products.title,
		titleBn: products.titleBn,
		slug: products.slug,
		categoryId: categories.id,
		categoryName: categories.name,
		brand: products.brand,
		shortDescription: products.shortDescription,
		shortDescriptionBn: products.shortDescriptionBn,
		description: products.description,
		descriptionBn: products.descriptionBn,
		ageRange: products.ageRange,
		ageRangeMin: products.ageRangeMin,
		ageRangeMax: products.ageRangeMax,
		isBpaFree: products.isBpaFree,
		isOrganic: products.isOrganic,
		isHypoallergenic: products.isHypoallergenic,
		hasSmallParts: products.hasSmallParts,
		safetyWarningEn: products.safetyWarningEn,
		safetyWarningBn: products.safetyWarningBn,
		safetyCertifications: products.safetyCertifications,
		weightLimitKg: products.weightLimitKg,
		expiryDate: products.expiryDate,
		status: products.status,
		pendingReason: products.pendingReason,
		submittedAt: products.submittedAt,
		reviewNotes: products.reviewNotes,
		lastReviewedAt: products.lastReviewedAt,
		lastReviewedBy: products.lastReviewedBy,
		isActive: products.isActive,
		vendorId: vendors.id,
		vendorName: vendors.name,
		createdAt: products.createdAt,
		updatedAt: products.updatedAt
	}).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).leftJoin(vendors, eq(products.vendorId, vendors.id)).where(eq(products.id, productId)).limit(1);
	if (!productRow) return c.json({ error: "Product not found" }, 404);
	const [imageRows, optionRows, skuRows] = await Promise.all([
		db.select().from(productImages).where(eq(productImages.productId, productId)).orderBy(asc(productImages.sortOrder)),
		db.select().from(productOptions).where(eq(productOptions.productId, productId)).orderBy(asc(productOptions.sortOrder)),
		db.select().from(productSkus).where(eq(productSkus.productId, productId))
	]);
	const response = {
		id: productRow.id,
		title: productRow.title,
		titleBn: productRow.titleBn,
		slug: productRow.slug,
		categoryId: productRow.categoryId || "",
		categoryName: productRow.categoryName || "Uncategorized",
		brand: productRow.brand,
		shortDescription: productRow.shortDescription,
		shortDescriptionBn: productRow.shortDescriptionBn,
		description: productRow.description,
		descriptionBn: productRow.descriptionBn,
		ageRange: productRow.ageRange,
		ageRangeMin: productRow.ageRangeMin,
		ageRangeMax: productRow.ageRangeMax,
		isBpaFree: productRow.isBpaFree,
		isOrganic: productRow.isOrganic,
		isHypoallergenic: productRow.isHypoallergenic,
		hasSmallParts: productRow.hasSmallParts,
		safetyWarningEn: productRow.safetyWarningEn,
		safetyWarningBn: productRow.safetyWarningBn,
		safetyCertifications: productRow.safetyCertifications,
		weightLimitKg: productRow.weightLimitKg,
		expiryDate: productRow.expiryDate?.toISOString() || null,
		status: productRow.status,
		isActive: productRow.isActive ?? true,
		submittedAt: productRow.submittedAt?.toISOString() ?? null,
		pendingReason: productRow.pendingReason ?? null,
		hasVendorUpdate: productRow.pendingReason === "vendor_update",
		reviewNotes: productRow.reviewNotes ?? null,
		lastReviewedAt: productRow.lastReviewedAt?.toISOString() ?? null,
		lastReviewedBy: productRow.lastReviewedBy ?? null,
		vendorId: productRow.vendorId || "",
		vendorName: productRow.vendorName || "Unknown",
		images: imageRows.map((img) => ({
			id: img.id,
			s3Key: img.s3Key,
			variant: img.variant,
			isPrimary: img.isPrimary ?? false,
			sortOrder: img.sortOrder
		})),
		options: optionRows.map((opt) => ({
			id: opt.id,
			name: opt.name,
			nameBn: opt.nameBn,
			values: opt.values,
			valuesBn: opt.valuesBn,
			sortOrder: opt.sortOrder
		})),
		skus: skuRows.map((sku) => ({
			id: sku.id,
			sku: sku.sku,
			optionValues: sku.optionValues,
			priceAmount: sku.priceAmount,
			compareAtAmount: sku.compareAtAmount,
			stockQty: sku.stockQty,
			isAvailable: sku.isAvailable
		})),
		createdAt: productRow.createdAt.toISOString(),
		updatedAt: productRow.updatedAt.toISOString()
	};
	return c.json(response, 200);
}).patch("/products/:productId/status", describeRoute({
	tags: ["Admin - Products"],
	summary: "Update product status",
	description: "Approve or reject a product",
	responses: {
		200: {
			description: "Status updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminProductStatusUpdateSchema), async (c) => {
	const productId = c.req.param("productId");
	const adminUserId = c.var.adminUserId;
	const { status, reviewNotes } = c.req.valid("json");
	const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
	if (!product) return c.json({ error: "Product not found" }, 404);
	await db.update(products).set({
		status,
		pendingReason: null,
		lastReviewedAt: /* @__PURE__ */ new Date(),
		lastReviewedBy: adminUserId,
		reviewNotes: reviewNotes || null
	}).where(eq(products.id, productId));
	await logAdminAction$1(adminUserId, status === "approved" ? "approve_product" : "reject_product", "product", productId, { reviewNotes });
	const [vendorApp] = await db.select({ userId: vendorApplications.userId }).from(vendorApplications).where(eq(vendorApplications.vendorId, product.vendorId)).limit(1);
	if (vendorApp) {
		const [vendorUser] = await db.select({
			email: user.email,
			name: user.name
		}).from(user).where(eq(user.id, vendorApp.userId)).limit(1);
		if (vendorUser) if (status === "approved") notify({
			userId: vendorApp.userId,
			type: "product_approved",
			title: "Product Approved",
			titleBn: "পণ্য অনুমোদিত",
			body: `Your product "${product.title}" has been approved`,
			bodyBn: `আপনার পণ্য "${product.title}" অনুমোদিত হয়েছে`,
			data: {
				productId,
				productTitle: product.title
			},
			channel: "vendor",
			emailData: {
				userEmail: vendorUser.email,
				userName: vendorUser.name,
				productTitle: product.title
			}
		}).catch((error$1) => {
			console.error(`[ADMIN] Failed to send product approval notification:`, error$1);
		});
		else notify({
			userId: vendorApp.userId,
			type: "product_rejected",
			title: "Product Needs Changes",
			titleBn: "পণ্যে পরিবর্তন প্রয়োজন",
			body: `Your product "${product.title}" requires changes`,
			bodyBn: `আপনার পণ্য "${product.title}" পরিবর্তন প্রয়োজন`,
			data: {
				productId,
				productTitle: product.title,
				reviewNotes: reviewNotes || null
			},
			channel: "vendor",
			emailData: {
				userEmail: vendorUser.email,
				userName: vendorUser.name,
				productTitle: product.title,
				reviewNotes: reviewNotes || ""
			}
		}).catch((error$1) => {
			console.error(`[ADMIN] Failed to send product rejection notification:`, error$1);
		});
	}
	return c.json({ message: "Status updated successfully" }, 200);
}).patch("/products/:productId/active", describeRoute({
	tags: ["Admin - Products"],
	summary: "Update product active state",
	description: "Force activate or deactivate a product",
	responses: {
		200: {
			description: "Active state updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Product not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminProductActiveUpdateSchema), async (c) => {
	const productId = c.req.param("productId");
	const adminUserId = c.var.adminUserId;
	const { isActive, reason } = c.req.valid("json");
	const [product] = await db.select({ id: products.id }).from(products).where(eq(products.id, productId)).limit(1);
	if (!product) return c.json({ error: "Product not found" }, 404);
	await db.update(products).set({ isActive }).where(eq(products.id, productId));
	await logAdminAction$1(adminUserId, isActive ? "reactivate_product" : "deactivate_product", "product", productId, { reason: reason || null });
	return c.json({
		message: isActive ? "Product reactivated successfully" : "Product deactivated successfully",
		id: productId,
		isActive
	}, 200);
}).get("/orders", describeRoute({
	tags: ["Admin - Orders"],
	summary: "List all orders",
	description: "Cross-vendor paginated order list with filters",
	responses: { 200: {
		description: "Orders list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminOrderListQuerySchema), async (c) => {
	const query$1 = c.req.valid("query");
	const offset = (query$1.page - 1) * query$1.limit;
	const conditions = [];
	if (query$1.status !== "all") conditions.push(eq(orders.status, query$1.status));
	if (query$1.search) conditions.push(sql`(${orders.orderNumber} ILIKE ${`%${query$1.search}%`} OR ${user.name} ILIKE ${`%${query$1.search}%`})`);
	if (query$1.dateFrom) conditions.push(gte(orders.createdAt, new Date(query$1.dateFrom)));
	if (query$1.dateTo) conditions.push(lte(orders.createdAt, new Date(query$1.dateTo)));
	const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
	const [totalResult, items] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(orders).where(whereClause), db.select({
		id: orders.id,
		orderNumber: orders.orderNumber,
		status: orders.status,
		total: orders.total,
		createdAt: orders.createdAt,
		customerName: user.name,
		vendorName: vendors.name,
		itemCount: sql`(
							SELECT COUNT(*)::int
							FROM "order_items"
							WHERE "order_items"."order_id" = "orders"."id"
						)`
	}).from(orders).leftJoin(user, eq(orders.userId, user.id)).leftJoin(vendors, eq(orders.vendorId, vendors.id)).where(whereClause).orderBy(query$1.sort === "newest" ? desc(orders.createdAt) : asc(orders.createdAt)).limit(query$1.limit).offset(offset)]);
	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / query$1.limit);
	const response = {
		orders: items.map((item) => ({
			id: item.id,
			orderNumber: item.orderNumber,
			customerName: item.customerName || "Unknown",
			vendorName: item.vendorName || "Unknown",
			status: item.status,
			total: item.total,
			itemCount: item.itemCount,
			createdAt: item.createdAt.toISOString()
		})),
		total,
		page: query$1.page,
		limit: query$1.limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/orders/:orderId", describeRoute({
	tags: ["Admin - Orders"],
	summary: "Get order detail",
	description: "Returns full order info including items and addresses",
	responses: {
		200: {
			description: "Order detail",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		404: {
			description: "Order not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const orderId = c.req.param("orderId");
	const [orderRow] = await db.select({
		id: orders.id,
		orderNumber: orders.orderNumber,
		status: orders.status,
		paymentMethod: orders.paymentMethod,
		subtotal: orders.subtotal,
		shippingCost: orders.shippingCost,
		codFee: orders.codFee,
		total: orders.total,
		customerNotes: orders.customerNotes,
		trackingNumber: orders.trackingNumber,
		trackingCarrier: orders.trackingCarrier,
		courierName: orders.courierName,
		courierOrderRef: orders.courierOrderRef,
		actualCourierCostPaisa: orders.actualCourierCostPaisa,
		returnFeePaisa: orders.returnFeePaisa,
		commissionRateSnapshot: orders.commissionRateSnapshot,
		commissionAmountPaisa: orders.commissionAmountPaisa,
		vendorNetPaisa: orders.vendorNetPaisa,
		shippingAddress: orders.shippingAddress,
		userId: user.id,
		customerName: user.name,
		customerEmail: user.email,
		vendorId: vendors.id,
		vendorName: vendors.name,
		createdAt: orders.createdAt,
		confirmedAt: orders.confirmedAt,
		processingAt: orders.processingAt,
		shippedAt: orders.shippedAt,
		deliveredAt: orders.deliveredAt,
		paidToAdminAt: orders.paidToAdminAt,
		completedAt: orders.completedAt,
		returnedAt: orders.returnedAt,
		cancelledAt: orders.cancelledAt
	}).from(orders).leftJoin(user, eq(orders.userId, user.id)).leftJoin(vendors, eq(orders.vendorId, vendors.id)).where(eq(orders.id, orderId)).limit(1);
	if (!orderRow) return c.json({ error: "Order not found" }, 404);
	const items = await db.select({
		id: orderItems.id,
		productId: orderItems.productId,
		quantity: orderItems.quantity,
		unitPrice: orderItems.unitPrice,
		lineTotal: orderItems.lineTotal,
		productSnapshot: orderItems.productSnapshot
	}).from(orderItems).where(eq(orderItems.orderId, orderId));
	const calculatedSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
	const effectiveSubtotal = calculatedSubtotal > 0 ? calculatedSubtotal : orderRow.subtotal;
	const shippingAddr = orderRow.shippingAddress;
	const response = {
		id: orderRow.id,
		orderNumber: orderRow.orderNumber,
		status: orderRow.status,
		paymentMethod: orderRow.paymentMethod,
		subtotal: effectiveSubtotal,
		shippingCost: orderRow.shippingCost,
		codFee: orderRow.codFee,
		total: orderRow.total,
		customerNotes: orderRow.customerNotes,
		trackingNumber: orderRow.trackingNumber,
		trackingCarrier: orderRow.trackingCarrier,
		courierName: orderRow.courierName,
		courierOrderRef: orderRow.courierOrderRef,
		actualCourierCostPaisa: orderRow.actualCourierCostPaisa,
		returnFeePaisa: orderRow.returnFeePaisa,
		commissionRateSnapshot: orderRow.commissionRateSnapshot,
		commissionAmountPaisa: orderRow.commissionAmountPaisa,
		vendorNetPaisa: orderRow.vendorNetPaisa,
		userId: orderRow.userId || "",
		customerName: orderRow.customerName || "Unknown",
		customerEmail: orderRow.customerEmail || "",
		vendorId: orderRow.vendorId || "",
		vendorName: orderRow.vendorName || "Unknown",
		shippingAddress: {
			fullName: shippingAddr.fullName,
			phone: shippingAddr.phone,
			alternatePhone: shippingAddr.alternatePhone,
			addressLine1: shippingAddr.addressLine1,
			addressLine2: shippingAddr.addressLine2,
			city: shippingAddr.city,
			district: shippingAddr.district,
			postalCode: shippingAddr.postalCode,
			deliveryInstructions: shippingAddr.deliveryInstructions
		},
		items: items.map((item) => {
			const snapshot = item.productSnapshot;
			return {
				id: item.id,
				productId: item.productId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				lineTotal: item.lineTotal,
				productSnapshot: {
					title: snapshot.title,
					titleBn: snapshot.titleBn,
					slug: snapshot.slug,
					image: snapshot.image,
					selectedOptions: snapshot.selectedOptions ?? null,
					skuCode: snapshot.skuCode ?? null
				}
			};
		}),
		createdAt: orderRow.createdAt.toISOString(),
		confirmedAt: orderRow.confirmedAt?.toISOString() || null,
		processingAt: orderRow.processingAt?.toISOString() || null,
		shippedAt: orderRow.shippedAt?.toISOString() || null,
		deliveredAt: orderRow.deliveredAt?.toISOString() || null,
		paidToAdminAt: orderRow.paidToAdminAt?.toISOString() || null,
		completedAt: orderRow.completedAt?.toISOString() || null,
		returnedAt: orderRow.returnedAt?.toISOString() || null,
		cancelledAt: orderRow.cancelledAt?.toISOString() || null
	};
	return c.json(response, 200);
}).patch("/orders/:orderId/reconcile-courier-cash", describeRoute({
	tags: ["Admin - Orders"],
	summary: "Reconcile courier COD cash for an order",
	description: "Marks a delivered order as paid_to_admin and creates pending ledger entries.",
	responses: { 200: {
		description: "Order reconciled successfully",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("param", z.object({ orderId: z.string().uuid() })), zValidator("json", adminOrderReconcileSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const { orderId } = c.req.valid("param");
	const input = c.req.valid("json");
	const [orderRow] = await db.select({
		id: orders.id,
		orderNumber: orders.orderNumber,
		status: orders.status,
		vendorId: orders.vendorId,
		total: orders.total,
		shippingCost: orders.shippingCost,
		paidToAdminAt: orders.paidToAdminAt
	}).from(orders).where(eq(orders.id, orderId)).limit(1);
	if (!orderRow) return c.json({ error: "Order not found" }, 404);
	if (orderRow.status !== "delivered") return c.json({ error: "Only delivered orders can be reconciled" }, 400);
	if (orderRow.paidToAdminAt) return c.json({ error: "Order already reconciled" }, 400);
	const [vendorRow] = await db.select({ commissionRate: vendors.commissionRate }).from(vendors).where(eq(vendors.id, orderRow.vendorId)).limit(1);
	const commissionRatePercent = vendorRow?.commissionRate ?? 12;
	const commissionRateSnapshot = Math.round(commissionRatePercent * 100);
	const commissionBaseAmount = orderRow.total;
	const commissionAmount = Math.round(commissionBaseAmount * commissionRateSnapshot / 1e4);
	const effectiveCourierCost = input.actualCourierCostPaisa;
	const rawReturnFee = input.returnFeePaisa ?? 0;
	const deliveryDeduction = effectiveCourierCost;
	const returnFeeDeduction = input.deductReturnFeeFromVendor ? rawReturnFee : 0;
	const vendorNet = commissionBaseAmount - commissionAmount - deliveryDeduction - returnFeeDeduction;
	if (vendorNet < 0) return c.json({
		error: "Vendor net would be negative. Reduce vendor deductions or process manual adjustment.",
		vendorNetPaisa: vendorNet
	}, 400);
	const now = /* @__PURE__ */ new Date();
	await db.transaction(async (tx) => {
		await tx.update(orders).set({
			status: "paid_to_admin",
			paidToAdminAt: now,
			courierName: input.courierName || null,
			courierOrderRef: input.courierOrderRef || null,
			commissionRateSnapshot,
			commissionAmountPaisa: commissionAmount,
			vendorNetPaisa: vendorNet,
			actualCourierCostPaisa: input.actualCourierCostPaisa,
			returnFeePaisa: returnFeeDeduction,
			settlementNotes: input.notes || null
		}).where(eq(orders.id, orderId));
		const ledgerRows = [{
			vendorId: orderRow.vendorId,
			orderId: orderRow.id,
			type: "sale",
			amountPaisa: commissionBaseAmount,
			status: "pending",
			description: `Order ${orderRow.orderNumber} gross credit`,
			referenceType: "order",
			referenceId: orderRow.orderNumber,
			meta: {
				commissionRateSnapshot,
				commissionBasePaisa: commissionBaseAmount
			}
		}, {
			vendorId: orderRow.vendorId,
			orderId: orderRow.id,
			type: "commission_deduction",
			amountPaisa: -commissionAmount,
			status: "pending",
			description: `Platform commission for order ${orderRow.orderNumber}`,
			referenceType: "order",
			referenceId: orderRow.orderNumber
		}];
		if (deliveryDeduction > 0) ledgerRows.push({
			vendorId: orderRow.vendorId,
			orderId: orderRow.id,
			type: "delivery_charge",
			amountPaisa: -deliveryDeduction,
			status: "pending",
			description: `Courier delivery cost for order ${orderRow.orderNumber}`,
			referenceType: "order",
			referenceId: orderRow.orderNumber,
			meta: {
				estimatedShippingCostPaisa: orderRow.shippingCost,
				actualCourierCostPaisa: input.actualCourierCostPaisa,
				deductedFromVendor: true
			}
		});
		if (returnFeeDeduction > 0) ledgerRows.push({
			vendorId: orderRow.vendorId,
			orderId: orderRow.id,
			type: "return_fee",
			amountPaisa: -returnFeeDeduction,
			status: "pending",
			description: `Return fee for order ${orderRow.orderNumber}`,
			referenceType: "order",
			referenceId: orderRow.orderNumber
		});
		await tx.insert(transactions).values(ledgerRows);
	});
	await logAdminAction$1(adminUserId, "reconcile_courier_cash", "order", orderId, {
		commissionRateSnapshot,
		commissionAmount,
		effectiveCourierCost,
		rawReturnFee,
		deliveryPassThroughApplied: true,
		deductReturnFeeFromVendor: input.deductReturnFeeFromVendor,
		deliveryDeduction,
		returnFeeDeduction,
		vendorNet,
		courierName: input.courierName || null,
		courierOrderRef: input.courierOrderRef || null
	});
	return c.json({
		message: "Order reconciled successfully",
		orderId,
		vendorNetPaisa: vendorNet,
		commissionAmountPaisa: commissionAmount,
		deliveryCostPaisa: deliveryDeduction,
		returnFeePaisa: returnFeeDeduction
	}, 200);
}).post("/settlement/clear-matured", describeRoute({
	tags: ["Admin - Payouts"],
	summary: "Clear matured pending ledger entries",
	description: "Moves pending transactions to cleared after maturity window and marks paid_to_admin orders as completed.",
	responses: { 200: {
		description: "Settlement clearing result",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("json", adminSettlementClearSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const { maturityDays } = c.req.valid("json");
	const now = /* @__PURE__ */ new Date();
	const threshold = /* @__PURE__ */ new Date(now.getTime() - maturityDays * 24 * 60 * 60 * 1e3);
	const [clearedRows, completedOrders] = await db.transaction(async (tx) => {
		return [await tx.update(transactions).set({
			status: "cleared",
			updatedAt: now
		}).where(and(eq(transactions.status, "pending"), lte(transactions.createdAt, threshold), inArray(transactions.type, [
			"sale",
			"commission_deduction",
			"delivery_charge",
			"return_fee",
			"adjustment"
		]))).returning({ id: transactions.id }), await tx.update(orders).set({
			status: "completed",
			completedAt: now
		}).where(and(eq(orders.status, "paid_to_admin"), lte(orders.paidToAdminAt, threshold))).returning({ id: orders.id })];
	});
	await logAdminAction$1(adminUserId, "clear_matured_settlement", "ledger", "system", {
		maturityDays,
		threshold: threshold.toISOString(),
		clearedTransactions: clearedRows.length,
		completedOrders: completedOrders.length
	});
	return c.json({
		message: "Settlement clearing finished",
		clearedTransactions: clearedRows.length,
		completedOrders: completedOrders.length,
		threshold: threshold.toISOString()
	}, 200);
}).get("/users", describeRoute({
	tags: ["Admin - Users"],
	summary: "List users",
	description: "Paginated user list with order counts and total spent",
	responses: { 200: {
		description: "Users list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminUserListQuerySchema), async (c) => {
	const query$1 = c.req.valid("query");
	const offset = (query$1.page - 1) * query$1.limit;
	const conditions = [isNull(user.deletedAt)];
	if (query$1.search) conditions.push(sql`(${user.name} ILIKE ${`%${query$1.search}%`} OR ${user.email} ILIKE ${`%${query$1.search}%`})`);
	const whereClause = and(...conditions);
	const [totalResult, items] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(user).where(whereClause), db.select({
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		image: user.image,
		createdAt: user.createdAt,
		orderCount: sql`(
							SELECT COUNT(*)::int
							FROM "orders"
							WHERE "orders"."user_id" = "user"."id"
						)`,
		totalSpent: sql`(
							SELECT COALESCE(SUM("orders"."total"), 0)::int
							FROM "orders"
							WHERE "orders"."user_id" = "user"."id"
							AND "orders"."status" = 'delivered'
						)`
	}).from(user).where(whereClause).orderBy(desc(user.createdAt)).limit(query$1.limit).offset(offset)]);
	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / query$1.limit);
	const response = {
		users: items.map((item) => ({
			id: item.id,
			name: item.name,
			email: item.email,
			emailVerified: item.emailVerified,
			image: item.image,
			orderCount: item.orderCount,
			totalSpent: item.totalSpent,
			createdAt: item.createdAt.toISOString()
		})),
		total,
		page: query$1.page,
		limit: query$1.limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/payouts/pending", describeRoute({
	tags: ["Admin - Payouts"],
	summary: "Get pending payouts",
	description: "Returns list of vendors with pending payouts",
	responses: { 200: {
		description: "Pending payouts list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const [ledgerBalances, paymentMethods, orderCounts, payoutHistory, vendorRows] = await Promise.all([
		db.select({
			vendorId: transactions.vendorId,
			availableAmount: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
			pendingBalance: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`
		}).from(transactions).groupBy(transactions.vendorId),
		db.select({
			vendorId: vendorApplications.vendorId,
			bankAccountNumber: vendorApplications.bankAccountNumber,
			bkashNumber: vendorApplications.bkashNumber,
			nagadNumber: vendorApplications.nagadNumber
		}).from(vendorApplications).where(eq(vendorApplications.status, "approved")),
		db.select({
			vendorId: orders.vendorId,
			orderCount: sql`count(*)::int`
		}).from(orders).where(inArray(orders.status, [
			"paid_to_admin",
			"completed",
			"returned"
		])).groupBy(orders.vendorId),
		db.select({
			vendorId: vendorPayouts.vendorId,
			amountPaisa: vendorPayouts.amountPaisa,
			processedAt: vendorPayouts.processedAt
		}).from(vendorPayouts).where(eq(vendorPayouts.status, "completed")).orderBy(desc(vendorPayouts.processedAt)),
		db.select({
			vendorId: vendors.id,
			vendorName: vendors.name,
			vendorSlug: vendors.slug
		}).from(vendors)
	]);
	const lastPayoutByVendor = /* @__PURE__ */ new Map();
	for (const row of payoutHistory) if (!lastPayoutByVendor.has(row.vendorId)) lastPayoutByVendor.set(row.vendorId, {
		amountPaisa: row.amountPaisa,
		processedAt: row.processedAt
	});
	const orderCountByVendor = new Map(orderCounts.map((row) => [row.vendorId, row.orderCount]));
	const vendorInfoById = new Map(vendorRows.map((row) => [row.vendorId, row]));
	const response = ledgerBalances.map((vendorBalance) => {
		const vendor = vendorInfoById.get(vendorBalance.vendorId);
		if (!vendor) return null;
		const paymentMethod = paymentMethods.find((pm) => pm.vendorId === vendorBalance.vendorId);
		let primaryMethod = "bank";
		if (paymentMethod?.bkashNumber) primaryMethod = "bkash";
		else if (paymentMethod?.nagadNumber) primaryMethod = "nagad";
		const lastPayout = lastPayoutByVendor.get(vendorBalance.vendorId);
		return {
			vendorId: vendorBalance.vendorId,
			vendorName: vendor.vendorName,
			vendorSlug: vendor.vendorSlug,
			orderCount: orderCountByVendor.get(vendorBalance.vendorId) ?? 0,
			pendingAmount: vendorBalance.availableAmount + vendorBalance.pendingBalance,
			availableAmount: vendorBalance.availableAmount,
			pendingBalance: vendorBalance.pendingBalance,
			paymentMethod: primaryMethod,
			bankAccountNumber: paymentMethod?.bankAccountNumber || null,
			bkashNumber: paymentMethod?.bkashNumber || null,
			nagadNumber: paymentMethod?.nagadNumber || null,
			lastPayoutDate: lastPayout?.processedAt?.toISOString() || null,
			lastPayoutAmount: lastPayout?.amountPaisa ?? null
		};
	}).filter((row) => row !== null).filter((row) => row.availableAmount !== 0 || row.pendingBalance !== 0);
	return c.json(response, 200);
}).get("/vendors/:vendorId/wallet-summary", describeRoute({
	tags: ["Admin - Payouts"],
	summary: "Get vendor wallet summary",
	description: "Returns cached pending/available balances and commission.",
	responses: { 200: {
		description: "Wallet summary",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("param", z.object({ vendorId: z.string().uuid() })), async (c) => {
	const { vendorId } = c.req.valid("param");
	const [vendorRows, ledgerBalance] = await Promise.all([db.select({
		vendorId: vendors.id,
		commissionRatePercent: vendors.commissionRate
	}).from(vendors).where(eq(vendors.id, vendorId)).limit(1), db.select({
		availableBalancePaisa: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`,
		pendingBalancePaisa: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'pending' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int`
	}).from(transactions).where(eq(transactions.vendorId, vendorId)).limit(1)]);
	const vendorRow = vendorRows[0];
	if (!vendorRow) return c.json({ error: "Vendor not found" }, 404);
	const response = {
		vendorId: vendorRow.vendorId,
		availableBalancePaisa: ledgerBalance[0]?.availableBalancePaisa ?? 0,
		pendingBalancePaisa: ledgerBalance[0]?.pendingBalancePaisa ?? 0,
		computedPayablePaisa: ledgerBalance[0]?.availableBalancePaisa ?? 0,
		commissionRatePercent: vendorRow.commissionRatePercent ?? 12
	};
	return c.json(response, 200);
}).post("/payouts", describeRoute({
	tags: ["Admin - Payouts"],
	summary: "Process payout",
	description: "Create a completed payout record for a vendor",
	responses: { 200: {
		description: "Payout processed successfully",
		content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
	} }
}), zValidator("json", adminPayoutProcessSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const [vendorRow, availableBalanceResult] = await Promise.all([db.select({ id: vendors.id }).from(vendors).where(eq(vendors.id, input.vendorId)).limit(1), db.select({ availableBalancePaisa: sql`COALESCE(SUM(CASE WHEN ${transactions.status} = 'cleared' THEN ${transactions.amountPaisa} ELSE 0 END), 0)::int` }).from(transactions).where(eq(transactions.vendorId, input.vendorId)).limit(1)]);
	if (!vendorRow) return c.json({ error: "Vendor not found" }, 404);
	const availableBalancePaisa = availableBalanceResult[0]?.availableBalancePaisa ?? 0;
	const payoutFeePaisa = input.payoutFeePaisa ?? defaultPayoutFeePaisa(input.paymentMethod);
	const computedAmountPaisa = Math.max(availableBalancePaisa - payoutFeePaisa, 0);
	const totalDebit = computedAmountPaisa + payoutFeePaisa;
	if (computedAmountPaisa <= 0) return c.json({ error: "No payable balance available for payout" }, 400);
	if (totalDebit > availableBalancePaisa) return c.json({ error: "Insufficient available balance after including payout processing fee" }, 400);
	const periodStart = input.periodStart ? new Date(input.periodStart) : /* @__PURE__ */ new Date();
	const periodEnd = input.periodEnd ? new Date(input.periodEnd) : /* @__PURE__ */ new Date();
	const processedAt = /* @__PURE__ */ new Date();
	const [payoutRecord] = await db.transaction(async (tx) => {
		const [createdPayout] = await tx.insert(vendorPayouts).values({
			vendorId: input.vendorId,
			amountPaisa: computedAmountPaisa,
			payoutFeePaisa,
			periodStart,
			periodEnd,
			paymentMethod: input.paymentMethod,
			paymentReference: input.paymentReference,
			status: "completed",
			processedAt,
			processedBy: adminUserId,
			notes: input.notes || null
		}).returning({ id: vendorPayouts.id });
		if (!createdPayout) throw new Error("Failed to create payout record");
		const ledgerRows = [{
			vendorId: input.vendorId,
			payoutId: createdPayout.id,
			type: "payout",
			amountPaisa: -computedAmountPaisa,
			status: "cleared",
			description: "Vendor payout",
			referenceType: "payout",
			referenceId: createdPayout.id
		}];
		if (payoutFeePaisa > 0) ledgerRows.push({
			vendorId: input.vendorId,
			payoutId: createdPayout.id,
			type: "payout_fee",
			amountPaisa: -payoutFeePaisa,
			status: "cleared",
			description: "Payout processing fee",
			referenceType: "payout",
			referenceId: createdPayout.id
		});
		await tx.insert(transactions).values(ledgerRows);
		return [createdPayout];
	});
	if (!payoutRecord) return c.json({ error: "Failed to create payout record" }, 500);
	await logAdminAction$1(adminUserId, "process_payout", "vendor_payout", payoutRecord.id, {
		vendorId: input.vendorId,
		amountPaisa: computedAmountPaisa,
		payoutFeePaisa,
		totalDebit,
		paymentMethod: input.paymentMethod,
		paymentReference: input.paymentReference
	});
	return c.json({
		message: "Payout processed successfully",
		amountPaisa: computedAmountPaisa,
		payoutFeePaisa,
		totalDebitPaisa: totalDebit
	}, 200);
}).get("/payouts/history", describeRoute({
	tags: ["Admin - Payouts"],
	summary: "Get payout history",
	description: "Returns paginated list of completed payouts",
	responses: { 200: {
		description: "Payout history",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminPayoutHistoryQuerySchema), async (c) => {
	const query$1 = c.req.valid("query");
	const offset = (query$1.page - 1) * query$1.limit;
	const whereClause = query$1.vendorId ? eq(vendorPayouts.vendorId, query$1.vendorId) : void 0;
	const [totalResult, items] = await Promise.all([db.select({ count: sql`count(*)::int` }).from(vendorPayouts).where(whereClause), db.select({
		id: vendorPayouts.id,
		vendorId: vendorPayouts.vendorId,
		vendorName: vendors.name,
		amountPaisa: vendorPayouts.amountPaisa,
		payoutFeePaisa: vendorPayouts.payoutFeePaisa,
		paymentMethod: vendorPayouts.paymentMethod,
		paymentReference: vendorPayouts.paymentReference,
		status: vendorPayouts.status,
		processedAt: vendorPayouts.processedAt,
		processedBy: vendorPayouts.processedBy,
		processedByName: user.name,
		periodStart: vendorPayouts.periodStart,
		periodEnd: vendorPayouts.periodEnd,
		notes: vendorPayouts.notes,
		createdAt: vendorPayouts.createdAt
	}).from(vendorPayouts).leftJoin(vendors, eq(vendorPayouts.vendorId, vendors.id)).leftJoin(user, eq(vendorPayouts.processedBy, user.id)).where(whereClause).orderBy(desc(vendorPayouts.createdAt)).limit(query$1.limit).offset(offset)]);
	const total = totalResult[0]?.count ?? 0;
	const totalPages = Math.ceil(total / query$1.limit);
	const response = {
		payouts: items.map((item) => ({
			id: item.id,
			vendorId: item.vendorId,
			vendorName: item.vendorName || "Unknown",
			amountPaisa: item.amountPaisa,
			payoutFeePaisa: item.payoutFeePaisa,
			paymentMethod: item.paymentMethod,
			paymentReference: item.paymentReference,
			status: item.status,
			processedAt: item.processedAt?.toISOString() || null,
			processedBy: item.processedBy,
			processedByName: item.processedByName || "Unknown",
			periodStart: item.periodStart.toISOString(),
			periodEnd: item.periodEnd.toISOString(),
			notes: item.notes,
			createdAt: item.createdAt.toISOString()
		})),
		total,
		page: query$1.page,
		limit: query$1.limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/banners", describeRoute({
	tags: ["Admin - Banners"],
	summary: "List all banners",
	description: "Returns all banners ordered by sortOrder",
	responses: { 200: {
		description: "Banners list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const response = (await db.select().from(banners).orderBy(asc(banners.sortOrder), desc(banners.createdAt))).map((item) => ({
		id: item.id,
		titleEn: item.titleEn,
		titleBn: item.titleBn,
		subtitleEn: item.subtitleEn,
		subtitleBn: item.subtitleBn,
		priceLabel: item.priceLabel,
		badgeText: item.badgeText,
		badgeColor: item.badgeColor,
		ctaText: item.ctaText,
		discountPercentage: item.discountPercentage,
		imageUrl: item.s3Key ? getS3Url(item.s3Key) : item.imageUrl,
		s3Key: item.s3Key,
		linkUrl: item.linkUrl,
		placement: item.placement,
		isActive: item.isActive,
		sortOrder: item.sortOrder,
		startsAt: item.startsAt?.toISOString() || null,
		endsAt: item.endsAt?.toISOString() || null,
		createdAt: item.createdAt.toISOString()
	}));
	return c.json(response, 200);
}).get("/banners/hero", describeRoute({
	tags: ["Admin - Banners"],
	summary: "List hero carousel banners",
	description: "Returns hero carousel banners ordered by sortOrder",
	responses: { 200: {
		description: "Hero banner list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const response = (await db.select().from(banners).where(eq(banners.placement, "hero_carousel")).orderBy(asc(banners.sortOrder), desc(banners.createdAt))).map((item) => ({
		id: item.id,
		imageUrl: item.s3Key ? getS3Url(item.s3Key) : item.imageUrl,
		s3Key: item.s3Key,
		linkUrl: item.linkUrl || "/",
		altText: item.titleEn || "Hero Banner",
		isActive: item.isActive,
		sortOrder: item.sortOrder,
		startsAt: item.startsAt?.toISOString() || null,
		endsAt: item.endsAt?.toISOString() || null,
		createdAt: item.createdAt.toISOString(),
		status: getHeroBannerStatus({
			isActive: item.isActive,
			startsAt: item.startsAt,
			endsAt: item.endsAt
		})
	}));
	return c.json(response, 200);
}).post("/banners/hero", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Create hero banner",
	description: "Create a hero carousel banner",
	responses: { 201: {
		description: "Hero banner created successfully",
		content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
	} }
}), zValidator("json", adminHeroBannerFormSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	if (input.startsAt && input.endsAt) {
		const start = new Date(input.startsAt);
		if (new Date(input.endsAt) <= start) return c.json({ error: "End date must be after start date" }, 400);
	}
	const altText = input.altText?.trim() || "Hero Banner";
	const [newBanner] = await db.insert(banners).values({
		titleEn: altText,
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		priceLabel: null,
		badgeText: null,
		badgeColor: null,
		ctaText: null,
		discountPercentage: null,
		imageUrl: getS3Url(input.s3Key),
		s3Key: input.s3Key,
		linkUrl: input.linkUrl,
		placement: "hero_carousel",
		isActive: input.isActive,
		sortOrder: input.sortOrder,
		startsAt: input.startsAt ? new Date(input.startsAt) : null,
		endsAt: input.endsAt ? new Date(input.endsAt) : null
	}).returning({ id: banners.id });
	if (!newBanner) return c.json({ error: "Failed to create hero banner" }, 500);
	await logAdminAction$1(adminUserId, "create_hero_banner", "banner", newBanner.id, { altText });
	return c.json({ message: "Hero banner created successfully" }, 201);
}).put("/banners/hero/:bannerId", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Update hero banner",
	description: "Update an existing hero carousel banner",
	responses: {
		200: {
			description: "Hero banner updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Hero banner not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminHeroBannerFormSchema), async (c) => {
	const bannerId = c.req.param("bannerId");
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const [heroBanner] = await db.select().from(banners).where(and(eq(banners.id, bannerId), eq(banners.placement, "hero_carousel"))).limit(1);
	if (!heroBanner) return c.json({ error: "Hero banner not found" }, 404);
	if (input.startsAt && input.endsAt) {
		const start = new Date(input.startsAt);
		if (new Date(input.endsAt) <= start) return c.json({ error: "End date must be after start date" }, 400);
	}
	if (heroBanner.s3Key && input.s3Key !== heroBanner.s3Key) deleteFile(heroBanner.s3Key).catch((err) => console.error("Failed to delete old hero banner image:", err));
	const altText = input.altText?.trim() || "Hero Banner";
	await db.update(banners).set({
		titleEn: altText,
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		priceLabel: null,
		badgeText: null,
		badgeColor: null,
		ctaText: null,
		discountPercentage: null,
		imageUrl: getS3Url(input.s3Key),
		s3Key: input.s3Key,
		linkUrl: input.linkUrl,
		placement: "hero_carousel",
		isActive: input.isActive,
		sortOrder: input.sortOrder,
		startsAt: input.startsAt ? new Date(input.startsAt) : null,
		endsAt: input.endsAt ? new Date(input.endsAt) : null
	}).where(eq(banners.id, bannerId));
	await logAdminAction$1(adminUserId, "update_hero_banner", "banner", bannerId, { altText });
	return c.json({ message: "Hero banner updated successfully" }, 200);
}).get("/banners/side-cards", describeRoute({
	tags: ["Admin - Banners"],
	summary: "List side cards",
	description: "Returns up to three promotional side cards",
	responses: { 200: {
		description: "Side cards list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const response = (await db.select().from(banners).where(eq(banners.placement, "promotional_card")).orderBy(asc(banners.sortOrder), desc(banners.createdAt)).limit(3)).map((item) => ({
		id: item.id,
		titleEn: item.titleEn,
		titleBn: item.titleBn,
		subtitleEn: item.subtitleEn,
		subtitleBn: item.subtitleBn,
		imageUrl: item.s3Key ? getS3Url(item.s3Key) : item.imageUrl,
		s3Key: item.s3Key,
		linkUrl: item.linkUrl,
		discountPercentage: item.discountPercentage,
		badgeText: item.badgeText,
		badgeColor: item.badgeColor,
		isActive: item.isActive,
		sortOrder: item.sortOrder,
		createdAt: item.createdAt.toISOString()
	}));
	return c.json(response, 200);
}).post("/banners/side-cards", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Create side card",
	description: "Create a promotional side card (maximum 3)",
	responses: { 201: {
		description: "Side card created successfully",
		content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
	} }
}), zValidator("json", adminSideCardFormSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const managedSideCardSlots = and(eq(banners.placement, "promotional_card"), gte(banners.sortOrder, 0), lte(banners.sortOrder, 2));
	const [countResult] = await db.select({ count: sql`count(distinct ${banners.sortOrder})::int` }).from(banners).where(managedSideCardSlots);
	if ((countResult?.count ?? 0) >= 3) return c.json({ error: "Maximum 3 side cards allowed" }, 400);
	const [slotTaken] = await db.select({ id: banners.id }).from(banners).where(and(managedSideCardSlots, eq(banners.sortOrder, input.sortOrder))).limit(1);
	if (slotTaken) return c.json({ error: "This side card slot is already configured" }, 409);
	const [newBanner] = await db.insert(banners).values({
		titleEn: input.titleEn,
		titleBn: input.titleBn || null,
		subtitleEn: input.subtitleEn || null,
		subtitleBn: input.subtitleBn || null,
		priceLabel: null,
		badgeText: input.badgeText || null,
		badgeColor: input.badgeColor || null,
		ctaText: null,
		discountPercentage: input.discountPercentage || null,
		imageUrl: getS3Url(input.s3Key),
		s3Key: input.s3Key,
		linkUrl: input.linkUrl || null,
		placement: "promotional_card",
		isActive: input.isActive,
		sortOrder: input.sortOrder,
		startsAt: null,
		endsAt: null
	}).returning({ id: banners.id });
	if (!newBanner) return c.json({ error: "Failed to create side card" }, 500);
	await logAdminAction$1(adminUserId, "create_side_card", "banner", newBanner.id, {
		titleEn: input.titleEn,
		sortOrder: input.sortOrder
	});
	return c.json({ message: "Side card created successfully" }, 201);
}).put("/banners/side-cards/:bannerId", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Update side card",
	description: "Update an existing promotional side card",
	responses: {
		200: {
			description: "Side card updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Side card not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminSideCardFormSchema), async (c) => {
	const bannerId = c.req.param("bannerId");
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const [sideCard] = await db.select().from(banners).where(and(eq(banners.id, bannerId), eq(banners.placement, "promotional_card"))).limit(1);
	if (!sideCard) return c.json({ error: "Side card not found" }, 404);
	if ((await db.select({
		id: banners.id,
		sortOrder: banners.sortOrder
	}).from(banners).where(eq(banners.placement, "promotional_card"))).some((item) => item.id !== bannerId && item.sortOrder === input.sortOrder)) return c.json({ error: "This side card slot is already configured" }, 409);
	if (sideCard.s3Key && input.s3Key !== sideCard.s3Key) deleteFile(sideCard.s3Key).catch((err) => console.error("Failed to delete old side card image:", err));
	await db.update(banners).set({
		titleEn: input.titleEn,
		titleBn: input.titleBn || null,
		subtitleEn: input.subtitleEn || null,
		subtitleBn: input.subtitleBn || null,
		priceLabel: null,
		badgeText: input.badgeText || null,
		badgeColor: input.badgeColor || null,
		ctaText: null,
		discountPercentage: input.discountPercentage || null,
		imageUrl: getS3Url(input.s3Key),
		s3Key: input.s3Key,
		linkUrl: input.linkUrl || null,
		placement: "promotional_card",
		isActive: input.isActive,
		sortOrder: input.sortOrder,
		startsAt: null,
		endsAt: null
	}).where(eq(banners.id, bannerId));
	await logAdminAction$1(adminUserId, "update_side_card", "banner", bannerId, {
		titleEn: input.titleEn,
		sortOrder: input.sortOrder
	});
	return c.json({ message: "Side card updated successfully" }, 200);
}).post("/banners", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Create banner",
	description: "Create a new banner",
	responses: { 201: {
		description: "Banner created successfully",
		content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
	} }
}), zValidator("json", adminBannerFormSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	if (input.startsAt && input.endsAt) {
		const start = new Date(input.startsAt);
		if (new Date(input.endsAt) <= start) return c.json({ error: "End date must be after start date" }, 400);
	}
	const [newBanner] = await db.insert(banners).values({
		titleEn: input.titleEn,
		titleBn: input.titleBn || null,
		subtitleEn: input.subtitleEn || null,
		subtitleBn: input.subtitleBn || null,
		priceLabel: input.priceLabel || null,
		badgeText: input.badgeText || null,
		badgeColor: input.badgeColor || null,
		ctaText: input.ctaText || null,
		discountPercentage: input.discountPercentage || null,
		imageUrl: getS3Url(input.s3Key),
		s3Key: input.s3Key,
		linkUrl: input.linkUrl || null,
		placement: input.placement,
		isActive: input.isActive,
		sortOrder: input.sortOrder,
		startsAt: input.startsAt ? new Date(input.startsAt) : null,
		endsAt: input.endsAt ? new Date(input.endsAt) : null
	}).returning({ id: banners.id });
	if (!newBanner) return c.json({ error: "Failed to create banner" }, 500);
	await logAdminAction$1(adminUserId, "create_banner", "banner", newBanner.id, { titleEn: input.titleEn });
	return c.json({ message: "Banner created successfully" }, 201);
}).put("/banners/:bannerId", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Update banner",
	description: "Update an existing banner",
	responses: {
		200: {
			description: "Banner updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Banner not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminBannerFormSchema), async (c) => {
	const bannerId = c.req.param("bannerId");
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const [banner] = await db.select().from(banners).where(eq(banners.id, bannerId)).limit(1);
	if (!banner) return c.json({ error: "Banner not found" }, 404);
	if (input.startsAt && input.endsAt) {
		const start = new Date(input.startsAt);
		if (new Date(input.endsAt) <= start) return c.json({ error: "End date must be after start date" }, 400);
	}
	if (banner.s3Key && input.s3Key !== banner.s3Key) deleteFile(banner.s3Key).catch((err) => console.error("Failed to delete old banner image:", err));
	await db.update(banners).set({
		titleEn: input.titleEn,
		titleBn: input.titleBn || null,
		subtitleEn: input.subtitleEn || null,
		subtitleBn: input.subtitleBn || null,
		priceLabel: input.priceLabel || null,
		badgeText: input.badgeText || null,
		badgeColor: input.badgeColor || null,
		ctaText: input.ctaText || null,
		discountPercentage: input.discountPercentage || null,
		imageUrl: getS3Url(input.s3Key),
		s3Key: input.s3Key,
		linkUrl: input.linkUrl || null,
		placement: input.placement,
		isActive: input.isActive,
		sortOrder: input.sortOrder,
		startsAt: input.startsAt ? new Date(input.startsAt) : null,
		endsAt: input.endsAt ? new Date(input.endsAt) : null
	}).where(eq(banners.id, bannerId));
	await logAdminAction$1(adminUserId, "update_banner", "banner", bannerId, { titleEn: input.titleEn });
	return c.json({ message: "Banner updated successfully" }, 200);
}).delete("/banners/:bannerId", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Delete banner",
	description: "Delete a banner",
	responses: {
		200: {
			description: "Banner deleted successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Banner not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const bannerId = c.req.param("bannerId");
	const adminUserId = c.var.adminUserId;
	const [banner] = await db.select({
		id: banners.id,
		s3Key: banners.s3Key,
		titleEn: banners.titleEn
	}).from(banners).where(eq(banners.id, bannerId)).limit(1);
	if (!banner) return c.json({ error: "Banner not found" }, 404);
	if (banner.s3Key) deleteFile(banner.s3Key).catch((err) => console.error("Failed to delete banner S3 file:", err));
	await db.delete(banners).where(eq(banners.id, bannerId));
	await logAdminAction$1(adminUserId, "delete_banner", "banner", bannerId, { titleEn: banner.titleEn });
	return c.json({ message: "Banner deleted successfully" }, 200);
}).patch("/banners/reorder", describeRoute({
	tags: ["Admin - Banners"],
	summary: "Reorder banners",
	description: "Batch update banner sort orders",
	responses: { 200: {
		description: "Banners reordered successfully",
		content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
	} }
}), zValidator("json", adminBannerReorderSchema), async (c) => {
	const { banners: bannerUpdates } = c.req.valid("json");
	await Promise.all(bannerUpdates.map((update) => db.update(banners).set({ sortOrder: update.sortOrder }).where(eq(banners.id, update.id))));
	return c.json({ message: "Banners reordered successfully" }, 200);
}).get("/top-bar-announcement", describeRoute({
	tags: ["Admin - Site Settings"],
	summary: "Get top bar announcement setting",
	description: "Returns the current top bar announcement text shown on the storefront header.",
	responses: { 200: {
		description: "Top bar announcement setting",
		content: { "application/json": { schema: resolver(topBarAnnouncementSchema) } }
	} }
}), async (c) => {
	const [setting] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, TOP_BAR_ANNOUNCEMENT_SETTING_KEY)).limit(1);
	if (!setting) return c.json(DEFAULT_TOP_BAR_ANNOUNCEMENT, 200);
	return c.json(parseTopBarAnnouncement(setting.value), 200);
}).put("/top-bar-announcement", describeRoute({
	tags: ["Admin - Site Settings"],
	summary: "Update top bar announcement setting",
	description: "Updates the storefront top bar announcement text. Supports plain text and emoji.",
	responses: { 200: {
		description: "Top bar announcement updated",
		content: { "application/json": { schema: resolver(topBarAnnouncementSchema) } }
	} }
}), zValidator("json", adminTopBarAnnouncementUpdateSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const payload = {
		textEn: input.textEn.trim(),
		textBn: input.textBn?.trim() ? input.textBn.trim() : null,
		isActive: input.isActive
	};
	await db.insert(siteSettings).values({
		key: TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
		value: payload,
		updatedBy: adminUserId
	}).onConflictDoUpdate({
		target: siteSettings.key,
		set: {
			value: payload,
			updatedBy: adminUserId,
			updatedAt: /* @__PURE__ */ new Date()
		}
	});
	await logAdminAction$1(adminUserId, "update_top_bar_announcement", "site_setting", TOP_BAR_ANNOUNCEMENT_SETTING_KEY, payload);
	return c.json(payload, 200);
}).get("/settings/top-bar-announcement", describeRoute({
	tags: ["Admin - Site Settings"],
	summary: "Get top bar announcement setting",
	description: "Returns the current top bar announcement text shown on the storefront header.",
	responses: { 200: {
		description: "Top bar announcement setting",
		content: { "application/json": { schema: resolver(topBarAnnouncementSchema) } }
	} }
}), async (c) => {
	const [setting] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, TOP_BAR_ANNOUNCEMENT_SETTING_KEY)).limit(1);
	if (!setting) return c.json(DEFAULT_TOP_BAR_ANNOUNCEMENT, 200);
	return c.json(parseTopBarAnnouncement(setting.value), 200);
}).put("/settings/top-bar-announcement", describeRoute({
	tags: ["Admin - Site Settings"],
	summary: "Update top bar announcement setting",
	description: "Updates the storefront top bar announcement text. Supports plain text and emoji.",
	responses: { 200: {
		description: "Top bar announcement updated",
		content: { "application/json": { schema: resolver(topBarAnnouncementSchema) } }
	} }
}), zValidator("json", adminTopBarAnnouncementUpdateSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const payload = {
		textEn: input.textEn.trim(),
		textBn: input.textBn?.trim() ? input.textBn.trim() : null,
		isActive: input.isActive
	};
	await db.insert(siteSettings).values({
		key: TOP_BAR_ANNOUNCEMENT_SETTING_KEY,
		value: payload,
		updatedBy: adminUserId
	}).onConflictDoUpdate({
		target: siteSettings.key,
		set: {
			value: payload,
			updatedBy: adminUserId,
			updatedAt: /* @__PURE__ */ new Date()
		}
	});
	await logAdminAction$1(adminUserId, "update_top_bar_announcement", "site_setting", TOP_BAR_ANNOUNCEMENT_SETTING_KEY, payload);
	return c.json(payload, 200);
}).get("/categories", describeRoute({
	tags: ["Admin - Categories"],
	summary: "List all categories",
	description: "Returns all categories with product counts",
	responses: { 200: {
		description: "Categories list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const response = (await db.select({
		id: categories.id,
		name: categories.name,
		nameBn: categories.nameBn,
		slug: categories.slug,
		parentId: categories.parentId,
		iconKey: categories.iconKey,
		sortOrder: categories.sortOrder,
		isFeatured: categories.isFeatured,
		isPopular: categories.isPopular,
		createdAt: categories.createdAt,
		productCount: sql`(
						SELECT COUNT(*)::int
						FROM ${products}
						WHERE ${products.categoryId} = ${categories.id}
					)`
	}).from(categories).orderBy(asc(categories.sortOrder), asc(categories.name))).map((item) => ({
		id: item.id,
		name: item.name,
		nameBn: item.nameBn,
		slug: item.slug,
		parentId: item.parentId,
		iconKey: item.iconKey,
		sortOrder: item.sortOrder,
		isFeatured: item.isFeatured,
		isPopular: item.isPopular,
		productCount: item.productCount,
		createdAt: item.createdAt.toISOString()
	}));
	return c.json(response, 200);
}).post("/categories", describeRoute({
	tags: ["Admin - Categories"],
	summary: "Create category",
	description: "Create a new category",
	responses: { 201: {
		description: "Category created successfully",
		content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
	} }
}), zValidator("json", adminCategoryFormSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const [newCategory] = await db.insert(categories).values({
		name: input.name,
		nameBn: input.nameBn || null,
		slug: input.slug,
		parentId: input.parentId || null,
		iconKey: input.iconKey || null,
		sortOrder: input.sortOrder,
		isFeatured: input.isFeatured,
		isPopular: input.isPopular
	}).returning({ id: categories.id });
	if (!newCategory) return c.json({ error: "Failed to create category" }, 500);
	await logAdminAction$1(adminUserId, "create_category", "category", newCategory.id, { name: input.name });
	return c.json({ message: "Category created successfully" }, 201);
}).put("/categories/:categoryId", describeRoute({
	tags: ["Admin - Categories"],
	summary: "Update category",
	description: "Update an existing category",
	responses: {
		200: {
			description: "Category updated successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Category not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminCategoryFormSchema), async (c) => {
	const categoryId = c.req.param("categoryId");
	const adminUserId = c.var.adminUserId;
	const input = c.req.valid("json");
	const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
	if (!category) return c.json({ error: "Category not found" }, 404);
	await db.update(categories).set({
		name: input.name,
		nameBn: input.nameBn || null,
		slug: input.slug,
		parentId: input.parentId || null,
		iconKey: input.iconKey || null,
		sortOrder: input.sortOrder,
		isFeatured: input.isFeatured,
		isPopular: input.isPopular
	}).where(eq(categories.id, categoryId));
	await logAdminAction$1(adminUserId, "update_category", "category", categoryId, { name: input.name });
	return c.json({ message: "Category updated successfully" }, 200);
}).delete("/categories/:categoryId", describeRoute({
	tags: ["Admin - Categories"],
	summary: "Delete category",
	description: "Delete a category (prevented if products reference it)",
	responses: {
		200: {
			description: "Category deleted successfully",
			content: { "application/json": { schema: resolver(z.object({ message: z.string() })) } }
		},
		404: {
			description: "Category not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		400: {
			description: "Cannot delete category with products",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const categoryId = c.req.param("categoryId");
	const adminUserId = c.var.adminUserId;
	const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
	if (!category) return c.json({ error: "Category not found" }, 404);
	const [productCount] = await db.select({ count: sql`count(*)::int` }).from(products).where(eq(products.categoryId, categoryId));
	const count$1 = productCount?.count ?? 0;
	if (count$1 > 0) return c.json({ error: `Cannot delete category with ${count$1} product(s)` }, 400);
	await db.delete(categories).where(eq(categories.id, categoryId));
	await logAdminAction$1(adminUserId, "delete_category", "category", categoryId, { name: category.name });
	return c.json({ message: "Category deleted successfully" }, 200);
});

//#endregion
//#region ../../packages/api-types/src/admin-management.ts
const ADMIN_MANAGEMENT_ROLES = ["admin", "super_admin"];
const adminInviteSchema = z.object({
	email: z.string().email(),
	role: z.enum(ADMIN_MANAGEMENT_ROLES)
});
const adminInviteAcceptSchema = z.object({ token: z.string().min(32).max(256) });

//#endregion
//#region src/lib/email-normalization.ts
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);
function normalizeEmail(email) {
	return email.trim().toLowerCase();
}
function canonicalizeEmail(email) {
	const normalized$1 = normalizeEmail(email);
	const [localPart, domainPart] = normalized$1.split("@");
	if (!localPart || !domainPart) return normalized$1;
	if (GMAIL_DOMAINS.has(domainPart)) return `${(localPart.split("+")[0] ?? localPart).replace(/\./g, "")}@gmail.com`;
	return normalized$1;
}
function emailsMatch(a, b) {
	return canonicalizeEmail(a) === canonicalizeEmail(b);
}

//#endregion
//#region src/routes/admin-management.ts
const inviteParamsSchema = z.object({ userId: z.string().min(1) });
const INVITE_WINDOW_MS = 6e4;
const INVITE_MAX_PER_WINDOW = 5;
const inviteAttempts = /* @__PURE__ */ new Map();
function buildInviteUrl(token) {
	return `${env.WEB_ORIGIN.replace(/\/+$/, "")}/admin/accept-invite?token=${encodeURIComponent(token)}`;
}
function hashToken(token) {
	return createHash("sha256").update(token).digest("hex");
}
function enforceInviteRateLimit(userId) {
	const now = Date.now();
	const activeWindow = (inviteAttempts.get(userId) ?? []).filter((timestamp$1) => now - timestamp$1 < INVITE_WINDOW_MS);
	if (activeWindow.length >= INVITE_MAX_PER_WINDOW) {
		inviteAttempts.set(userId, activeWindow);
		return false;
	}
	activeWindow.push(now);
	inviteAttempts.set(userId, activeWindow);
	return true;
}
async function logAdminAction(adminUserId, action, entityType, entityId, details) {
	await db.insert(adminAuditLog).values({
		adminUserId,
		action,
		entityType,
		entityId,
		details: details ?? null
	});
}
async function findUserByEmail(email) {
	const normalizedEmail = normalizeEmail(email);
	const canonicalEmail = canonicalizeEmail(normalizedEmail);
	const [exactUser] = await db.select({
		id: user.id,
		email: user.email,
		roles: user.roles
	}).from(user).where(eq(user.email, normalizedEmail)).limit(1);
	if (exactUser) return exactUser;
	if (normalizedEmail.includes("@")) {
		const matched = (await db.select({
			id: user.id,
			email: user.email,
			roles: user.roles
		}).from(user).where(sql`lower(${user.email}) like '%@gmail.com' or lower(${user.email}) like '%@googlemail.com'`)).find((candidate) => canonicalizeEmail(candidate.email) === canonicalEmail);
		if (matched) return matched;
	}
	return null;
}
async function cleanupPendingInvitesForEmail(email) {
	const normalizedEmail = normalizeEmail(email);
	const now = /* @__PURE__ */ new Date();
	const pendingInvites = await db.select({
		id: adminInvitations.id,
		email: adminInvitations.email,
		expiresAt: adminInvitations.expiresAt
	}).from(adminInvitations).where(eq(adminInvitations.status, "pending"));
	for (const pendingInvite of pendingInvites) {
		if (pendingInvite.expiresAt < now) {
			await db.update(adminInvitations).set({
				status: "expired",
				updatedAt: now
			}).where(eq(adminInvitations.id, pendingInvite.id));
			continue;
		}
		if (emailsMatch(pendingInvite.email, normalizedEmail)) await db.update(adminInvitations).set({
			status: "revoked",
			updatedAt: now
		}).where(eq(adminInvitations.id, pendingInvite.id));
	}
}
const adminManagementRouter = new Hono().post("/accept-invite", describeRoute({
	tags: ["Admin Management"],
	summary: "Accept admin invitation",
	description: "Accept an admin invitation for the currently logged-in user.",
	responses: {
		200: {
			description: "Invitation accepted successfully",
			content: { "application/json": { schema: resolver(z.object({
				message: z.string(),
				role: z.string()
			})) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminInviteAcceptSchema), async (c) => {
	const sessionUser = c.var.user;
	if (!sessionUser?.id) return c.json({ error: "Unauthorized" }, 401);
	const { token } = c.req.valid("json");
	const tokenHash = hashToken(token.trim());
	const [invitation] = await db.select().from(adminInvitations).where(eq(adminInvitations.tokenHash, tokenHash)).limit(1);
	if (!invitation) return c.json({ error: "Invitation not found" }, 404);
	if (invitation.status !== "pending") {
		if (invitation.status === "accepted") return c.json({ error: "Invitation already accepted" }, 409);
		if (invitation.status === "revoked") return c.json({ error: "Invitation has been revoked" }, 410);
		if (invitation.status === "expired") return c.json({ error: "Invitation has expired" }, 410);
	}
	if (invitation.expiresAt < /* @__PURE__ */ new Date()) {
		await db.update(adminInvitations).set({
			status: "expired",
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(adminInvitations.id, invitation.id));
		return c.json({ error: "Invitation has expired" }, 410);
	}
	if (!emailsMatch(invitation.email, sessionUser.email)) return c.json({
		error: "Invitation email does not match your account",
		code: "invite_email_mismatch",
		invitedEmail: invitation.email,
		currentEmail: sessionUser.email
	}, 403);
	const [updatedInvitation] = await db.update(adminInvitations).set({
		status: "accepted",
		acceptedAt: /* @__PURE__ */ new Date(),
		updatedAt: /* @__PURE__ */ new Date()
	}).where(and(eq(adminInvitations.id, invitation.id), eq(adminInvitations.status, "pending"))).returning({ id: adminInvitations.id });
	if (!updatedInvitation) return c.json({ error: "Invitation already consumed" }, 409);
	await grantRole(sessionUser.id, invitation.role);
	await logAdminAction(sessionUser.id, "accept_admin_invite", "admin_invitation", invitation.id, {
		email: invitation.email,
		role: invitation.role
	});
	const response = {
		message: "Invitation accepted successfully",
		role: invitation.role
	};
	return c.json(response, 200);
}).post("/invite", adminAuthMiddleware, describeRoute({
	tags: ["Admin Management"],
	summary: "Invite a new admin",
	description: "Create and send an admin invitation. Super admin only.",
	responses: {
		200: {
			description: "Invitation created successfully",
			content: { "application/json": { schema: resolver(z.object({
				message: z.string(),
				email: z.string(),
				role: z.string(),
				expiresAt: z.string()
			})) } }
		},
		429: {
			description: "Rate limited",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), zValidator("json", adminInviteSchema), async (c) => {
	if (!c.var.isSuperAdmin) return c.json({ error: "Only super_admin can invite admins" }, 403);
	if (!enforceInviteRateLimit(c.var.adminUserId)) return c.json({ error: "Too many invitations. Please try again in a minute." }, 429);
	const input = c.req.valid("json");
	const normalizedEmail = normalizeEmail(input.email);
	const existingUser = await findUserByEmail(normalizedEmail);
	if (existingUser) {
		const currentRoles = existingUser.roles ?? [];
		if (input.role === "admin" && hasAnyRole(currentRoles, ["admin", "super_admin"])) return c.json({ error: "User already has admin access" }, 409);
		if (input.role === "super_admin" && hasRole(currentRoles, "super_admin")) return c.json({ error: "User is already a super_admin" }, 409);
	}
	const token = randomBytes(24).toString("hex");
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + 10080 * 60 * 1e3);
	await cleanupPendingInvitesForEmail(normalizedEmail);
	const [createdInvitation] = await db.insert(adminInvitations).values({
		email: normalizedEmail,
		role: input.role,
		invitedBy: c.var.adminUserId,
		tokenHash,
		expiresAt,
		status: "pending"
	}).returning({ id: adminInvitations.id });
	if (!createdInvitation) return c.json({ error: "Failed to create invitation" }, 500);
	const inviteUrl = buildInviteUrl(token);
	try {
		await sendEmail({
			to: normalizedEmail,
			subject: "You're invited as admin on KineDao",
			html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You are invited to KineDao Admin</h2>
            <p>You were invited as <strong>${input.role}</strong>.</p>
            <p>Click the link below to accept your invitation:</p>
            <p><a href="${inviteUrl}">${inviteUrl}</a></p>
            <p>This invitation expires in 7 days.</p>
          </div>
        `
		});
	} catch {
		await db.update(adminInvitations).set({
			status: "revoked",
			updatedAt: /* @__PURE__ */ new Date()
		}).where(eq(adminInvitations.id, createdInvitation.id));
		return c.json({ error: "Failed to send invitation email. Verify SMTP/app-password settings and try again." }, 502);
	}
	await logAdminAction(c.var.adminUserId, "invite_admin", "admin_invitation", createdInvitation.id, {
		email: normalizedEmail,
		role: input.role
	});
	const response = {
		message: "Admin invitation sent",
		email: normalizedEmail,
		role: input.role,
		expiresAt: expiresAt.toISOString()
	};
	return c.json(response, 200);
}).get("/admins", adminAuthMiddleware, describeRoute({
	tags: ["Admin Management"],
	summary: "List admins",
	description: "List current admins and super admins.",
	responses: { 200: {
		description: "Admin list",
		content: { "application/json": { schema: resolver(z.object({
			admins: z.array(z.any()),
			total: z.number()
		})) } }
	} }
}), async (c) => {
	const admins = await db.select({
		userId: user.id,
		name: user.name,
		email: user.email,
		roles: user.roles,
		createdAt: user.createdAt
	}).from(user).where(sql`${user.roles} && ARRAY['admin', 'super_admin']::text[]`).orderBy(user.createdAt);
	const response = {
		admins: admins.map((admin) => ({
			userId: admin.userId,
			name: admin.name,
			email: admin.email,
			roles: admin.roles ?? [],
			createdAt: admin.createdAt.toISOString()
		})),
		total: admins.length
	};
	return c.json(response, 200);
}).delete("/admins/:userId", adminAuthMiddleware, describeRoute({
	tags: ["Admin Management"],
	summary: "Revoke admin access",
	description: "Revoke admin/super_admin roles for a user. Super admin only.",
	responses: { 200: {
		description: "Admin access revoked",
		content: { "application/json": { schema: resolver(z.object({
			message: z.string(),
			userId: z.string()
		})) } }
	} }
}), zValidator("param", inviteParamsSchema), async (c) => {
	if (!c.var.isSuperAdmin) return c.json({ error: "Only super_admin can revoke admin access" }, 403);
	const { userId } = c.req.valid("param");
	if (userId === c.var.adminUserId) return c.json({ error: "You cannot revoke your own admin access" }, 400);
	const [targetUser] = await db.select({
		id: user.id,
		roles: user.roles
	}).from(user).where(eq(user.id, userId)).limit(1);
	if (!targetUser) return c.json({ error: "User not found" }, 404);
	const targetRoles = targetUser.roles ?? [];
	if (!hasAnyRole(targetRoles, ["admin", "super_admin"])) return c.json({ error: "Target user is not an admin" }, 404);
	try {
		if (hasRole(targetRoles, "super_admin")) await revokeRole(userId, "super_admin");
		if (hasRole(targetRoles, "admin")) await revokeRole(userId, "admin");
	} catch (error$1) {
		const message = error$1 instanceof Error ? error$1.message : "Failed to revoke admin access";
		return c.json({ error: message }, 409);
	}
	await logAdminAction(c.var.adminUserId, "revoke_admin", "user", userId, {});
	const response = {
		message: "Admin access revoked",
		userId
	};
	return c.json(response, 200);
});

//#endregion
//#region src/routes/banners.ts
const bannersRouter = new Hono().get("/", describeRoute({
	tags: ["Public - Banners"],
	summary: "Get active banners",
	description: "Fetch active banners for display on homepage. Supports filtering by placement type and automatic scheduling.",
	responses: { 200: {
		description: "List of active banners",
		content: { "application/json": { schema: resolver(z.array(z.object({
			id: z.string(),
			titleEn: z.string(),
			titleBn: z.string().nullable(),
			subtitleEn: z.string().nullable(),
			subtitleBn: z.string().nullable(),
			imageUrl: z.string(),
			linkUrl: z.string().nullable(),
			priceLabel: z.string().nullable(),
			badgeText: z.string().nullable(),
			badgeColor: z.string().nullable(),
			ctaText: z.string().nullable(),
			discountPercentage: z.number().nullable(),
			placement: z.string(),
			sortOrder: z.number()
		}))) } }
	} }
}), zValidator("query", getBannersQuerySchema), async (c) => {
	const { placement } = c.req.valid("query");
	const now = /* @__PURE__ */ new Date();
	const conditions = [eq(banners.isActive, true)];
	if (placement) {
		const placements = placement.split(",").map((p) => p.trim());
		conditions.push(inArray(banners.placement, placements));
	}
	const response = (await db.select({
		id: banners.id,
		titleEn: banners.titleEn,
		titleBn: banners.titleBn,
		subtitleEn: banners.subtitleEn,
		subtitleBn: banners.subtitleBn,
		imageUrl: banners.imageUrl,
		s3Key: banners.s3Key,
		linkUrl: banners.linkUrl,
		priceLabel: banners.priceLabel,
		badgeText: banners.badgeText,
		badgeColor: banners.badgeColor,
		ctaText: banners.ctaText,
		discountPercentage: banners.discountPercentage,
		placement: banners.placement,
		sortOrder: banners.sortOrder,
		startsAt: banners.startsAt,
		endsAt: banners.endsAt
	}).from(banners).where(and(...conditions)).orderBy(banners.sortOrder)).filter((banner) => {
		if (banner.startsAt && banner.startsAt > now) return false;
		if (banner.endsAt && banner.endsAt < now) return false;
		return true;
	}).map(({ startsAt, endsAt, s3Key, ...banner }) => ({
		...banner,
		imageUrl: s3Key ? getS3Url(s3Key) : banner.imageUrl
	}));
	return c.json(response, 200);
});

//#endregion
//#region ../../packages/api-types/src/notifications.ts
const NOTIFICATION_CHANNELS = [
	"customer",
	"vendor",
	"admin"
];
const notificationPreferencesUpdateSchema = z.object({
	emailEnabled: z.boolean().optional(),
	pushEnabled: z.boolean().optional(),
	orderUpdates: z.boolean().optional(),
	deliveryAlerts: z.boolean().optional(),
	promotions: z.boolean().optional(),
	newOrders: z.boolean().optional(),
	lowStock: z.boolean().optional(),
	soundEnabled: z.boolean().optional()
});
const pushSubscriptionSchema = z.object({
	endpoint: z.string().min(1),
	keys: z.object({
		p256dh: z.string(),
		auth: z.string()
	}),
	userAgent: z.string().optional()
});
const notificationListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	channel: z.enum(NOTIFICATION_CHANNELS).optional(),
	unreadOnly: z.coerce.boolean().default(false)
});

//#endregion
//#region ../../packages/api-types/src/wishlist.ts
const wishlistProductIdParamSchema = z.object({ productId: z.string().uuid() });
const wishlistAddItemSchema = z.object({ productId: z.string().uuid() });
const wishlistMergeSchema = z.object({ productIds: z.array(z.string().uuid()).default([]) });
const wishlistResolveSchema = z.object({ productIds: z.array(z.string().uuid()).min(1) });

//#endregion
//#region ../../packages/api-types/src/reviews.ts
const REVIEW_STATUSES = [
	"published",
	"hidden",
	"removed"
];
const REVIEW_SORT_OPTIONS = [
	"recent",
	"highest",
	"lowest",
	"helpful"
];
const reviewListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	sort: z.enum(REVIEW_SORT_OPTIONS).default("recent"),
	rating: z.coerce.number().int().min(1).max(5).optional()
});
const createReviewSchema = z.object({
	productId: z.string().uuid(),
	rating: z.coerce.number().int().min(1).max(5),
	title: z.string().trim().max(180).optional(),
	content: z.string().trim().min(8).max(3e3)
});
const updateReviewSchema = z.object({
	rating: z.coerce.number().int().min(1).max(5).optional(),
	title: z.string().trim().max(180).optional(),
	content: z.string().trim().min(8).max(3e3).optional()
});
const reviewVoteSchema = z.object({ voteType: z.enum(["helpful", "not_helpful"]) });
const vendorReplySchema = z.object({ content: z.string().trim().min(2).max(2e3) });
const vendorReviewListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(10),
	sort: z.enum(REVIEW_SORT_OPTIONS).default("recent"),
	rating: z.coerce.number().int().min(1).max(5).optional(),
	status: z.enum(["all", ...REVIEW_STATUSES]).default("all"),
	search: z.string().trim().optional()
});
const adminReviewListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(50).default(20),
	sort: z.enum(REVIEW_SORT_OPTIONS).default("recent"),
	status: z.enum(["all", ...REVIEW_STATUSES]).default("all"),
	rating: z.coerce.number().int().min(1).max(5).optional(),
	vendorId: z.string().uuid().optional(),
	productId: z.string().uuid().optional(),
	search: z.string().trim().optional()
});
const adminModerateReviewSchema = z.object({
	status: z.enum([
		"published",
		"hidden",
		"removed"
	]),
	moderationReason: z.string().trim().max(1e3).optional(),
	moderationNote: z.string().trim().max(2e3).optional()
});
const adminReviewAnalyticsQuerySchema = z.object({ days: z.coerce.number().int().min(7).max(365).default(30) });

//#endregion
//#region src/routes/notifications.ts
const notificationsRouter = new Hono().get("/stream", describeRoute({
	tags: ["Notifications"],
	summary: "SSE stream for real-time notifications",
	description: "Opens an SSE connection to receive real-time notification events",
	responses: {
		200: { description: "SSE stream established" },
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	return streamSSE(c, async (stream) => {
		addSSEConnection(userId, stream);
		await stream.writeSSE({
			data: JSON.stringify({ type: "connected" }),
			event: "system"
		});
		const heartbeatInterval = setInterval(async () => {
			try {
				await stream.write(": heartbeat\n\n");
			} catch (error$1) {
				console.error("Heartbeat error:", error$1);
				clearInterval(heartbeatInterval);
			}
		}, 3e4);
		stream.onAbort(() => {
			removeSSEConnection(userId, stream);
			clearInterval(heartbeatInterval);
		});
		await new Promise(() => {});
	});
}).get("/", describeRoute({
	tags: ["Notifications"],
	summary: "Get notification list",
	description: "Returns paginated list of notifications for the current user",
	responses: { 200: {
		description: "Notification list retrieved",
		content: { "application/json": { schema: resolver(z.object({
			notifications: z.array(z.any()),
			total: z.number(),
			page: z.number(),
			limit: z.number(),
			totalPages: z.number()
		})) } }
	} }
}), zValidator("query", notificationListQuerySchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { page, limit, channel, unreadOnly } = c.req.valid("query");
	const offset = (page - 1) * limit;
	const conditions = [eq(notifications.userId, userId)];
	if (channel) conditions.push(eq(notifications.channel, channel));
	if (unreadOnly) conditions.push(eq(notifications.isRead, false));
	const notificationsList = await db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
	const total = await db.$count(notifications, and(...conditions));
	const totalPages = Math.ceil(total / limit);
	const response = {
		notifications: notificationsList.map((n) => ({
			id: n.id,
			type: n.type,
			title: n.title,
			titleBn: n.titleBn,
			body: n.body,
			bodyBn: n.bodyBn,
			data: n.data,
			channel: n.channel,
			isRead: n.isRead,
			readAt: n.readAt?.toISOString() ?? null,
			createdAt: n.createdAt.toISOString()
		})),
		total,
		page,
		limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/unread-count", describeRoute({
	tags: ["Notifications"],
	summary: "Get unread notification count",
	description: "Returns the number of unread notifications",
	responses: { 200: {
		description: "Unread count retrieved",
		content: { "application/json": { schema: resolver(z.object({ count: z.number() })) } }
	} }
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const response = { count: await db.$count(notifications, and(eq(notifications.userId, userId), eq(notifications.isRead, false))) };
	return c.json(response, 200);
}).patch("/:id/read", describeRoute({
	tags: ["Notifications"],
	summary: "Mark notification as read",
	description: "Marks a single notification as read",
	responses: {
		200: {
			description: "Notification marked as read",
			content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
		},
		404: {
			description: "Notification not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const notificationId = c.req.param("id");
	if (!(await db.update(notifications).set({
		isRead: true,
		readAt: /* @__PURE__ */ new Date()
	}).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning())[0]) return c.json({ error: "Notification not found" }, 404);
	return c.json({ success: true }, 200);
}).patch("/read-all", describeRoute({
	tags: ["Notifications"],
	summary: "Mark all notifications as read",
	description: "Marks all unread notifications as read for the current user",
	responses: { 200: {
		description: "All notifications marked as read",
		content: { "application/json": { schema: resolver(z.object({ count: z.number() })) } }
	} }
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const result = await db.update(notifications).set({
		isRead: true,
		readAt: /* @__PURE__ */ new Date()
	}).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))).returning();
	return c.json({ count: result.length }, 200);
}).delete("/:id", describeRoute({
	tags: ["Notifications"],
	summary: "Delete notification",
	description: "Deletes a single notification for the current user",
	responses: {
		200: {
			description: "Notification deleted",
			content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
		},
		404: {
			description: "Notification not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const notificationId = c.req.param("id");
	if (!(await db.delete(notifications).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId))).returning({ id: notifications.id }))[0]) return c.json({ error: "Notification not found" }, 404);
	return c.json({ success: true }, 200);
}).delete("/", describeRoute({
	tags: ["Notifications"],
	summary: "Delete all notifications",
	description: "Deletes all notifications for the current user",
	responses: { 200: {
		description: "All notifications deleted",
		content: { "application/json": { schema: resolver(z.object({ count: z.number() })) } }
	} }
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const result = await db.delete(notifications).where(eq(notifications.userId, userId)).returning({ id: notifications.id });
	return c.json({ count: result.length }, 200);
}).get("/preferences", describeRoute({
	tags: ["Notifications"],
	summary: "Get notification preferences",
	description: "Returns notification preferences for the current user (creates default if not exists)",
	responses: { 200: {
		description: "Preferences retrieved",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	let prefs = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, userId)).limit(1);
	if (!prefs[0]) {
		const [newPrefs] = await db.insert(notificationPreferences).values({ userId }).returning();
		prefs = [newPrefs];
	}
	const response = {
		id: prefs[0].id,
		userId: prefs[0].userId,
		emailEnabled: prefs[0].emailEnabled,
		pushEnabled: prefs[0].pushEnabled,
		orderUpdates: prefs[0].orderUpdates,
		deliveryAlerts: prefs[0].deliveryAlerts,
		promotions: prefs[0].promotions,
		newOrders: prefs[0].newOrders,
		lowStock: prefs[0].lowStock,
		soundEnabled: prefs[0].soundEnabled,
		updatedAt: prefs[0].updatedAt.toISOString()
	};
	return c.json(response, 200);
}).put("/preferences", describeRoute({
	tags: ["Notifications"],
	summary: "Update notification preferences",
	description: "Updates notification preferences for the current user",
	responses: { 200: {
		description: "Preferences updated",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("json", notificationPreferencesUpdateSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const updates = c.req.valid("json");
	const [prefs] = await db.insert(notificationPreferences).values({
		userId,
		...updates,
		updatedAt: /* @__PURE__ */ new Date()
	}).onConflictDoUpdate({
		target: notificationPreferences.userId,
		set: {
			...updates,
			updatedAt: /* @__PURE__ */ new Date()
		}
	}).returning();
	const response = {
		id: prefs.id,
		userId: prefs.userId,
		emailEnabled: prefs.emailEnabled,
		pushEnabled: prefs.pushEnabled,
		orderUpdates: prefs.orderUpdates,
		deliveryAlerts: prefs.deliveryAlerts,
		promotions: prefs.promotions,
		newOrders: prefs.newOrders,
		lowStock: prefs.lowStock,
		soundEnabled: prefs.soundEnabled,
		updatedAt: prefs.updatedAt.toISOString()
	};
	return c.json(response, 200);
}).get("/push/vapid-public-key", describeRoute({
	tags: ["Notifications"],
	summary: "Get VAPID public key",
	description: "Returns the VAPID public key needed for push subscription on the client",
	responses: { 200: {
		description: "VAPID public key",
		content: { "application/json": { schema: resolver(z.object({ publicKey: z.string() })) } }
	} }
}), async (c) => {
	return c.json({ publicKey: getVapidPublicKey() }, 200);
}).post("/push/subscribe", describeRoute({
	tags: ["Notifications"],
	summary: "Subscribe to push notifications",
	description: "Registers a push notification subscription for the current user",
	responses: { 200: {
		description: "Subscription registered",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("json", pushSubscriptionSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const subscription = c.req.valid("json");
	await db.insert(pushSubscriptions).values({
		userId,
		endpoint: subscription.endpoint,
		p256dh: subscription.keys.p256dh,
		auth: subscription.keys.auth,
		userAgent: subscription.userAgent ?? null
	}).onConflictDoUpdate({
		target: pushSubscriptions.endpoint,
		set: {
			userId,
			p256dh: subscription.keys.p256dh,
			auth: subscription.keys.auth,
			userAgent: subscription.userAgent ?? null
		}
	});
	return c.json({ success: true }, 200);
}).post("/push/unsubscribe", describeRoute({
	tags: ["Notifications"],
	summary: "Unsubscribe from push notifications",
	description: "Removes push notification subscription for the current user",
	responses: { 200: {
		description: "Subscription removed",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("json", z.object({ endpoint: z.string() })), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { endpoint } = c.req.valid("json");
	await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.endpoint, endpoint), eq(pushSubscriptions.userId, userId)));
	return c.json({ success: true }, 200);
});

//#endregion
//#region src/routes/wishlist.ts
async function getWishlistByUserId(userId) {
	const [wishlist] = await db.select().from(wishlists).where(eq(wishlists.userId, userId)).limit(1);
	return wishlist ?? null;
}
async function getOrCreateWishlist(userId) {
	const existing = await getWishlistByUserId(userId);
	if (existing) return existing;
	const [created] = await db.insert(wishlists).values({ userId }).onConflictDoNothing({ target: wishlists.userId }).returning();
	if (created) return created;
	const fallback = await getWishlistByUserId(userId);
	if (!fallback) throw new Error("Failed to create wishlist");
	return fallback;
}
async function buildProductCardMap(productIds) {
	if (productIds.length === 0) return /* @__PURE__ */ new Map();
	const productRows = await db.select({
		product: products,
		vendor: vendors,
		category: categories
	}).from(products).innerJoin(vendors, eq(products.vendorId, vendors.id)).innerJoin(categories, eq(products.categoryId, categories.id)).where(and(inArray(products.id, productIds), eq(products.isActive, true), eq(products.status, "approved")));
	if (productRows.length === 0) return /* @__PURE__ */ new Map();
	const validProductIds = productRows.map((row) => row.product.id);
	const [imageRows, skuRows, optionRows] = await Promise.all([
		db.select({
			productId: productImages.productId,
			s3Key: productImages.s3Key,
			alt: productImages.alt
		}).from(productImages).where(inArray(productImages.productId, validProductIds)).orderBy(asc(productImages.productId), asc(productImages.sortOrder)),
		db.select({
			productId: productSkus.productId,
			id: productSkus.id,
			optionValues: productSkus.optionValues,
			priceAmount: productSkus.priceAmount,
			compareAtAmount: productSkus.compareAtAmount,
			currency: productSkus.currency,
			stockQty: productSkus.stockQty,
			isAvailable: productSkus.isAvailable
		}).from(productSkus).where(inArray(productSkus.productId, validProductIds)).orderBy(asc(productSkus.productId), asc(productSkus.priceAmount)),
		db.select({ productId: productOptions.productId }).from(productOptions).where(inArray(productOptions.productId, validProductIds))
	]);
	const firstImageByProductId = /* @__PURE__ */ new Map();
	for (const row of imageRows) if (!firstImageByProductId.has(row.productId)) firstImageByProductId.set(row.productId, {
		s3Key: row.s3Key,
		alt: row.alt
	});
	const hasOptionsSet = new Set(optionRows.map((row) => row.productId));
	const skuByProductId = /* @__PURE__ */ new Map();
	for (const row of skuRows) {
		const current = skuByProductId.get(row.productId) ?? [];
		current.push(row);
		skuByProductId.set(row.productId, current);
	}
	const orderedProductIds = [...productIds];
	const rowById = new Map(productRows.map((row) => [row.product.id, row]));
	const cards = /* @__PURE__ */ new Map();
	for (const productId of orderedProductIds) {
		const row = rowById.get(productId);
		if (!row) continue;
		const productSkusForItem = skuByProductId.get(productId) ?? [];
		const availableSkus = productSkusForItem.filter((sku) => sku.isAvailable && sku.stockQty > 0);
		const lowestSku = (availableSkus.length > 0 ? availableSkus : productSkusForItem)[0];
		const hasVariants = hasOptionsSet.has(productId) || productSkusForItem.length > 1 || productSkusForItem.some((sku) => sku.optionValues && Object.keys(sku.optionValues).length > 0);
		const image = firstImageByProductId.get(productId);
		cards.set(productId, {
			id: row.product.id,
			title: row.product.title,
			titleBn: row.product.titleBn,
			slug: row.product.slug,
			brand: row.product.brand,
			ageRange: row.product.ageRange,
			ageRangeMin: row.product.ageRangeMin,
			ageRangeMax: row.product.ageRangeMax,
			isBpaFree: row.product.isBpaFree,
			isOrganic: row.product.isOrganic,
			isHypoallergenic: row.product.isHypoallergenic,
			ratingAvg: row.product.ratingAvg,
			ratingCount: row.product.ratingCount,
			isNew: row.product.isNew,
			isHot: row.product.isHot,
			imageUrl: image ? getS3Url(image.s3Key) : null,
			imageAlt: image?.alt || null,
			priceAmount: lowestSku?.priceAmount || 0,
			compareAtAmount: lowestSku?.compareAtAmount || null,
			currency: lowestSku?.currency || "BDT",
			isAvailable: availableSkus.length > 0,
			hasVariants,
			vendor: {
				id: row.vendor.id,
				name: row.vendor.name,
				slug: row.vendor.slug,
				isVerified: row.vendor.isVerified
			},
			category: {
				id: row.category.id,
				name: row.category.name,
				slug: row.category.slug
			}
		});
	}
	return cards;
}
const wishlistRouter = new Hono().get("/", describeRoute({
	tags: ["Wishlist"],
	summary: "Get user wishlist",
	description: "Fetch all saved wishlist items for the authenticated user.",
	responses: {
		200: {
			description: "Wishlist fetched",
			content: { "application/json": { schema: resolver(z.any()) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const wishlist = await getWishlistByUserId(userId);
	if (!wishlist) return c.json({
		items: [],
		total: 0
	}, 200);
	const itemRows = await db.select({
		productId: wishlistItems.productId,
		createdAt: wishlistItems.createdAt
	}).from(wishlistItems).where(eq(wishlistItems.wishlistId, wishlist.id)).orderBy(desc(wishlistItems.createdAt));
	const cardsById = await buildProductCardMap(itemRows.map((row) => row.productId));
	const items = itemRows.map((row) => {
		const product = cardsById.get(row.productId);
		if (!product) return null;
		return {
			product,
			savedAt: row.createdAt.toISOString()
		};
	}).filter((row) => row !== null);
	const response = {
		items,
		total: items.length
	};
	return c.json(response, 200);
}).post("/items", describeRoute({
	tags: ["Wishlist"],
	summary: "Add item to wishlist",
	description: "Adds a product to the authenticated user's wishlist. Idempotent.",
	responses: { 200: {
		description: "Item added",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("json", wishlistAddItemSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { productId } = c.req.valid("json");
	const [product] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.isActive, true), eq(products.status, "approved"))).limit(1);
	if (!product) return c.json({ error: "Product not found" }, 404);
	const wishlist = await getOrCreateWishlist(userId);
	await db.insert(wishlistItems).values({
		wishlistId: wishlist.id,
		productId
	}).onConflictDoNothing({ target: [wishlistItems.wishlistId, wishlistItems.productId] });
	return c.json({ success: true }, 200);
}).delete("/items", describeRoute({
	tags: ["Wishlist"],
	summary: "Clear wishlist",
	description: "Removes all products from the authenticated user's wishlist.",
	responses: { 200: {
		description: "Wishlist cleared",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const wishlist = await getWishlistByUserId(userId);
	if (!wishlist) return c.json({ success: true }, 200);
	await db.delete(wishlistItems).where(eq(wishlistItems.wishlistId, wishlist.id));
	return c.json({ success: true }, 200);
}).delete("/items/:productId", describeRoute({
	tags: ["Wishlist"],
	summary: "Remove item from wishlist",
	description: "Removes a product from the authenticated user's wishlist.",
	responses: { 200: {
		description: "Item removed",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("param", wishlistProductIdParamSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { productId } = c.req.valid("param");
	const wishlist = await getWishlistByUserId(userId);
	if (!wishlist) return c.json({ success: true }, 200);
	await db.delete(wishlistItems).where(and(eq(wishlistItems.wishlistId, wishlist.id), eq(wishlistItems.productId, productId)));
	return c.json({ success: true }, 200);
}).post("/merge", describeRoute({
	tags: ["Wishlist"],
	summary: "Merge guest wishlist",
	description: "Merges client-side guest wishlist product IDs into the authenticated user's wishlist.",
	responses: { 200: {
		description: "Merge completed",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("json", wishlistMergeSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { productIds } = c.req.valid("json");
	const uniqueProductIds = Array.from(new Set(productIds));
	const wishlist = await getOrCreateWishlist(userId);
	if (uniqueProductIds.length === 0) {
		const [totalRow$1] = await db.select({ count: sql`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.wishlistId, wishlist.id));
		const response$1 = {
			mergedCount: 0,
			total: totalRow$1?.count ?? 0
		};
		return c.json(response$1, 200);
	}
	const validProductIds = (await db.select({ id: products.id }).from(products).where(and(inArray(products.id, uniqueProductIds), eq(products.isActive, true), eq(products.status, "approved")))).map((product) => product.id);
	if (validProductIds.length === 0) {
		const [totalRow$1] = await db.select({ count: sql`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.wishlistId, wishlist.id));
		const response$1 = {
			mergedCount: 0,
			total: totalRow$1?.count ?? 0
		};
		return c.json(response$1, 200);
	}
	const inserted = await db.insert(wishlistItems).values(validProductIds.map((productId) => ({
		wishlistId: wishlist.id,
		productId
	}))).onConflictDoNothing({ target: [wishlistItems.wishlistId, wishlistItems.productId] }).returning({ productId: wishlistItems.productId });
	const [totalRow] = await db.select({ count: sql`count(*)::int` }).from(wishlistItems).where(eq(wishlistItems.wishlistId, wishlist.id));
	const response = {
		mergedCount: inserted.length,
		total: totalRow?.count ?? 0
	};
	return c.json(response, 200);
}).post("/resolve", describeRoute({
	tags: ["Wishlist"],
	summary: "Resolve product IDs to wishlist cards",
	description: "Public helper endpoint for guest wishlist rendering based on product IDs in local storage.",
	responses: { 200: {
		description: "Resolved cards",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("json", wishlistResolveSchema), async (c) => {
	const { productIds } = c.req.valid("json");
	const uniqueProductIds = Array.from(new Set(productIds));
	const cardsById = await buildProductCardMap(uniqueProductIds);
	const response = { items: uniqueProductIds.map((productId) => cardsById.get(productId)).filter((row) => row !== void 0) };
	return c.json(response, 200);
});

//#endregion
//#region src/routes/account.ts
const RECOVERY_DAYS = 14;
function addRecoveryWindow(from) {
	const next = new Date(from);
	next.setDate(next.getDate() + RECOVERY_DAYS);
	return next;
}
const accountRouter = new Hono().delete("/", describeRoute({
	tags: ["Account"],
	summary: "Schedule account deletion",
	description: "Soft deletes account and keeps data recoverable for 14 days if user logs in again.",
	responses: {
		200: {
			description: "Account deletion scheduled",
			content: { "application/json": { schema: resolver(z.object({
				success: z.boolean(),
				recoverUntil: z.string(),
				message: z.string()
			})) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		},
		404: {
			description: "User not found",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const now = /* @__PURE__ */ new Date();
	const recoverUntil = addRecoveryWindow(now);
	if (!(await db.update(user).set({
		deletedAt: now,
		recoverUntil,
		updatedAt: now
	}).where(eq(user.id, userId)).returning({ id: user.id }))[0]) return c.json({ error: "User not found" }, 404);
	await db.delete(session).where(eq(session.userId, userId));
	return c.json({
		success: true,
		recoverUntil: recoverUntil.toISOString(),
		message: "Account scheduled for deletion. Log in again within 14 days to recover."
	}, 200);
}).post("/recover", describeRoute({
	tags: ["Account"],
	summary: "Recover soft-deleted account",
	description: "Recovers account if current authenticated user is still inside recovery window.",
	responses: {
		200: {
			description: "Recovery result",
			content: { "application/json": { schema: resolver(z.object({
				success: z.boolean(),
				recovered: z.boolean()
			})) } }
		},
		401: {
			description: "Unauthorized",
			content: { "application/json": { schema: resolver(z.object({ error: z.string() })) } }
		}
	}
}), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const now = /* @__PURE__ */ new Date();
	const record = (await db.select({
		id: user.id,
		deletedAt: user.deletedAt,
		recoverUntil: user.recoverUntil
	}).from(user).where(eq(user.id, userId)).limit(1))[0];
	if (!record?.deletedAt || !record.recoverUntil || record.recoverUntil < now) return c.json({
		success: true,
		recovered: false
	}, 200);
	await db.update(user).set({
		deletedAt: null,
		recoverUntil: null,
		updatedAt: now
	}).where(and(eq(user.id, userId), eq(user.deletedAt, record.deletedAt)));
	return c.json({
		success: true,
		recovered: true
	}, 200);
});

//#endregion
//#region src/lib/review-service.ts
function getClient(tx) {
	return tx ?? db;
}
async function getReviewEligibility(userId, productId, tx) {
	if (!userId) return {
		productId,
		canReview: false,
		eligibleDeliveredItems: 0,
		remainingReviewSlots: 0,
		reason: "not_authenticated",
		orderId: null,
		orderItemId: null
	};
	const client = getClient(tx);
	const deliveredRows = await client.select({
		orderId: orderItems.orderId,
		orderItemId: orderItems.id
	}).from(orderItems).innerJoin(orders, eq(orderItems.orderId, orders.id)).where(and(eq(orders.userId, userId), eq(orders.status, "delivered"), eq(orderItems.productId, productId)));
	if (deliveredRows.length === 0) return {
		productId,
		canReview: false,
		eligibleDeliveredItems: 0,
		remainingReviewSlots: 0,
		reason: "no_delivered_order",
		orderId: null,
		orderItemId: null
	};
	const deliveredOrderItemIds = deliveredRows.map((row) => row.orderItemId);
	const reviewedRows = await client.select({ orderItemId: productReviews.orderItemId }).from(productReviews).where(inArray(productReviews.orderItemId, deliveredOrderItemIds));
	const reviewedIds = new Set(reviewedRows.map((row) => row.orderItemId));
	const remainingRows = deliveredRows.filter((row) => !reviewedIds.has(row.orderItemId));
	if (remainingRows.length === 0) return {
		productId,
		canReview: false,
		eligibleDeliveredItems: deliveredRows.length,
		remainingReviewSlots: 0,
		reason: "already_reviewed",
		orderId: null,
		orderItemId: null
	};
	const candidate = remainingRows[0];
	return {
		productId,
		canReview: true,
		eligibleDeliveredItems: deliveredRows.length,
		remainingReviewSlots: remainingRows.length,
		reason: "eligible",
		orderId: candidate?.orderId ?? null,
		orderItemId: candidate?.orderItemId ?? null
	};
}
async function recalculateProductReviewAggregates(productId, tx) {
	const client = getClient(tx);
	const [row] = await client.select({
		averageRating: sql`coalesce(avg(${productReviews.rating})::float, 0)::float`,
		reviewCount: sql`count(*)::int`
	}).from(productReviews).where(and(eq(productReviews.productId, productId), eq(productReviews.status, "published")));
	await client.update(products).set({
		ratingAvg: Number(row?.averageRating ?? 0),
		ratingCount: Number(row?.reviewCount ?? 0)
	}).where(eq(products.id, productId));
}
async function recalculateVendorReviewAggregates(vendorId, tx) {
	const client = getClient(tx);
	const [row] = await client.select({
		averageRating: sql`coalesce(avg(${productReviews.rating})::float, 0)::float`,
		reviewCount: sql`count(*)::int`
	}).from(productReviews).where(and(eq(productReviews.vendorId, vendorId), eq(productReviews.status, "published")));
	await client.update(vendors).set({
		ratingAvg: Number(row?.averageRating ?? 0),
		ratingCount: Number(row?.reviewCount ?? 0)
	}).where(eq(vendors.id, vendorId));
}
async function syncReviewAggregatesByProduct(productId, tx) {
	const client = getClient(tx);
	const [product] = await client.select({
		id: products.id,
		vendorId: products.vendorId
	}).from(products).where(eq(products.id, productId)).limit(1);
	if (!product) return;
	await recalculateProductReviewAggregates(product.id, client);
	await recalculateVendorReviewAggregates(product.vendorId, client);
}
async function syncReviewVoteCounts(reviewId, tx) {
	const client = getClient(tx);
	const [voteStats] = await client.select({
		helpfulCount: sql`coalesce(sum(case when ${reviewVotes.voteType} = 'helpful' then 1 else 0 end), 0)::int`,
		notHelpfulCount: sql`coalesce(sum(case when ${reviewVotes.voteType} = 'not_helpful' then 1 else 0 end), 0)::int`
	}).from(reviewVotes).where(eq(reviewVotes.reviewId, reviewId));
	await client.update(productReviews).set({
		helpfulCount: Number(voteStats?.helpfulCount ?? 0),
		notHelpfulCount: Number(voteStats?.notHelpfulCount ?? 0)
	}).where(eq(productReviews.id, reviewId));
}

//#endregion
//#region src/routes/reviews.ts
const productIdParamSchema = z.object({ productId: z.string().uuid() });
const reviewIdParamSchema$2 = z.object({ reviewId: z.string().uuid() });
const reviewsRouter = new Hono().get("/products/:productId/summary", describeRoute({
	tags: ["Reviews"],
	summary: "Get product review summary",
	description: "Returns average rating, total reviews, and star distribution for one product.",
	responses: { 200: {
		description: "Review summary",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("param", productIdParamSchema), async (c) => {
	const { productId } = c.req.valid("param");
	const [summary] = await db.select({
		averageRating: sql`coalesce(avg(${productReviews.rating})::float, 0)::float`,
		totalReviews: sql`count(*)::int`
	}).from(productReviews).where(and(eq(productReviews.productId, productId), eq(productReviews.status, "published")));
	const distributionRows = await db.select({
		rating: productReviews.rating,
		count: sql`count(*)::int`
	}).from(productReviews).where(and(eq(productReviews.productId, productId), eq(productReviews.status, "published"))).groupBy(productReviews.rating);
	const countByStar = new Map(distributionRows.map((row) => [row.rating, Number(row.count)]));
	const totalReviews = Number(summary?.totalReviews ?? 0);
	const response = {
		productId,
		averageRating: Number(summary?.averageRating ?? 0),
		totalReviews,
		distribution: [
			5,
			4,
			3,
			2,
			1
		].map((stars) => {
			const count$1 = countByStar.get(stars) ?? 0;
			return {
				stars,
				count: count$1,
				percentage: totalReviews > 0 ? Math.round(count$1 / totalReviews * 100) : 0
			};
		})
	};
	return c.json(response, 200);
}).get("/products/:productId", describeRoute({
	tags: ["Reviews"],
	summary: "Get product reviews",
	description: "Returns paginated published reviews for one product.",
	responses: { 200: {
		description: "Review list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("param", productIdParamSchema), zValidator("query", reviewListQuerySchema), async (c) => {
	const { productId } = c.req.valid("param");
	const { page, limit, sort, rating } = c.req.valid("query");
	const userId = c.var.user?.id ?? null;
	const offset = (page - 1) * limit;
	const conditions = [eq(productReviews.productId, productId), eq(productReviews.status, "published")];
	if (rating !== void 0) conditions.push(eq(productReviews.rating, rating));
	const total = await db.$count(productReviews, and(...conditions));
	const totalPages = Math.ceil(total / limit);
	let orderByClause = [desc(productReviews.createdAt)];
	if (sort === "highest") orderByClause = [desc(productReviews.rating), desc(productReviews.createdAt)];
	else if (sort === "lowest") orderByClause = [asc(productReviews.rating), desc(productReviews.createdAt)];
	else if (sort === "helpful") orderByClause = [desc(productReviews.helpfulCount), desc(productReviews.createdAt)];
	const rows = await db.select({
		reviewId: productReviews.id,
		productId: productReviews.productId,
		productTitle: products.title,
		productSlug: products.slug,
		vendorId: productReviews.vendorId,
		vendorName: vendors.name,
		userId: productReviews.userId,
		rating: productReviews.rating,
		title: productReviews.title,
		content: productReviews.content,
		status: productReviews.status,
		helpfulCount: productReviews.helpfulCount,
		notHelpfulCount: productReviews.notHelpfulCount,
		isVerifiedPurchase: productReviews.isVerifiedPurchase,
		createdAt: productReviews.createdAt,
		updatedAt: productReviews.updatedAt,
		authorName: user.name,
		authorEmail: user.email,
		authorAvatar: user.image,
		replyId: reviewReplies.id,
		replyContent: reviewReplies.content,
		replyCreatedAt: reviewReplies.createdAt
	}).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(vendors, eq(productReviews.vendorId, vendors.id)).innerJoin(user, eq(productReviews.userId, user.id)).leftJoin(reviewReplies, eq(reviewReplies.reviewId, productReviews.id)).where(and(...conditions)).orderBy(...orderByClause).limit(limit).offset(offset);
	const reviewIds = rows.map((row) => row.reviewId);
	const voteMap = /* @__PURE__ */ new Map();
	if (userId && reviewIds.length > 0) {
		const votes = await db.select({
			reviewId: reviewVotes.reviewId,
			voteType: reviewVotes.voteType
		}).from(reviewVotes).where(and(eq(reviewVotes.userId, userId), inArray(reviewVotes.reviewId, reviewIds)));
		for (const vote of votes) voteMap.set(vote.reviewId, vote.voteType);
	}
	const response = {
		items: rows.map((row) => ({
			id: row.reviewId,
			productId: row.productId,
			productTitle: row.productTitle,
			productSlug: row.productSlug,
			vendorId: row.vendorId,
			vendorName: row.vendorName,
			userId: row.userId,
			rating: row.rating,
			title: row.title,
			content: row.content,
			status: row.status,
			helpfulCount: row.helpfulCount,
			notHelpfulCount: row.notHelpfulCount,
			isVerifiedPurchase: row.isVerifiedPurchase,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
			author: {
				userId: row.userId,
				name: row.authorName,
				email: row.authorEmail,
				avatar: row.authorAvatar
			},
			reply: row.replyId ? {
				id: row.replyId,
				vendorId: row.vendorId,
				vendorName: row.vendorName,
				content: row.replyContent || "",
				createdAt: row.replyCreatedAt?.toISOString() ?? row.createdAt.toISOString()
			} : null,
			viewerVote: voteMap.get(row.reviewId) ?? null
		})),
		total,
		page,
		limit,
		totalPages
	};
	return c.json(response, 200);
}).get("/products/:productId/eligibility", describeRoute({
	tags: ["Reviews"],
	summary: "Check review eligibility",
	description: "Checks if current user can submit a verified-purchase review for a product.",
	responses: { 200: {
		description: "Eligibility result",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("param", productIdParamSchema), async (c) => {
	const userId = c.var.user?.id ?? null;
	const { productId } = c.req.valid("param");
	const eligibility = await getReviewEligibility(userId, productId);
	const response = {
		productId: eligibility.productId,
		canReview: eligibility.canReview,
		eligibleDeliveredItems: eligibility.eligibleDeliveredItems,
		remainingReviewSlots: eligibility.remainingReviewSlots,
		reason: eligibility.reason
	};
	return c.json(response, 200);
}).post("/", describeRoute({
	tags: ["Reviews"],
	summary: "Create review",
	description: "Create verified-buyer review. Allowed only for delivered order items that were not reviewed before.",
	responses: { 201: {
		description: "Review created",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("json", createReviewSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const payload = c.req.valid("json");
	const [product] = await db.select({
		id: products.id,
		vendorId: products.vendorId,
		title: products.title,
		isActive: products.isActive,
		status: products.status
	}).from(products).where(eq(products.id, payload.productId)).limit(1);
	if (!product || !product.isActive || product.status !== "approved") return c.json({ error: "Product not found" }, 404);
	const eligibility = await getReviewEligibility(userId, payload.productId);
	if (!eligibility.canReview || !eligibility.orderId || !eligibility.orderItemId) return c.json({
		error: "Not eligible to review",
		reason: eligibility.reason
	}, 403);
	let review;
	try {
		[review] = await db.transaction(async (tx) => {
			const [created] = await tx.insert(productReviews).values({
				productId: payload.productId,
				vendorId: product.vendorId,
				userId,
				orderId: eligibility.orderId,
				orderItemId: eligibility.orderItemId,
				rating: payload.rating,
				title: payload.title ?? null,
				content: payload.content,
				status: "published"
			}).returning();
			if (!created) throw new Error("Failed to create review");
			await syncReviewAggregatesByProduct(payload.productId, tx);
			return [created];
		});
	} catch (error$1) {
		if ((error$1 instanceof Error ? error$1.message.toLowerCase() : String(error$1)).includes("product_reviews_order_item_unique")) return c.json({ error: "Review already exists for this delivered item" }, 409);
		throw error$1;
	}
	if (!review) return c.json({ error: "Failed to create review" }, 500);
	notifyVendor(product.vendorId, {
		type: "new_review",
		title: "New review received",
		body: `${product.title} received a ${payload.rating}-star review`,
		data: {
			reviewId: review.id,
			productId: payload.productId,
			rating: payload.rating
		}
	});
	return c.json({ id: review.id }, 201);
}).patch("/:reviewId", describeRoute({
	tags: ["Reviews"],
	summary: "Update own review",
	description: "Allows review author to update rating/title/content.",
	responses: { 200: {
		description: "Review updated",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("param", reviewIdParamSchema$2), zValidator("json", updateReviewSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { reviewId } = c.req.valid("param");
	const payload = c.req.valid("json");
	const [existing] = await db.select({
		id: productReviews.id,
		productId: productReviews.productId,
		status: productReviews.status
	}).from(productReviews).where(and(eq(productReviews.id, reviewId), eq(productReviews.userId, userId))).limit(1);
	if (!existing) return c.json({ error: "Review not found" }, 404);
	if (existing.status === "removed") return c.json({ error: "Removed reviews cannot be updated" }, 400);
	const setPayload = {};
	if (payload.rating !== void 0) setPayload.rating = payload.rating;
	if (payload.title !== void 0) setPayload.title = payload.title || null;
	if (payload.content !== void 0) setPayload.content = payload.content;
	if (Object.keys(setPayload).length === 0) return c.json({ success: true }, 200);
	await db.update(productReviews).set(setPayload).where(eq(productReviews.id, reviewId));
	if (payload.rating !== void 0) await syncReviewAggregatesByProduct(existing.productId);
	return c.json({ success: true }, 200);
}).delete("/:reviewId", describeRoute({
	tags: ["Reviews"],
	summary: "Delete own review",
	description: "Soft-removes a review by changing status to removed.",
	responses: { 200: {
		description: "Review removed",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("param", reviewIdParamSchema$2), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { reviewId } = c.req.valid("param");
	const [existing] = await db.select({
		id: productReviews.id,
		productId: productReviews.productId
	}).from(productReviews).where(and(eq(productReviews.id, reviewId), eq(productReviews.userId, userId))).limit(1);
	if (!existing) return c.json({ error: "Review not found" }, 404);
	await db.update(productReviews).set({
		status: "removed",
		moderationReason: "deleted_by_author"
	}).where(eq(productReviews.id, reviewId));
	await syncReviewAggregatesByProduct(existing.productId);
	return c.json({ success: true }, 200);
}).post("/:reviewId/vote", describeRoute({
	tags: ["Reviews"],
	summary: "Vote review helpfulness",
	description: "Adds or updates current user's helpful/not-helpful vote.",
	responses: { 200: {
		description: "Vote stored",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("param", reviewIdParamSchema$2), zValidator("json", reviewVoteSchema), async (c) => {
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { reviewId } = c.req.valid("param");
	const { voteType } = c.req.valid("json");
	const [review] = await db.select({
		id: productReviews.id,
		userId: productReviews.userId
	}).from(productReviews).where(and(eq(productReviews.id, reviewId), eq(productReviews.status, "published"))).limit(1);
	if (!review) return c.json({ error: "Review not found" }, 404);
	if (review.userId === userId) return c.json({ error: "Cannot vote on your own review" }, 400);
	await db.insert(reviewVotes).values({
		reviewId,
		userId,
		voteType
	}).onConflictDoUpdate({
		target: [reviewVotes.reviewId, reviewVotes.userId],
		set: { voteType }
	});
	await syncReviewVoteCounts(reviewId);
	return c.json({ success: true }, 200);
});

//#endregion
//#region src/routes/vendor-dashboard-reviews.ts
const reviewIdParamSchema$1 = z.object({ reviewId: z.string().uuid() });
const vendorDashboardReviewsRouter = new Hono().use("*", vendorAuthMiddleware).get("/reviews/overview", describeRoute({
	tags: ["Vendor Dashboard Reviews"],
	summary: "Get vendor review dashboard overview",
	description: "Returns review score, customer segments, and star distribution for the current vendor.",
	responses: { 200: {
		description: "Vendor review overview",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), async (c) => {
	const vendorId = c.var.vendorId;
	const cutoff = /* @__PURE__ */ new Date();
	cutoff.setDate(cutoff.getDate() - 30);
	const [summary] = await db.select({
		averageRating: sql`coalesce(avg(${productReviews.rating})::float, 0)::float`,
		totalReviews: sql`count(*)::int`
	}).from(productReviews).where(and(eq(productReviews.vendorId, vendorId), eq(productReviews.status, "published")));
	const customerRows = await db.select({
		userId: productReviews.userId,
		firstReviewAt: sql`min(${productReviews.createdAt})`
	}).from(productReviews).where(and(eq(productReviews.vendorId, vendorId), eq(productReviews.status, "published"))).groupBy(productReviews.userId);
	const totalCustomers = customerRows.length;
	const newCustomers = customerRows.filter((row) => row.firstReviewAt && new Date(row.firstReviewAt) >= cutoff).length;
	const regularCustomers = Math.max(0, totalCustomers - newCustomers);
	const distributionRows = await db.select({
		rating: productReviews.rating,
		count: sql`count(*)::int`
	}).from(productReviews).where(and(eq(productReviews.vendorId, vendorId), eq(productReviews.status, "published"))).groupBy(productReviews.rating);
	const totalReviews = Number(summary?.totalReviews ?? 0);
	const countByStar = new Map(distributionRows.map((row) => [row.rating, Number(row.count)]));
	const response = {
		reviewScore: Number(summary?.averageRating ?? 0),
		totalCustomers,
		newCustomersPercent: totalCustomers > 0 ? Math.round(newCustomers / totalCustomers * 100) : 0,
		regularCustomersPercent: totalCustomers > 0 ? Math.round(regularCustomers / totalCustomers * 100) : 0,
		totalReviews,
		distribution: [
			5,
			4,
			3,
			2,
			1
		].map((stars) => {
			const count$1 = countByStar.get(stars) ?? 0;
			return {
				stars,
				count: count$1,
				percentage: totalReviews > 0 ? Math.round(count$1 / totalReviews * 100) : 0
			};
		})
	};
	return c.json(response, 200);
}).get("/reviews", describeRoute({
	tags: ["Vendor Dashboard Reviews"],
	summary: "Get vendor review list",
	description: "Returns paginated reviews for products that belong to the current vendor.",
	responses: { 200: {
		description: "Review list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", vendorReviewListQuerySchema), async (c) => {
	const vendorId = c.var.vendorId;
	const { page, limit, sort, rating, status, search } = c.req.valid("query");
	const offset = (page - 1) * limit;
	const whereConditions = [eq(productReviews.vendorId, vendorId)];
	if (status !== "all") whereConditions.push(eq(productReviews.status, status));
	if (rating !== void 0) whereConditions.push(eq(productReviews.rating, rating));
	if (search && search.trim().length > 0) {
		const pattern = `%${search.trim()}%`;
		whereConditions.push(or(ilike(productReviews.content, pattern), ilike(products.title, pattern), ilike(user.name, pattern)));
	}
	const [countRow] = await db.select({ count: sql`count(*)::int` }).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(user, eq(productReviews.userId, user.id)).where(and(...whereConditions));
	const total = Number(countRow?.count ?? 0);
	const totalPages = Math.ceil(total / limit);
	let orderByClause = [desc(productReviews.createdAt)];
	if (sort === "highest") orderByClause = [desc(productReviews.rating), desc(productReviews.createdAt)];
	else if (sort === "lowest") orderByClause = [asc(productReviews.rating), desc(productReviews.createdAt)];
	else if (sort === "helpful") orderByClause = [desc(productReviews.helpfulCount), desc(productReviews.createdAt)];
	const rows = await db.select({
		reviewId: productReviews.id,
		productId: productReviews.productId,
		productTitle: products.title,
		productSlug: products.slug,
		vendorId: productReviews.vendorId,
		vendorName: vendors.name,
		userId: productReviews.userId,
		rating: productReviews.rating,
		title: productReviews.title,
		content: productReviews.content,
		status: productReviews.status,
		helpfulCount: productReviews.helpfulCount,
		notHelpfulCount: productReviews.notHelpfulCount,
		isVerifiedPurchase: productReviews.isVerifiedPurchase,
		createdAt: productReviews.createdAt,
		updatedAt: productReviews.updatedAt,
		authorName: user.name,
		authorEmail: user.email,
		authorAvatar: user.image,
		replyId: reviewReplies.id,
		replyContent: reviewReplies.content,
		replyCreatedAt: reviewReplies.createdAt
	}).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(vendors, eq(productReviews.vendorId, vendors.id)).innerJoin(user, eq(productReviews.userId, user.id)).leftJoin(reviewReplies, eq(reviewReplies.reviewId, productReviews.id)).where(and(...whereConditions)).orderBy(...orderByClause).limit(limit).offset(offset);
	const productIds = Array.from(new Set(rows.map((row) => row.productId)));
	const images = productIds.length > 0 ? await db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key
	}).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder)) : [];
	const imageMap = /* @__PURE__ */ new Map();
	for (const image of images) if (!imageMap.has(image.productId)) imageMap.set(image.productId, getS3Url(image.s3Key));
	const response = {
		reviews: rows.map((row) => ({
			id: row.reviewId,
			productId: row.productId,
			productTitle: row.productTitle,
			productSlug: row.productSlug,
			vendorId: row.vendorId,
			vendorName: row.vendorName,
			userId: row.userId,
			rating: row.rating,
			title: row.title,
			content: row.content,
			status: row.status,
			helpfulCount: row.helpfulCount,
			notHelpfulCount: row.notHelpfulCount,
			isVerifiedPurchase: row.isVerifiedPurchase,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
			author: {
				userId: row.userId,
				name: row.authorName,
				email: row.authorEmail,
				avatar: row.authorAvatar
			},
			reply: row.replyId ? {
				id: row.replyId,
				vendorId: row.vendorId,
				vendorName: row.vendorName,
				content: row.replyContent || "",
				createdAt: row.replyCreatedAt?.toISOString() ?? row.createdAt.toISOString()
			} : null,
			viewerVote: null,
			productImageUrl: imageMap.get(row.productId) ?? null
		})),
		total,
		page,
		limit,
		totalPages
	};
	return c.json(response, 200);
}).post("/reviews/:reviewId/reply", describeRoute({
	tags: ["Vendor Dashboard Reviews"],
	summary: "Reply to review",
	description: "Creates or updates vendor's public reply to one review.",
	responses: { 200: {
		description: "Reply saved",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("param", reviewIdParamSchema$1), zValidator("json", vendorReplySchema), async (c) => {
	const vendorId = c.var.vendorId;
	const userId = c.var.user?.id;
	if (!userId) return c.json({ error: "Unauthorized" }, 401);
	const { reviewId } = c.req.valid("param");
	const { content } = c.req.valid("json");
	const [review] = await db.select({
		id: productReviews.id,
		status: productReviews.status,
		vendorId: productReviews.vendorId
	}).from(productReviews).where(eq(productReviews.id, reviewId)).limit(1);
	if (!review || review.vendorId !== vendorId) return c.json({ error: "Review not found" }, 404);
	if (review.status === "removed") return c.json({ error: "Cannot reply to removed review" }, 400);
	await db.transaction(async (tx) => {
		await tx.insert(reviewReplies).values({
			reviewId,
			vendorId,
			userId,
			content
		}).onConflictDoUpdate({
			target: reviewReplies.reviewId,
			set: {
				content,
				userId,
				vendorId
			}
		});
		await tx.update(productReviews).set({ vendorRepliedAt: /* @__PURE__ */ new Date() }).where(eq(productReviews.id, reviewId));
	});
	return c.json({ success: true }, 200);
});

//#endregion
//#region src/routes/admin-reviews.ts
const reviewIdParamSchema = z.object({ reviewId: z.string().uuid() });
const adminReviewsRouter = new Hono().use("*", adminAuthMiddleware).get("/reviews/analytics", describeRoute({
	tags: ["Admin Reviews"],
	summary: "Get review analytics",
	description: "Platform-wide review analytics for admin dashboard.",
	responses: { 200: {
		description: "Analytics data",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminReviewAnalyticsQuerySchema), async (c) => {
	const { days } = c.req.valid("query");
	const since = /* @__PURE__ */ new Date();
	since.setDate(since.getDate() - days);
	const [summary] = await db.select({
		totalReviews: sql`count(*)::int`,
		publishedReviews: sql`sum(case when ${productReviews.status} = 'published' then 1 else 0 end)::int`,
		hiddenOrRemovedReviews: sql`sum(case when ${productReviews.status} in ('hidden', 'removed') then 1 else 0 end)::int`,
		averageRating: sql`coalesce(avg(case when ${productReviews.status} = 'published' then ${productReviews.rating} end)::float, 0)::float`
	}).from(productReviews).where(gte(productReviews.createdAt, since));
	const distributionRows = await db.select({
		rating: productReviews.rating,
		count: sql`count(*)::int`
	}).from(productReviews).where(and(gte(productReviews.createdAt, since), eq(productReviews.status, "published"))).groupBy(productReviews.rating);
	const totalPublished = Number(summary?.publishedReviews ?? 0);
	const distributionMap = new Map(distributionRows.map((row) => [row.rating, Number(row.count)]));
	const topRows = await db.select({
		productId: products.id,
		productTitle: products.title,
		vendorId: vendors.id,
		vendorName: vendors.name,
		averageRating: sql`coalesce(avg(${productReviews.rating})::float, 0)::float`,
		reviewCount: sql`count(*)::int`
	}).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(vendors, eq(productReviews.vendorId, vendors.id)).where(and(gte(productReviews.createdAt, since), eq(productReviews.status, "published"))).groupBy(products.id, products.title, vendors.id, vendors.name).having(sql`count(*) >= 3`).orderBy(desc(sql`avg(${productReviews.rating})`), desc(sql`count(*)`)).limit(8);
	const lowRows = await db.select({
		productId: products.id,
		productTitle: products.title,
		vendorId: vendors.id,
		vendorName: vendors.name,
		averageRating: sql`coalesce(avg(${productReviews.rating})::float, 0)::float`,
		reviewCount: sql`count(*)::int`
	}).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(vendors, eq(productReviews.vendorId, vendors.id)).where(and(gte(productReviews.createdAt, since), eq(productReviews.status, "published"))).groupBy(products.id, products.title, vendors.id, vendors.name).having(sql`count(*) >= 3`).orderBy(asc(sql`avg(${productReviews.rating})`), desc(sql`count(*)`)).limit(8);
	const response = {
		timeRangeDays: days,
		totalReviews: Number(summary?.totalReviews ?? 0),
		publishedReviews: totalPublished,
		hiddenOrRemovedReviews: Number(summary?.hiddenOrRemovedReviews ?? 0),
		averageRating: Number(summary?.averageRating ?? 0),
		distribution: [
			5,
			4,
			3,
			2,
			1
		].map((stars) => {
			const count$1 = distributionMap.get(stars) ?? 0;
			return {
				stars,
				count: count$1,
				percentage: totalPublished > 0 ? Math.round(count$1 / totalPublished * 100) : 0
			};
		}),
		topRatedProducts: topRows.map((row) => ({
			productId: row.productId,
			productTitle: row.productTitle,
			vendorId: row.vendorId,
			vendorName: row.vendorName,
			averageRating: Number(row.averageRating),
			reviewCount: Number(row.reviewCount)
		})),
		lowestRatedProducts: lowRows.map((row) => ({
			productId: row.productId,
			productTitle: row.productTitle,
			vendorId: row.vendorId,
			vendorName: row.vendorName,
			averageRating: Number(row.averageRating),
			reviewCount: Number(row.reviewCount)
		}))
	};
	return c.json(response, 200);
}).get("/reviews", describeRoute({
	tags: ["Admin Reviews"],
	summary: "Get global review list",
	description: "Returns paginated review list across all vendors/products.",
	responses: { 200: {
		description: "Review list",
		content: { "application/json": { schema: resolver(z.any()) } }
	} }
}), zValidator("query", adminReviewListQuerySchema), async (c) => {
	const { page, limit, sort, status, rating, vendorId, productId, search } = c.req.valid("query");
	const offset = (page - 1) * limit;
	const whereConditions = [];
	if (status !== "all") whereConditions.push(eq(productReviews.status, status));
	if (rating !== void 0) whereConditions.push(eq(productReviews.rating, rating));
	if (vendorId) whereConditions.push(eq(productReviews.vendorId, vendorId));
	if (productId) whereConditions.push(eq(productReviews.productId, productId));
	if (search && search.trim().length > 0) {
		const pattern = `%${search.trim()}%`;
		whereConditions.push(or(ilike(productReviews.content, pattern), ilike(products.title, pattern), ilike(vendors.name, pattern), ilike(user.name, pattern)));
	}
	const [countRow] = await db.select({ count: sql`count(*)::int` }).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(vendors, eq(productReviews.vendorId, vendors.id)).innerJoin(user, eq(productReviews.userId, user.id)).where(whereConditions.length > 0 ? and(...whereConditions) : void 0);
	const total = Number(countRow?.count ?? 0);
	const totalPages = Math.ceil(total / limit);
	let orderByClause = [desc(productReviews.createdAt)];
	if (sort === "highest") orderByClause = [desc(productReviews.rating), desc(productReviews.createdAt)];
	else if (sort === "lowest") orderByClause = [asc(productReviews.rating), desc(productReviews.createdAt)];
	else if (sort === "helpful") orderByClause = [desc(productReviews.helpfulCount), desc(productReviews.createdAt)];
	const rows = await db.select({
		reviewId: productReviews.id,
		productId: productReviews.productId,
		productTitle: products.title,
		productSlug: products.slug,
		vendorId: productReviews.vendorId,
		vendorName: vendors.name,
		userId: productReviews.userId,
		rating: productReviews.rating,
		title: productReviews.title,
		content: productReviews.content,
		status: productReviews.status,
		helpfulCount: productReviews.helpfulCount,
		notHelpfulCount: productReviews.notHelpfulCount,
		isVerifiedPurchase: productReviews.isVerifiedPurchase,
		createdAt: productReviews.createdAt,
		updatedAt: productReviews.updatedAt,
		authorName: user.name,
		authorEmail: user.email,
		authorAvatar: user.image,
		replyId: reviewReplies.id,
		replyContent: reviewReplies.content,
		replyCreatedAt: reviewReplies.createdAt,
		moderationReason: productReviews.moderationReason,
		moderationNote: productReviews.moderationNote,
		moderatedAt: productReviews.moderatedAt,
		moderatedBy: productReviews.moderatedBy
	}).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).innerJoin(vendors, eq(productReviews.vendorId, vendors.id)).innerJoin(user, eq(productReviews.userId, user.id)).leftJoin(reviewReplies, eq(reviewReplies.reviewId, productReviews.id)).where(whereConditions.length > 0 ? and(...whereConditions) : void 0).orderBy(...orderByClause).limit(limit).offset(offset);
	const productIds = Array.from(new Set(rows.map((row) => row.productId)));
	const images = productIds.length > 0 ? await db.select({
		productId: productImages.productId,
		s3Key: productImages.s3Key
	}).from(productImages).where(inArray(productImages.productId, productIds)).orderBy(asc(productImages.sortOrder)) : [];
	const imageMap = /* @__PURE__ */ new Map();
	for (const image of images) if (!imageMap.has(image.productId)) imageMap.set(image.productId, getS3Url(image.s3Key));
	const response = {
		reviews: rows.map((row) => ({
			id: row.reviewId,
			productId: row.productId,
			productTitle: row.productTitle,
			productSlug: row.productSlug,
			vendorId: row.vendorId,
			vendorName: row.vendorName,
			userId: row.userId,
			rating: row.rating,
			title: row.title,
			content: row.content,
			status: row.status,
			helpfulCount: row.helpfulCount,
			notHelpfulCount: row.notHelpfulCount,
			isVerifiedPurchase: row.isVerifiedPurchase,
			createdAt: row.createdAt.toISOString(),
			updatedAt: row.updatedAt.toISOString(),
			author: {
				userId: row.userId,
				name: row.authorName,
				email: row.authorEmail,
				avatar: row.authorAvatar
			},
			reply: row.replyId ? {
				id: row.replyId,
				vendorId: row.vendorId,
				vendorName: row.vendorName,
				content: row.replyContent || "",
				createdAt: row.replyCreatedAt?.toISOString() ?? row.createdAt.toISOString()
			} : null,
			viewerVote: null,
			productImageUrl: imageMap.get(row.productId) ?? null,
			moderationReason: row.moderationReason,
			moderationNote: row.moderationNote,
			moderatedAt: row.moderatedAt?.toISOString() ?? null,
			moderatedBy: row.moderatedBy
		})),
		total,
		page,
		limit,
		totalPages
	};
	return c.json(response, 200);
}).patch("/reviews/:reviewId/moderate", describeRoute({
	tags: ["Admin Reviews"],
	summary: "Moderate review",
	description: "Updates review status (published/hidden/removed) and stores moderation reason.",
	responses: { 200: {
		description: "Moderation updated",
		content: { "application/json": { schema: resolver(z.object({ success: z.boolean() })) } }
	} }
}), zValidator("param", reviewIdParamSchema), zValidator("json", adminModerateReviewSchema), async (c) => {
	const adminUserId = c.var.adminUserId;
	const { reviewId } = c.req.valid("param");
	const payload = c.req.valid("json");
	const [review] = await db.select({
		id: productReviews.id,
		productId: productReviews.productId,
		vendorId: productReviews.vendorId,
		status: productReviews.status,
		productTitle: products.title
	}).from(productReviews).innerJoin(products, eq(productReviews.productId, products.id)).where(eq(productReviews.id, reviewId)).limit(1);
	if (!review) return c.json({ error: "Review not found" }, 404);
	await db.transaction(async (tx) => {
		await tx.update(productReviews).set({
			status: payload.status,
			moderationReason: payload.moderationReason ?? null,
			moderationNote: payload.moderationNote ?? null,
			moderatedAt: /* @__PURE__ */ new Date(),
			moderatedBy: adminUserId
		}).where(eq(productReviews.id, reviewId));
		await tx.insert(adminAuditLog).values({
			adminUserId,
			action: "moderate_review",
			entityType: "product_review",
			entityId: reviewId,
			details: {
				fromStatus: review.status,
				toStatus: payload.status,
				moderationReason: payload.moderationReason ?? null
			}
		});
		if (review.status !== payload.status) await syncReviewAggregatesByProduct(review.productId, tx);
	});
	if (review.status !== payload.status && payload.status !== "published") notifyVendor(review.vendorId, {
		type: "review_moderated",
		title: "Review moderated",
		body: `A review on ${review.productTitle} was ${payload.status} by admin`,
		data: {
			reviewId,
			productId: review.productId,
			status: payload.status
		}
	});
	return c.json({ success: true }, 200);
});

//#endregion
//#region src/routes/site-settings.ts
const siteSettingsRouter = new Hono().get("/top-bar-announcement", describeRoute({
	tags: ["Site Settings"],
	summary: "Get top bar announcement",
	description: "Fetches the public top bar announcement message configured by admins.",
	responses: { 200: {
		description: "Top bar announcement",
		content: { "application/json": { schema: resolver(topBarAnnouncementSchema) } }
	} }
}), async (c) => {
	const [setting] = await db.select({ value: siteSettings.value }).from(siteSettings).where(eq(siteSettings.key, TOP_BAR_ANNOUNCEMENT_SETTING_KEY)).limit(1);
	if (!setting) return c.json(DEFAULT_TOP_BAR_ANNOUNCEMENT, 200);
	return c.json(parseTopBarAnnouncement(setting.value), 200);
});

//#endregion
//#region src/index.ts
const normalizeOrigin = (value) => value.replace(/\/+$/, "");
const getAllowedCorsOrigins = () => {
	return [normalizeOrigin(env.WEB_ORIGIN)];
};
const allowedCorsOrigins = getAllowedCorsOrigins();
const app = new Hono().use(logger()).use("*", async (c, next) => {
	if (c.req.path === "/healthz") {
		await next();
		return;
	}
	try {
		const now = /* @__PURE__ */ new Date();
		await db.delete(user).where(and(isNotNull(user.deletedAt), isNotNull(user.recoverUntil), lt(user.recoverUntil, now)));
		const session$1 = await auth.api.getSession({ headers: c.req.raw.headers });
		if (session$1) {
			const currentUser = (await db.select({
				id: user.id,
				deletedAt: user.deletedAt,
				recoverUntil: user.recoverUntil
			}).from(user).where(eq(user.id, session$1.user.id)).limit(1))[0];
			if (!currentUser) {
				c.set("user", null);
				await next();
				return;
			}
			if (currentUser.deletedAt && currentUser.recoverUntil && currentUser.recoverUntil >= now) await db.update(user).set({
				deletedAt: null,
				recoverUntil: null,
				updatedAt: now
			}).where(eq(user.id, currentUser.id));
			if (currentUser.deletedAt && currentUser.recoverUntil && currentUser.recoverUntil < now) {
				await db.delete(user).where(eq(user.id, currentUser.id));
				c.set("user", null);
				await next();
				return;
			}
			console.log(`[Session] Found session for user: ${session$1.user.email}`);
		} else console.log("[Session] No session found for request");
		c.set("user", session$1?.user ?? null);
	} catch (error$1) {
		console.error("[Session] Error retrieving session:", error$1);
		c.set("user", null);
	}
	await next();
}).use(secureHeaders()).use("/*", cors({
	origin: allowedCorsOrigins,
	allowMethods: [
		"GET",
		"POST",
		"PUT",
		"PATCH",
		"DELETE",
		"OPTIONS"
	],
	allowHeaders: [
		"Content-Type",
		"Authorization",
		"x-guest-id"
	],
	credentials: true
})).route("/api/auth", authRouter).route("/api/home", homeRouter).route("/api/catalog", catalogRouter).route("/api/categories", categoriesRouter).route("/api/products", productsRouter).route("/api/search", searchRouter).route("/api/newsletter", newsletterRouter).route("/api/category", categoryRouter).route("/api/recommendations", recommendationsRouter).route("/api/cart", cartRouter).route("/api/vendor", vendorRouter).route("/api/upload", uploadRouter).route("/api/shipping-addresses", shippingAddressesRouter).route("/api/orders", ordersRouter).route("/api/vendor-dashboard", vendorDashboardRouter).route("/api/admin", adminRouter).route("/api/admin-management", adminManagementRouter).route("/api/banners", bannersRouter).route("/api/site-settings", siteSettingsRouter).route("/api/notifications", notificationsRouter).route("/api/wishlist", wishlistRouter).route("/api/account", accountRouter).route("/api/reviews", reviewsRouter).route("/api/vendor-dashboard", vendorDashboardReviewsRouter).route("/api/admin", adminReviewsRouter).get("/", (c) => c.text("OK")).get("/healthz", (c) => c.text("OK")).on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
app.get("/openapi", openAPIRouteHandler(app, { documentation: {
	info: {
		title: "KineDao API",
		version: "1.0.0",
		description: "কিনেদাও (KineDao.com) - Multivendor baby products marketplace API with bilingual support (Bangla/English)"
	},
	servers: [{
		url: "http://localhost:3000",
		description: "Local Development Server"
	}]
} }));
app.get("/docs", Scalar({
	url: "/openapi",
	theme: "purple"
}));
console.log(`[BOOT] SMTP Email configured via ${env.SMTP_HOST} (From: ${env.EMAIL_FROM})`);
var src_default = {
	port: env.PORT || 3e3,
	hostname: "0.0.0.0",
	fetch: app.fetch
};
process.on("SIGTERM", async () => {
	console.log("[BOOT] SIGTERM received, shutting down gracefully...");
	await closeAllSSEConnections();
	process.exit(0);
});
process.on("SIGINT", async () => {
	console.log("[BOOT] SIGINT received, shutting down gracefully...");
	await closeAllSSEConnections();
	process.exit(0);
});

//#endregion
export { app, src_default as default };