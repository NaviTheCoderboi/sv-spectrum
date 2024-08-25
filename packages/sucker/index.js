#!/usr/bin/env node
var tt = Object.create;
var ie = Object.defineProperty;
var it = Object.getOwnPropertyDescriptor;
var nt = Object.getOwnPropertyNames;
var st = Object.getPrototypeOf,
	rt = Object.prototype.hasOwnProperty;
var ne = ((o) =>
	typeof require < 'u'
		? require
		: typeof Proxy < 'u'
			? new Proxy(o, {
					get: (e, t) => (typeof require < 'u' ? require : e)[t],
				})
			: o)(function (o) {
	if (typeof require < 'u') return require.apply(this, arguments);
	throw Error('Dynamic require of "' + o + '" is not supported');
});
var w = (o, e) => () => (e || o((e = { exports: {} }).exports, e), e.exports);
var ot = (o, e, t, i) => {
	if ((e && typeof e == 'object') || typeof e == 'function')
		for (let n of nt(e))
			!rt.call(o, n) &&
				n !== t &&
				ie(o, n, {
					get: () => e[n],
					enumerable: !(i = it(e, n)) || i.enumerable,
				});
	return o;
};
var f = (o, e, t) => (
	(t = o != null ? tt(st(o)) : {}),
	ot(
		e || !o || !o.__esModule
			? ie(t, 'default', { value: o, enumerable: !0 })
			: t,
		o,
	)
);
var A = w((T) => {
	'use strict';
	var $ = class extends Error {
			constructor(e, t, i) {
				super(i),
					Error.captureStackTrace(this, this.constructor),
					(this.name = this.constructor.name),
					(this.code = t),
					(this.exitCode = e),
					(this.nestedError = void 0);
			}
		},
		M = class extends $ {
			constructor(e) {
				super(1, 'commander.invalidArgument', e),
					Error.captureStackTrace(this, this.constructor),
					(this.name = this.constructor.name);
			}
		};
	T.CommanderError = $;
	T.InvalidArgumentError = M;
});
var S = w((P, re) => {
	'use strict';
	var se = f(A());
	re.exports;
	var { InvalidArgumentError: at } = se.default,
		N = class {
			constructor(e, t) {
				switch (
					((this.description = t || ''),
					(this.variadic = !1),
					(this.parseArg = void 0),
					(this.defaultValue = void 0),
					(this.defaultValueDescription = void 0),
					(this.argChoices = void 0),
					e[0])
				) {
					case '<':
						(this.required = !0), (this._name = e.slice(1, -1));
						break;
					case '[':
						(this.required = !1), (this._name = e.slice(1, -1));
						break;
					default:
						(this.required = !0), (this._name = e);
						break;
				}
				this._name.length > 3 &&
					this._name.slice(-3) === '...' &&
					((this.variadic = !0),
					(this._name = this._name.slice(0, -3)));
			}
			name() {
				return this._name;
			}
			_concatValue(e, t) {
				return t === this.defaultValue || !Array.isArray(t)
					? [e]
					: t.concat(e);
			}
			default(e, t) {
				return (
					(this.defaultValue = e),
					(this.defaultValueDescription = t),
					this
				);
			}
			argParser(e) {
				return (this.parseArg = e), this;
			}
			choices(e) {
				return (
					(this.argChoices = e.slice()),
					(this.parseArg = (t, i) => {
						if (!this.argChoices.includes(t))
							throw new at(
								`Allowed choices are ${this.argChoices.join(', ')}.`,
							);
						return this.variadic ? this._concatValue(t, i) : t;
					}),
					this
				);
			}
			argRequired() {
				return (this.required = !0), this;
			}
			argOptional() {
				return (this.required = !1), this;
			}
		};
	function lt(o) {
		let e = o.name() + (o.variadic === !0 ? '...' : '');
		return o.required ? '<' + e + '>' : '[' + e + ']';
	}
	P.Argument = N;
	P.humanReadableArgName = lt;
});
var I = w((ae, le) => {
	'use strict';
	var oe = f(S());
	le.exports;
	var { humanReadableArgName: ut } = oe.default,
		W = class {
			constructor() {
				(this.helpWidth = void 0),
					(this.sortSubcommands = !1),
					(this.sortOptions = !1),
					(this.showGlobalOptions = !1);
			}
			visibleCommands(e) {
				let t = e.commands.filter((n) => !n._hidden),
					i = e._getHelpCommand();
				return (
					i && !i._hidden && t.push(i),
					this.sortSubcommands &&
						t.sort((n, s) => n.name().localeCompare(s.name())),
					t
				);
			}
			compareOptions(e, t) {
				let i = (n) =>
					n.short
						? n.short.replace(/^-/, '')
						: n.long.replace(/^--/, '');
				return i(e).localeCompare(i(t));
			}
			visibleOptions(e) {
				let t = e.options.filter((n) => !n.hidden),
					i = e._getHelpOption();
				if (i && !i.hidden) {
					let n = i.short && e._findOption(i.short),
						s = i.long && e._findOption(i.long);
					!n && !s
						? t.push(i)
						: i.long && !s
							? t.push(e.createOption(i.long, i.description))
							: i.short &&
								!n &&
								t.push(e.createOption(i.short, i.description));
				}
				return this.sortOptions && t.sort(this.compareOptions), t;
			}
			visibleGlobalOptions(e) {
				if (!this.showGlobalOptions) return [];
				let t = [];
				for (let i = e.parent; i; i = i.parent) {
					let n = i.options.filter((s) => !s.hidden);
					t.push(...n);
				}
				return this.sortOptions && t.sort(this.compareOptions), t;
			}
			visibleArguments(e) {
				return (
					e._argsDescription &&
						e.registeredArguments.forEach((t) => {
							t.description =
								t.description ||
								e._argsDescription[t.name()] ||
								'';
						}),
					e.registeredArguments.find((t) => t.description)
						? e.registeredArguments
						: []
				);
			}
			subcommandTerm(e) {
				let t = e.registeredArguments.map((i) => ut(i)).join(' ');
				return (
					e._name +
					(e._aliases[0] ? '|' + e._aliases[0] : '') +
					(e.options.length ? ' [options]' : '') +
					(t ? ' ' + t : '')
				);
			}
			optionTerm(e) {
				return e.flags;
			}
			argumentTerm(e) {
				return e.name();
			}
			longestSubcommandTermLength(e, t) {
				return t
					.visibleCommands(e)
					.reduce(
						(i, n) => Math.max(i, t.subcommandTerm(n).length),
						0,
					);
			}
			longestOptionTermLength(e, t) {
				return t
					.visibleOptions(e)
					.reduce((i, n) => Math.max(i, t.optionTerm(n).length), 0);
			}
			longestGlobalOptionTermLength(e, t) {
				return t
					.visibleGlobalOptions(e)
					.reduce((i, n) => Math.max(i, t.optionTerm(n).length), 0);
			}
			longestArgumentTermLength(e, t) {
				return t
					.visibleArguments(e)
					.reduce((i, n) => Math.max(i, t.argumentTerm(n).length), 0);
			}
			commandUsage(e) {
				let t = e._name;
				e._aliases[0] && (t = t + '|' + e._aliases[0]);
				let i = '';
				for (let n = e.parent; n; n = n.parent) i = n.name() + ' ' + i;
				return i + t + ' ' + e.usage();
			}
			commandDescription(e) {
				return e.description();
			}
			subcommandDescription(e) {
				return e.summary() || e.description();
			}
			optionDescription(e) {
				let t = [];
				return (
					e.argChoices &&
						t.push(
							`choices: ${e.argChoices.map((i) => JSON.stringify(i)).join(', ')}`,
						),
					e.defaultValue !== void 0 &&
						(e.required ||
							e.optional ||
							(e.isBoolean() &&
								typeof e.defaultValue == 'boolean')) &&
						t.push(
							`default: ${e.defaultValueDescription || JSON.stringify(e.defaultValue)}`,
						),
					e.presetArg !== void 0 &&
						e.optional &&
						t.push(`preset: ${JSON.stringify(e.presetArg)}`),
					e.envVar !== void 0 && t.push(`env: ${e.envVar}`),
					t.length > 0
						? `${e.description} (${t.join(', ')})`
						: e.description
				);
			}
			argumentDescription(e) {
				let t = [];
				if (
					(e.argChoices &&
						t.push(
							`choices: ${e.argChoices.map((i) => JSON.stringify(i)).join(', ')}`,
						),
					e.defaultValue !== void 0 &&
						t.push(
							`default: ${e.defaultValueDescription || JSON.stringify(e.defaultValue)}`,
						),
					t.length > 0)
				) {
					let i = `(${t.join(', ')})`;
					return e.description ? `${e.description} ${i}` : i;
				}
				return e.description;
			}
			formatHelp(e, t) {
				let i = t.padWidth(e, t),
					n = t.helpWidth || 80,
					s = 2,
					r = 2;
				function l(m, C) {
					if (C) {
						let v = `${m.padEnd(i + r)}${C}`;
						return t.wrap(v, n - s, i + r);
					}
					return m;
				}
				function a(m) {
					return m
						.join(
							`
`,
						)
						.replace(/^/gm, ' '.repeat(s));
				}
				let u = [`Usage: ${t.commandUsage(e)}`, ''],
					h = t.commandDescription(e);
				h.length > 0 && (u = u.concat([t.wrap(h, n, 0), '']));
				let c = t
					.visibleArguments(e)
					.map((m) => l(t.argumentTerm(m), t.argumentDescription(m)));
				c.length > 0 && (u = u.concat(['Arguments:', a(c), '']));
				let g = t
					.visibleOptions(e)
					.map((m) => l(t.optionTerm(m), t.optionDescription(m)));
				if (
					(g.length > 0 && (u = u.concat(['Options:', a(g), ''])),
					this.showGlobalOptions)
				) {
					let m = t
						.visibleGlobalOptions(e)
						.map((C) => l(t.optionTerm(C), t.optionDescription(C)));
					m.length > 0 &&
						(u = u.concat(['Global Options:', a(m), '']));
				}
				let O = t
					.visibleCommands(e)
					.map((m) =>
						l(t.subcommandTerm(m), t.subcommandDescription(m)),
					);
				return (
					O.length > 0 && (u = u.concat(['Commands:', a(O), ''])),
					u.join(`
`)
				);
			}
			padWidth(e, t) {
				return Math.max(
					t.longestOptionTermLength(e, t),
					t.longestGlobalOptionTermLength(e, t),
					t.longestSubcommandTermLength(e, t),
					t.longestArgumentTermLength(e, t),
				);
			}
			wrap(e, t, i, n = 40) {
				let s =
						' \\f\\t\\v\xA0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF',
					r = new RegExp(`[\\n][${s}]+`);
				if (e.match(r)) return e;
				let l = t - i;
				if (l < n) return e;
				let a = e.slice(0, i),
					u = e.slice(i).replace(
						`\r
`,
						`
`,
					),
					h = ' '.repeat(i),
					g = '\\s\u200B',
					O = new RegExp(
						`
|.{1,${l - 1}}([${g}]|$)|[^${g}]+?([${g}]|$)`,
						'g',
					),
					m = u.match(O) || [];
				return (
					a +
					m.map((C, v) =>
						C ===
						`
`
							? ''
							: (v > 0 ? h : '') + C.trimEnd(),
					).join(`
`)
				);
			}
		};
	ae.Help = W;
});
var B = w((L, he) => {
	'use strict';
	var ue = f(A());
	he.exports;
	var { InvalidArgumentError: ht } = ue.default,
		R = class {
			constructor(e, t) {
				(this.flags = e),
					(this.description = t || ''),
					(this.required = e.includes('<')),
					(this.optional = e.includes('[')),
					(this.variadic = /\w\.\.\.[>\]]$/.test(e)),
					(this.mandatory = !1);
				let i = mt(e);
				(this.short = i.shortFlag),
					(this.long = i.longFlag),
					(this.negate = !1),
					this.long && (this.negate = this.long.startsWith('--no-')),
					(this.defaultValue = void 0),
					(this.defaultValueDescription = void 0),
					(this.presetArg = void 0),
					(this.envVar = void 0),
					(this.parseArg = void 0),
					(this.hidden = !1),
					(this.argChoices = void 0),
					(this.conflictsWith = []),
					(this.implied = void 0);
			}
			default(e, t) {
				return (
					(this.defaultValue = e),
					(this.defaultValueDescription = t),
					this
				);
			}
			preset(e) {
				return (this.presetArg = e), this;
			}
			conflicts(e) {
				return (
					(this.conflictsWith = this.conflictsWith.concat(e)), this
				);
			}
			implies(e) {
				let t = e;
				return (
					typeof e == 'string' && (t = { [e]: !0 }),
					(this.implied = Object.assign(this.implied || {}, t)),
					this
				);
			}
			env(e) {
				return (this.envVar = e), this;
			}
			argParser(e) {
				return (this.parseArg = e), this;
			}
			makeOptionMandatory(e = !0) {
				return (this.mandatory = !!e), this;
			}
			hideHelp(e = !0) {
				return (this.hidden = !!e), this;
			}
			_concatValue(e, t) {
				return t === this.defaultValue || !Array.isArray(t)
					? [e]
					: t.concat(e);
			}
			choices(e) {
				return (
					(this.argChoices = e.slice()),
					(this.parseArg = (t, i) => {
						if (!this.argChoices.includes(t))
							throw new ht(
								`Allowed choices are ${this.argChoices.join(', ')}.`,
							);
						return this.variadic ? this._concatValue(t, i) : t;
					}),
					this
				);
			}
			name() {
				return this.long
					? this.long.replace(/^--/, '')
					: this.short.replace(/^-/, '');
			}
			attributeName() {
				return ct(this.name().replace(/^no-/, ''));
			}
			is(e) {
				return this.short === e || this.long === e;
			}
			isBoolean() {
				return !this.required && !this.optional && !this.negate;
			}
		},
		q = class {
			constructor(e) {
				(this.positiveOptions = new Map()),
					(this.negativeOptions = new Map()),
					(this.dualOptions = new Set()),
					e.forEach((t) => {
						t.negate
							? this.negativeOptions.set(t.attributeName(), t)
							: this.positiveOptions.set(t.attributeName(), t);
					}),
					this.negativeOptions.forEach((t, i) => {
						this.positiveOptions.has(i) && this.dualOptions.add(i);
					});
			}
			valueFromOption(e, t) {
				let i = t.attributeName();
				if (!this.dualOptions.has(i)) return !0;
				let n = this.negativeOptions.get(i).presetArg,
					s = n !== void 0 ? n : !1;
				return t.negate === (s === e);
			}
		};
	function ct(o) {
		return o
			.split('-')
			.reduce((e, t) => e + t[0].toUpperCase() + t.slice(1));
	}
	function mt(o) {
		let e,
			t,
			i = o.split(/[ |,]+/);
		return (
			i.length > 1 && !/^[[<]/.test(i[1]) && (e = i.shift()),
			(t = i.shift()),
			!e && /^-[^-]$/.test(t) && ((e = t), (t = void 0)),
			{ shortFlag: e, longFlag: t }
		);
	}
	L.Option = R;
	L.DualOptions = q;
});
var me = w((ce) => {
	'use strict';
	function pt(o, e) {
		if (Math.abs(o.length - e.length) > 3)
			return Math.max(o.length, e.length);
		let t = [];
		for (let i = 0; i <= o.length; i++) t[i] = [i];
		for (let i = 0; i <= e.length; i++) t[0][i] = i;
		for (let i = 1; i <= e.length; i++)
			for (let n = 1; n <= o.length; n++) {
				let s = 1;
				o[n - 1] === e[i - 1] ? (s = 0) : (s = 1),
					(t[n][i] = Math.min(
						t[n - 1][i] + 1,
						t[n][i - 1] + 1,
						t[n - 1][i - 1] + s,
					)),
					n > 1 &&
						i > 1 &&
						o[n - 1] === e[i - 2] &&
						o[n - 2] === e[i - 1] &&
						(t[n][i] = Math.min(t[n][i], t[n - 2][i - 2] + 1));
			}
		return t[o.length][e.length];
	}
	function dt(o, e) {
		if (!e || e.length === 0) return '';
		e = Array.from(new Set(e));
		let t = o.startsWith('--');
		t && ((o = o.slice(2)), (e = e.map((r) => r.slice(2))));
		let i = [],
			n = 3,
			s = 0.4;
		return (
			e.forEach((r) => {
				if (r.length <= 1) return;
				let l = pt(o, r),
					a = Math.max(o.length, r.length);
				(a - l) / a > s &&
					(l < n ? ((n = l), (i = [r])) : l === n && i.push(r));
			}),
			i.sort((r, l) => r.localeCompare(l)),
			t && (i = i.map((r) => `--${r}`)),
			i.length > 1
				? `
(Did you mean one of ${i.join(', ')}?)`
				: i.length === 1
					? `
(Did you mean ${i[0]}?)`
					: ''
		);
	}
	ce.suggestSimilar = dt;
});
import ft from 'node:events';
import gt from 'node:child_process';
import _t from 'node:path';
import bt from 'node:fs';
import Ot from 'node:process';
var ye = w((xe, we) => {
	'use strict';
	var ge = f(S()),
		_e = f(A()),
		be = f(I()),
		Oe = f(B()),
		Ce = f(me());
	we.exports;
	var Ct = ft.EventEmitter,
		G = gt,
		x = _t,
		U = bt,
		p = Ot,
		{ Argument: xt, humanReadableArgName: wt } = ge.default,
		{ CommanderError: J } = _e.default,
		{ Help: yt } = be.default,
		{ Option: pe, DualOptions: vt } = Oe.default,
		{ suggestSimilar: de } = Ce.default,
		K = class o extends Ct {
			constructor(e) {
				super(),
					(this.commands = []),
					(this.options = []),
					(this.parent = null),
					(this._allowUnknownOption = !1),
					(this._allowExcessArguments = !0),
					(this.registeredArguments = []),
					(this._args = this.registeredArguments),
					(this.args = []),
					(this.rawArgs = []),
					(this.processedArgs = []),
					(this._scriptPath = null),
					(this._name = e || ''),
					(this._optionValues = {}),
					(this._optionValueSources = {}),
					(this._storeOptionsAsProperties = !1),
					(this._actionHandler = null),
					(this._executableHandler = !1),
					(this._executableFile = null),
					(this._executableDir = null),
					(this._defaultCommandName = null),
					(this._exitCallback = null),
					(this._aliases = []),
					(this._combineFlagAndOptionalValue = !0),
					(this._description = ''),
					(this._summary = ''),
					(this._argsDescription = void 0),
					(this._enablePositionalOptions = !1),
					(this._passThroughOptions = !1),
					(this._lifeCycleHooks = {}),
					(this._showHelpAfterError = !1),
					(this._showSuggestionAfterError = !0),
					(this._outputConfiguration = {
						writeOut: (t) => p.stdout.write(t),
						writeErr: (t) => p.stderr.write(t),
						getOutHelpWidth: () =>
							p.stdout.isTTY ? p.stdout.columns : void 0,
						getErrHelpWidth: () =>
							p.stderr.isTTY ? p.stderr.columns : void 0,
						outputError: (t, i) => i(t),
					}),
					(this._hidden = !1),
					(this._helpOption = void 0),
					(this._addImplicitHelpCommand = void 0),
					(this._helpCommand = void 0),
					(this._helpConfiguration = {});
			}
			copyInheritedSettings(e) {
				return (
					(this._outputConfiguration = e._outputConfiguration),
					(this._helpOption = e._helpOption),
					(this._helpCommand = e._helpCommand),
					(this._helpConfiguration = e._helpConfiguration),
					(this._exitCallback = e._exitCallback),
					(this._storeOptionsAsProperties =
						e._storeOptionsAsProperties),
					(this._combineFlagAndOptionalValue =
						e._combineFlagAndOptionalValue),
					(this._allowExcessArguments = e._allowExcessArguments),
					(this._enablePositionalOptions =
						e._enablePositionalOptions),
					(this._showHelpAfterError = e._showHelpAfterError),
					(this._showSuggestionAfterError =
						e._showSuggestionAfterError),
					this
				);
			}
			_getCommandAndAncestors() {
				let e = [];
				for (let t = this; t; t = t.parent) e.push(t);
				return e;
			}
			command(e, t, i) {
				let n = t,
					s = i;
				typeof n == 'object' && n !== null && ((s = n), (n = null)),
					(s = s || {});
				let [, r, l] = e.match(/([^ ]+) *(.*)/),
					a = this.createCommand(r);
				return (
					n && (a.description(n), (a._executableHandler = !0)),
					s.isDefault && (this._defaultCommandName = a._name),
					(a._hidden = !!(s.noHelp || s.hidden)),
					(a._executableFile = s.executableFile || null),
					l && a.arguments(l),
					this._registerCommand(a),
					(a.parent = this),
					a.copyInheritedSettings(this),
					n ? this : a
				);
			}
			createCommand(e) {
				return new o(e);
			}
			createHelp() {
				return Object.assign(new yt(), this.configureHelp());
			}
			configureHelp(e) {
				return e === void 0
					? this._helpConfiguration
					: ((this._helpConfiguration = e), this);
			}
			configureOutput(e) {
				return e === void 0
					? this._outputConfiguration
					: (Object.assign(this._outputConfiguration, e), this);
			}
			showHelpAfterError(e = !0) {
				return (
					typeof e != 'string' && (e = !!e),
					(this._showHelpAfterError = e),
					this
				);
			}
			showSuggestionAfterError(e = !0) {
				return (this._showSuggestionAfterError = !!e), this;
			}
			addCommand(e, t) {
				if (!e._name)
					throw new Error(`Command passed to .addCommand() must have a name
- specify the name in Command constructor or using .name()`);
				return (
					(t = t || {}),
					t.isDefault && (this._defaultCommandName = e._name),
					(t.noHelp || t.hidden) && (e._hidden = !0),
					this._registerCommand(e),
					(e.parent = this),
					e._checkForBrokenPassThrough(),
					this
				);
			}
			createArgument(e, t) {
				return new xt(e, t);
			}
			argument(e, t, i, n) {
				let s = this.createArgument(e, t);
				return (
					typeof i == 'function'
						? s.default(n).argParser(i)
						: s.default(i),
					this.addArgument(s),
					this
				);
			}
			arguments(e) {
				return (
					e
						.trim()
						.split(/ +/)
						.forEach((t) => {
							this.argument(t);
						}),
					this
				);
			}
			addArgument(e) {
				let t = this.registeredArguments.slice(-1)[0];
				if (t && t.variadic)
					throw new Error(
						`only the last argument can be variadic '${t.name()}'`,
					);
				if (
					e.required &&
					e.defaultValue !== void 0 &&
					e.parseArg === void 0
				)
					throw new Error(
						`a default value for a required argument is never used: '${e.name()}'`,
					);
				return this.registeredArguments.push(e), this;
			}
			helpCommand(e, t) {
				if (typeof e == 'boolean')
					return (this._addImplicitHelpCommand = e), this;
				e = e ?? 'help [command]';
				let [, i, n] = e.match(/([^ ]+) *(.*)/),
					s = t ?? 'display help for command',
					r = this.createCommand(i);
				return (
					r.helpOption(!1),
					n && r.arguments(n),
					s && r.description(s),
					(this._addImplicitHelpCommand = !0),
					(this._helpCommand = r),
					this
				);
			}
			addHelpCommand(e, t) {
				return typeof e != 'object'
					? (this.helpCommand(e, t), this)
					: ((this._addImplicitHelpCommand = !0),
						(this._helpCommand = e),
						this);
			}
			_getHelpCommand() {
				return (this._addImplicitHelpCommand ??
					(this.commands.length &&
						!this._actionHandler &&
						!this._findCommand('help')))
					? (this._helpCommand === void 0 &&
							this.helpCommand(void 0, void 0),
						this._helpCommand)
					: null;
			}
			hook(e, t) {
				let i = ['preSubcommand', 'preAction', 'postAction'];
				if (!i.includes(e))
					throw new Error(`Unexpected value for event passed to hook : '${e}'.
Expecting one of '${i.join("', '")}'`);
				return (
					this._lifeCycleHooks[e]
						? this._lifeCycleHooks[e].push(t)
						: (this._lifeCycleHooks[e] = [t]),
					this
				);
			}
			exitOverride(e) {
				return (
					e
						? (this._exitCallback = e)
						: (this._exitCallback = (t) => {
								if (
									t.code !==
									'commander.executeSubCommandAsync'
								)
									throw t;
							}),
					this
				);
			}
			_exit(e, t, i) {
				this._exitCallback && this._exitCallback(new J(e, t, i)),
					p.exit(e);
			}
			action(e) {
				let t = (i) => {
					let n = this.registeredArguments.length,
						s = i.slice(0, n);
					return (
						this._storeOptionsAsProperties
							? (s[n] = this)
							: (s[n] = this.opts()),
						s.push(this),
						e.apply(this, s)
					);
				};
				return (this._actionHandler = t), this;
			}
			createOption(e, t) {
				return new pe(e, t);
			}
			_callParseArg(e, t, i, n) {
				try {
					return e.parseArg(t, i);
				} catch (s) {
					if (s.code === 'commander.invalidArgument') {
						let r = `${n} ${s.message}`;
						this.error(r, { exitCode: s.exitCode, code: s.code });
					}
					throw s;
				}
			}
			_registerOption(e) {
				let t =
					(e.short && this._findOption(e.short)) ||
					(e.long && this._findOption(e.long));
				if (t) {
					let i =
						e.long && this._findOption(e.long) ? e.long : e.short;
					throw new Error(`Cannot add option '${e.flags}'${this._name && ` to command '${this._name}'`} due to conflicting flag '${i}'
-  already used by option '${t.flags}'`);
				}
				this.options.push(e);
			}
			_registerCommand(e) {
				let t = (n) => [n.name()].concat(n.aliases()),
					i = t(e).find((n) => this._findCommand(n));
				if (i) {
					let n = t(this._findCommand(i)).join('|'),
						s = t(e).join('|');
					throw new Error(
						`cannot add command '${s}' as already have command '${n}'`,
					);
				}
				this.commands.push(e);
			}
			addOption(e) {
				this._registerOption(e);
				let t = e.name(),
					i = e.attributeName();
				if (e.negate) {
					let s = e.long.replace(/^--no-/, '--');
					this._findOption(s) ||
						this.setOptionValueWithSource(
							i,
							e.defaultValue === void 0 ? !0 : e.defaultValue,
							'default',
						);
				} else
					e.defaultValue !== void 0 &&
						this.setOptionValueWithSource(
							i,
							e.defaultValue,
							'default',
						);
				let n = (s, r, l) => {
					s == null && e.presetArg !== void 0 && (s = e.presetArg);
					let a = this.getOptionValue(i);
					s !== null && e.parseArg
						? (s = this._callParseArg(e, s, a, r))
						: s !== null &&
							e.variadic &&
							(s = e._concatValue(s, a)),
						s == null &&
							(e.negate
								? (s = !1)
								: e.isBoolean() || e.optional
									? (s = !0)
									: (s = '')),
						this.setOptionValueWithSource(i, s, l);
				};
				return (
					this.on('option:' + t, (s) => {
						let r = `error: option '${e.flags}' argument '${s}' is invalid.`;
						n(s, r, 'cli');
					}),
					e.envVar &&
						this.on('optionEnv:' + t, (s) => {
							let r = `error: option '${e.flags}' value '${s}' from env '${e.envVar}' is invalid.`;
							n(s, r, 'env');
						}),
					this
				);
			}
			_optionEx(e, t, i, n, s) {
				if (typeof t == 'object' && t instanceof pe)
					throw new Error(
						'To add an Option object use addOption() instead of option() or requiredOption()',
					);
				let r = this.createOption(t, i);
				if (
					(r.makeOptionMandatory(!!e.mandatory),
					typeof n == 'function')
				)
					r.default(s).argParser(n);
				else if (n instanceof RegExp) {
					let l = n;
					(n = (a, u) => {
						let h = l.exec(a);
						return h ? h[0] : u;
					}),
						r.default(s).argParser(n);
				} else r.default(n);
				return this.addOption(r);
			}
			option(e, t, i, n) {
				return this._optionEx({}, e, t, i, n);
			}
			requiredOption(e, t, i, n) {
				return this._optionEx({ mandatory: !0 }, e, t, i, n);
			}
			combineFlagAndOptionalValue(e = !0) {
				return (this._combineFlagAndOptionalValue = !!e), this;
			}
			allowUnknownOption(e = !0) {
				return (this._allowUnknownOption = !!e), this;
			}
			allowExcessArguments(e = !0) {
				return (this._allowExcessArguments = !!e), this;
			}
			enablePositionalOptions(e = !0) {
				return (this._enablePositionalOptions = !!e), this;
			}
			passThroughOptions(e = !0) {
				return (
					(this._passThroughOptions = !!e),
					this._checkForBrokenPassThrough(),
					this
				);
			}
			_checkForBrokenPassThrough() {
				if (
					this.parent &&
					this._passThroughOptions &&
					!this.parent._enablePositionalOptions
				)
					throw new Error(
						`passThroughOptions cannot be used for '${this._name}' without turning on enablePositionalOptions for parent command(s)`,
					);
			}
			storeOptionsAsProperties(e = !0) {
				if (this.options.length)
					throw new Error(
						'call .storeOptionsAsProperties() before adding options',
					);
				if (Object.keys(this._optionValues).length)
					throw new Error(
						'call .storeOptionsAsProperties() before setting option values',
					);
				return (this._storeOptionsAsProperties = !!e), this;
			}
			getOptionValue(e) {
				return this._storeOptionsAsProperties
					? this[e]
					: this._optionValues[e];
			}
			setOptionValue(e, t) {
				return this.setOptionValueWithSource(e, t, void 0);
			}
			setOptionValueWithSource(e, t, i) {
				return (
					this._storeOptionsAsProperties
						? (this[e] = t)
						: (this._optionValues[e] = t),
					(this._optionValueSources[e] = i),
					this
				);
			}
			getOptionValueSource(e) {
				return this._optionValueSources[e];
			}
			getOptionValueSourceWithGlobals(e) {
				let t;
				return (
					this._getCommandAndAncestors().forEach((i) => {
						i.getOptionValueSource(e) !== void 0 &&
							(t = i.getOptionValueSource(e));
					}),
					t
				);
			}
			_prepareUserArgs(e, t) {
				if (e !== void 0 && !Array.isArray(e))
					throw new Error(
						'first parameter to parse must be array or undefined',
					);
				if (((t = t || {}), e === void 0 && t.from === void 0)) {
					p.versions?.electron && (t.from = 'electron');
					let n = p.execArgv ?? [];
					(n.includes('-e') ||
						n.includes('--eval') ||
						n.includes('-p') ||
						n.includes('--print')) &&
						(t.from = 'eval');
				}
				e === void 0 && (e = p.argv), (this.rawArgs = e.slice());
				let i;
				switch (t.from) {
					case void 0:
					case 'node':
						(this._scriptPath = e[1]), (i = e.slice(2));
						break;
					case 'electron':
						p.defaultApp
							? ((this._scriptPath = e[1]), (i = e.slice(2)))
							: (i = e.slice(1));
						break;
					case 'user':
						i = e.slice(0);
						break;
					case 'eval':
						i = e.slice(1);
						break;
					default:
						throw new Error(
							`unexpected parse option { from: '${t.from}' }`,
						);
				}
				return (
					!this._name &&
						this._scriptPath &&
						this.nameFromFilename(this._scriptPath),
					(this._name = this._name || 'program'),
					i
				);
			}
			parse(e, t) {
				let i = this._prepareUserArgs(e, t);
				return this._parseCommand([], i), this;
			}
			async parseAsync(e, t) {
				let i = this._prepareUserArgs(e, t);
				return await this._parseCommand([], i), this;
			}
			_executeSubCommand(e, t) {
				t = t.slice();
				let i = !1,
					n = ['.js', '.ts', '.tsx', '.mjs', '.cjs'];
				function s(h, c) {
					let g = x.resolve(h, c);
					if (U.existsSync(g)) return g;
					if (n.includes(x.extname(c))) return;
					let O = n.find((m) => U.existsSync(`${g}${m}`));
					if (O) return `${g}${O}`;
				}
				this._checkForMissingMandatoryOptions(),
					this._checkForConflictingOptions();
				let r = e._executableFile || `${this._name}-${e._name}`,
					l = this._executableDir || '';
				if (this._scriptPath) {
					let h;
					try {
						h = U.realpathSync(this._scriptPath);
					} catch {
						h = this._scriptPath;
					}
					l = x.resolve(x.dirname(h), l);
				}
				if (l) {
					let h = s(l, r);
					if (!h && !e._executableFile && this._scriptPath) {
						let c = x.basename(
							this._scriptPath,
							x.extname(this._scriptPath),
						);
						c !== this._name && (h = s(l, `${c}-${e._name}`));
					}
					r = h || r;
				}
				i = n.includes(x.extname(r));
				let a;
				p.platform !== 'win32'
					? i
						? (t.unshift(r),
							(t = fe(p.execArgv).concat(t)),
							(a = G.spawn(p.argv[0], t, { stdio: 'inherit' })))
						: (a = G.spawn(r, t, { stdio: 'inherit' }))
					: (t.unshift(r),
						(t = fe(p.execArgv).concat(t)),
						(a = G.spawn(p.execPath, t, { stdio: 'inherit' }))),
					a.killed ||
						[
							'SIGUSR1',
							'SIGUSR2',
							'SIGTERM',
							'SIGINT',
							'SIGHUP',
						].forEach((c) => {
							p.on(c, () => {
								a.killed === !1 &&
									a.exitCode === null &&
									a.kill(c);
							});
						});
				let u = this._exitCallback;
				a.on('close', (h) => {
					(h = h ?? 1),
						u
							? u(
									new J(
										h,
										'commander.executeSubCommandAsync',
										'(close)',
									),
								)
							: p.exit(h);
				}),
					a.on('error', (h) => {
						if (h.code === 'ENOENT') {
							let c = l
									? `searched for local subcommand relative to directory '${l}'`
									: 'no directory for search for local subcommand, use .executableDir() to supply a custom directory',
								g = `'${r}' does not exist
 - if '${e._name}' is not meant to be an executable command, remove description parameter from '.command()' and use '.description()' instead
 - if the default executable name is not suitable, use the executableFile option to supply a custom name or path
 - ${c}`;
							throw new Error(g);
						} else if (h.code === 'EACCES')
							throw new Error(`'${r}' not executable`);
						if (!u) p.exit(1);
						else {
							let c = new J(
								1,
								'commander.executeSubCommandAsync',
								'(error)',
							);
							(c.nestedError = h), u(c);
						}
					}),
					(this.runningCommand = a);
			}
			_dispatchSubcommand(e, t, i) {
				let n = this._findCommand(e);
				n || this.help({ error: !0 });
				let s;
				return (
					(s = this._chainOrCallSubCommandHook(
						s,
						n,
						'preSubcommand',
					)),
					(s = this._chainOrCall(s, () => {
						if (n._executableHandler)
							this._executeSubCommand(n, t.concat(i));
						else return n._parseCommand(t, i);
					})),
					s
				);
			}
			_dispatchHelpCommand(e) {
				e || this.help();
				let t = this._findCommand(e);
				return (
					t && !t._executableHandler && t.help(),
					this._dispatchSubcommand(
						e,
						[],
						[
							this._getHelpOption()?.long ??
								this._getHelpOption()?.short ??
								'--help',
						],
					)
				);
			}
			_checkNumberOfArguments() {
				this.registeredArguments.forEach((e, t) => {
					e.required &&
						this.args[t] == null &&
						this.missingArgument(e.name());
				}),
					!(
						this.registeredArguments.length > 0 &&
						this.registeredArguments[
							this.registeredArguments.length - 1
						].variadic
					) &&
						this.args.length > this.registeredArguments.length &&
						this._excessArguments(this.args);
			}
			_processArguments() {
				let e = (i, n, s) => {
					let r = n;
					if (n !== null && i.parseArg) {
						let l = `error: command-argument value '${n}' is invalid for argument '${i.name()}'.`;
						r = this._callParseArg(i, n, s, l);
					}
					return r;
				};
				this._checkNumberOfArguments();
				let t = [];
				this.registeredArguments.forEach((i, n) => {
					let s = i.defaultValue;
					i.variadic
						? n < this.args.length
							? ((s = this.args.slice(n)),
								i.parseArg &&
									(s = s.reduce(
										(r, l) => e(i, l, r),
										i.defaultValue,
									)))
							: s === void 0 && (s = [])
						: n < this.args.length &&
							((s = this.args[n]),
							i.parseArg && (s = e(i, s, i.defaultValue))),
						(t[n] = s);
				}),
					(this.processedArgs = t);
			}
			_chainOrCall(e, t) {
				return e && e.then && typeof e.then == 'function'
					? e.then(() => t())
					: t();
			}
			_chainOrCallHooks(e, t) {
				let i = e,
					n = [];
				return (
					this._getCommandAndAncestors()
						.reverse()
						.filter((s) => s._lifeCycleHooks[t] !== void 0)
						.forEach((s) => {
							s._lifeCycleHooks[t].forEach((r) => {
								n.push({ hookedCommand: s, callback: r });
							});
						}),
					t === 'postAction' && n.reverse(),
					n.forEach((s) => {
						i = this._chainOrCall(i, () =>
							s.callback(s.hookedCommand, this),
						);
					}),
					i
				);
			}
			_chainOrCallSubCommandHook(e, t, i) {
				let n = e;
				return (
					this._lifeCycleHooks[i] !== void 0 &&
						this._lifeCycleHooks[i].forEach((s) => {
							n = this._chainOrCall(n, () => s(this, t));
						}),
					n
				);
			}
			_parseCommand(e, t) {
				let i = this.parseOptions(t);
				if (
					(this._parseOptionsEnv(),
					this._parseOptionsImplied(),
					(e = e.concat(i.operands)),
					(t = i.unknown),
					(this.args = e.concat(t)),
					e && this._findCommand(e[0]))
				)
					return this._dispatchSubcommand(e[0], e.slice(1), t);
				if (
					this._getHelpCommand() &&
					e[0] === this._getHelpCommand().name()
				)
					return this._dispatchHelpCommand(e[1]);
				if (this._defaultCommandName)
					return (
						this._outputHelpIfRequested(t),
						this._dispatchSubcommand(this._defaultCommandName, e, t)
					);
				this.commands.length &&
					this.args.length === 0 &&
					!this._actionHandler &&
					!this._defaultCommandName &&
					this.help({ error: !0 }),
					this._outputHelpIfRequested(i.unknown),
					this._checkForMissingMandatoryOptions(),
					this._checkForConflictingOptions();
				let n = () => {
						i.unknown.length > 0 &&
							this.unknownOption(i.unknown[0]);
					},
					s = `command:${this.name()}`;
				if (this._actionHandler) {
					n(), this._processArguments();
					let r;
					return (
						(r = this._chainOrCallHooks(r, 'preAction')),
						(r = this._chainOrCall(r, () =>
							this._actionHandler(this.processedArgs),
						)),
						this.parent &&
							(r = this._chainOrCall(r, () => {
								this.parent.emit(s, e, t);
							})),
						(r = this._chainOrCallHooks(r, 'postAction')),
						r
					);
				}
				if (this.parent && this.parent.listenerCount(s))
					n(), this._processArguments(), this.parent.emit(s, e, t);
				else if (e.length) {
					if (this._findCommand('*'))
						return this._dispatchSubcommand('*', e, t);
					this.listenerCount('command:*')
						? this.emit('command:*', e, t)
						: this.commands.length
							? this.unknownCommand()
							: (n(), this._processArguments());
				} else
					this.commands.length
						? (n(), this.help({ error: !0 }))
						: (n(), this._processArguments());
			}
			_findCommand(e) {
				if (e)
					return this.commands.find(
						(t) => t._name === e || t._aliases.includes(e),
					);
			}
			_findOption(e) {
				return this.options.find((t) => t.is(e));
			}
			_checkForMissingMandatoryOptions() {
				this._getCommandAndAncestors().forEach((e) => {
					e.options.forEach((t) => {
						t.mandatory &&
							e.getOptionValue(t.attributeName()) === void 0 &&
							e.missingMandatoryOptionValue(t);
					});
				});
			}
			_checkForConflictingLocalOptions() {
				let e = this.options.filter((i) => {
					let n = i.attributeName();
					return this.getOptionValue(n) === void 0
						? !1
						: this.getOptionValueSource(n) !== 'default';
				});
				e.filter((i) => i.conflictsWith.length > 0).forEach((i) => {
					let n = e.find((s) =>
						i.conflictsWith.includes(s.attributeName()),
					);
					n && this._conflictingOption(i, n);
				});
			}
			_checkForConflictingOptions() {
				this._getCommandAndAncestors().forEach((e) => {
					e._checkForConflictingLocalOptions();
				});
			}
			parseOptions(e) {
				let t = [],
					i = [],
					n = t,
					s = e.slice();
				function r(a) {
					return a.length > 1 && a[0] === '-';
				}
				let l = null;
				for (; s.length; ) {
					let a = s.shift();
					if (a === '--') {
						n === i && n.push(a), n.push(...s);
						break;
					}
					if (l && !r(a)) {
						this.emit(`option:${l.name()}`, a);
						continue;
					}
					if (((l = null), r(a))) {
						let u = this._findOption(a);
						if (u) {
							if (u.required) {
								let h = s.shift();
								h === void 0 && this.optionMissingArgument(u),
									this.emit(`option:${u.name()}`, h);
							} else if (u.optional) {
								let h = null;
								s.length > 0 && !r(s[0]) && (h = s.shift()),
									this.emit(`option:${u.name()}`, h);
							} else this.emit(`option:${u.name()}`);
							l = u.variadic ? u : null;
							continue;
						}
					}
					if (a.length > 2 && a[0] === '-' && a[1] !== '-') {
						let u = this._findOption(`-${a[1]}`);
						if (u) {
							u.required ||
							(u.optional && this._combineFlagAndOptionalValue)
								? this.emit(`option:${u.name()}`, a.slice(2))
								: (this.emit(`option:${u.name()}`),
									s.unshift(`-${a.slice(2)}`));
							continue;
						}
					}
					if (/^--[^=]+=/.test(a)) {
						let u = a.indexOf('='),
							h = this._findOption(a.slice(0, u));
						if (h && (h.required || h.optional)) {
							this.emit(`option:${h.name()}`, a.slice(u + 1));
							continue;
						}
					}
					if (
						(r(a) && (n = i),
						(this._enablePositionalOptions ||
							this._passThroughOptions) &&
							t.length === 0 &&
							i.length === 0)
					) {
						if (this._findCommand(a)) {
							t.push(a), s.length > 0 && i.push(...s);
							break;
						} else if (
							this._getHelpCommand() &&
							a === this._getHelpCommand().name()
						) {
							t.push(a), s.length > 0 && t.push(...s);
							break;
						} else if (this._defaultCommandName) {
							i.push(a), s.length > 0 && i.push(...s);
							break;
						}
					}
					if (this._passThroughOptions) {
						n.push(a), s.length > 0 && n.push(...s);
						break;
					}
					n.push(a);
				}
				return { operands: t, unknown: i };
			}
			opts() {
				if (this._storeOptionsAsProperties) {
					let e = {},
						t = this.options.length;
					for (let i = 0; i < t; i++) {
						let n = this.options[i].attributeName();
						e[n] =
							n === this._versionOptionName
								? this._version
								: this[n];
					}
					return e;
				}
				return this._optionValues;
			}
			optsWithGlobals() {
				return this._getCommandAndAncestors().reduce(
					(e, t) => Object.assign(e, t.opts()),
					{},
				);
			}
			error(e, t) {
				this._outputConfiguration.outputError(
					`${e}
`,
					this._outputConfiguration.writeErr,
				),
					typeof this._showHelpAfterError == 'string'
						? this._outputConfiguration
								.writeErr(`${this._showHelpAfterError}
`)
						: this._showHelpAfterError &&
							(this._outputConfiguration.writeErr(`
`),
							this.outputHelp({ error: !0 }));
				let i = t || {},
					n = i.exitCode || 1,
					s = i.code || 'commander.error';
				this._exit(n, s, e);
			}
			_parseOptionsEnv() {
				this.options.forEach((e) => {
					if (e.envVar && e.envVar in p.env) {
						let t = e.attributeName();
						(this.getOptionValue(t) === void 0 ||
							['default', 'config', 'env'].includes(
								this.getOptionValueSource(t),
							)) &&
							(e.required || e.optional
								? this.emit(
										`optionEnv:${e.name()}`,
										p.env[e.envVar],
									)
								: this.emit(`optionEnv:${e.name()}`));
					}
				});
			}
			_parseOptionsImplied() {
				let e = new vt(this.options),
					t = (i) =>
						this.getOptionValue(i) !== void 0 &&
						!['default', 'implied'].includes(
							this.getOptionValueSource(i),
						);
				this.options
					.filter(
						(i) =>
							i.implied !== void 0 &&
							t(i.attributeName()) &&
							e.valueFromOption(
								this.getOptionValue(i.attributeName()),
								i,
							),
					)
					.forEach((i) => {
						Object.keys(i.implied)
							.filter((n) => !t(n))
							.forEach((n) => {
								this.setOptionValueWithSource(
									n,
									i.implied[n],
									'implied',
								);
							});
					});
			}
			missingArgument(e) {
				let t = `error: missing required argument '${e}'`;
				this.error(t, { code: 'commander.missingArgument' });
			}
			optionMissingArgument(e) {
				let t = `error: option '${e.flags}' argument missing`;
				this.error(t, { code: 'commander.optionMissingArgument' });
			}
			missingMandatoryOptionValue(e) {
				let t = `error: required option '${e.flags}' not specified`;
				this.error(t, {
					code: 'commander.missingMandatoryOptionValue',
				});
			}
			_conflictingOption(e, t) {
				let i = (r) => {
						let l = r.attributeName(),
							a = this.getOptionValue(l),
							u = this.options.find(
								(c) => c.negate && l === c.attributeName(),
							),
							h = this.options.find(
								(c) => !c.negate && l === c.attributeName(),
							);
						return u &&
							((u.presetArg === void 0 && a === !1) ||
								(u.presetArg !== void 0 && a === u.presetArg))
							? u
							: h || r;
					},
					n = (r) => {
						let l = i(r),
							a = l.attributeName();
						return this.getOptionValueSource(a) === 'env'
							? `environment variable '${l.envVar}'`
							: `option '${l.flags}'`;
					},
					s = `error: ${n(e)} cannot be used with ${n(t)}`;
				this.error(s, { code: 'commander.conflictingOption' });
			}
			unknownOption(e) {
				if (this._allowUnknownOption) return;
				let t = '';
				if (e.startsWith('--') && this._showSuggestionAfterError) {
					let n = [],
						s = this;
					do {
						let r = s
							.createHelp()
							.visibleOptions(s)
							.filter((l) => l.long)
							.map((l) => l.long);
						(n = n.concat(r)), (s = s.parent);
					} while (s && !s._enablePositionalOptions);
					t = de(e, n);
				}
				let i = `error: unknown option '${e}'${t}`;
				this.error(i, { code: 'commander.unknownOption' });
			}
			_excessArguments(e) {
				if (this._allowExcessArguments) return;
				let t = this.registeredArguments.length,
					i = t === 1 ? '' : 's',
					s = `error: too many arguments${this.parent ? ` for '${this.name()}'` : ''}. Expected ${t} argument${i} but got ${e.length}.`;
				this.error(s, { code: 'commander.excessArguments' });
			}
			unknownCommand() {
				let e = this.args[0],
					t = '';
				if (this._showSuggestionAfterError) {
					let n = [];
					this.createHelp()
						.visibleCommands(this)
						.forEach((s) => {
							n.push(s.name()), s.alias() && n.push(s.alias());
						}),
						(t = de(e, n));
				}
				let i = `error: unknown command '${e}'${t}`;
				this.error(i, { code: 'commander.unknownCommand' });
			}
			version(e, t, i) {
				if (e === void 0) return this._version;
				(this._version = e),
					(t = t || '-V, --version'),
					(i = i || 'output the version number');
				let n = this.createOption(t, i);
				return (
					(this._versionOptionName = n.attributeName()),
					this._registerOption(n),
					this.on('option:' + n.name(), () => {
						this._outputConfiguration.writeOut(`${e}
`),
							this._exit(0, 'commander.version', e);
					}),
					this
				);
			}
			description(e, t) {
				return e === void 0 && t === void 0
					? this._description
					: ((this._description = e),
						t && (this._argsDescription = t),
						this);
			}
			summary(e) {
				return e === void 0
					? this._summary
					: ((this._summary = e), this);
			}
			alias(e) {
				if (e === void 0) return this._aliases[0];
				let t = this;
				if (
					(this.commands.length !== 0 &&
						this.commands[this.commands.length - 1]
							._executableHandler &&
						(t = this.commands[this.commands.length - 1]),
					e === t._name)
				)
					throw new Error(
						"Command alias can't be the same as its name",
					);
				let i = this.parent?._findCommand(e);
				if (i) {
					let n = [i.name()].concat(i.aliases()).join('|');
					throw new Error(
						`cannot add alias '${e}' to command '${this.name()}' as already have command '${n}'`,
					);
				}
				return t._aliases.push(e), this;
			}
			aliases(e) {
				return e === void 0
					? this._aliases
					: (e.forEach((t) => this.alias(t)), this);
			}
			usage(e) {
				if (e === void 0) {
					if (this._usage) return this._usage;
					let t = this.registeredArguments.map((i) => wt(i));
					return []
						.concat(
							this.options.length || this._helpOption !== null
								? '[options]'
								: [],
							this.commands.length ? '[command]' : [],
							this.registeredArguments.length ? t : [],
						)
						.join(' ');
				}
				return (this._usage = e), this;
			}
			name(e) {
				return e === void 0 ? this._name : ((this._name = e), this);
			}
			nameFromFilename(e) {
				return (this._name = x.basename(e, x.extname(e))), this;
			}
			executableDir(e) {
				return e === void 0
					? this._executableDir
					: ((this._executableDir = e), this);
			}
			helpInformation(e) {
				let t = this.createHelp();
				return (
					t.helpWidth === void 0 &&
						(t.helpWidth =
							e && e.error
								? this._outputConfiguration.getErrHelpWidth()
								: this._outputConfiguration.getOutHelpWidth()),
					t.formatHelp(this, t)
				);
			}
			_getHelpContext(e) {
				e = e || {};
				let t = { error: !!e.error },
					i;
				return (
					t.error
						? (i = (n) => this._outputConfiguration.writeErr(n))
						: (i = (n) => this._outputConfiguration.writeOut(n)),
					(t.write = e.write || i),
					(t.command = this),
					t
				);
			}
			outputHelp(e) {
				let t;
				typeof e == 'function' && ((t = e), (e = void 0));
				let i = this._getHelpContext(e);
				this._getCommandAndAncestors()
					.reverse()
					.forEach((s) => s.emit('beforeAllHelp', i)),
					this.emit('beforeHelp', i);
				let n = this.helpInformation(i);
				if (
					t &&
					((n = t(n)), typeof n != 'string' && !Buffer.isBuffer(n))
				)
					throw new Error(
						'outputHelp callback must return a string or a Buffer',
					);
				i.write(n),
					this._getHelpOption()?.long &&
						this.emit(this._getHelpOption().long),
					this.emit('afterHelp', i),
					this._getCommandAndAncestors().forEach((s) =>
						s.emit('afterAllHelp', i),
					);
			}
			helpOption(e, t) {
				return typeof e == 'boolean'
					? (e
							? (this._helpOption = this._helpOption ?? void 0)
							: (this._helpOption = null),
						this)
					: ((e = e ?? '-h, --help'),
						(t = t ?? 'display help for command'),
						(this._helpOption = this.createOption(e, t)),
						this);
			}
			_getHelpOption() {
				return (
					this._helpOption === void 0 &&
						this.helpOption(void 0, void 0),
					this._helpOption
				);
			}
			addHelpOption(e) {
				return (this._helpOption = e), this;
			}
			help(e) {
				this.outputHelp(e);
				let t = p.exitCode || 0;
				t === 0 && e && typeof e != 'function' && e.error && (t = 1),
					this._exit(t, 'commander.help', '(outputHelp)');
			}
			addHelpText(e, t) {
				let i = ['beforeAll', 'before', 'after', 'afterAll'];
				if (!i.includes(e))
					throw new Error(`Unexpected value for position to addHelpText.
Expecting one of '${i.join("', '")}'`);
				let n = `${e}Help`;
				return (
					this.on(n, (s) => {
						let r;
						typeof t == 'function'
							? (r = t({ error: s.error, command: s.command }))
							: (r = t),
							r &&
								s.write(`${r}
`);
					}),
					this
				);
			}
			_outputHelpIfRequested(e) {
				let t = this._getHelpOption();
				t &&
					e.find((n) => t.is(n)) &&
					(this.outputHelp(),
					this._exit(0, 'commander.helpDisplayed', '(outputHelp)'));
			}
		};
	function fe(o) {
		return o.map((e) => {
			if (!e.startsWith('--inspect')) return e;
			let t,
				i = '127.0.0.1',
				n = '9229',
				s;
			return (
				(s = e.match(/^(--inspect(-brk)?)$/)) !== null
					? (t = s[1])
					: (s = e.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !==
						  null
						? ((t = s[1]),
							/^\d+$/.test(s[3]) ? (n = s[3]) : (i = s[3]))
						: (s = e.match(
								/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/,
							)) !== null && ((t = s[1]), (i = s[3]), (n = s[4])),
				t && n !== '0' ? `${t}=${i}:${parseInt(n) + 1}` : e
			);
		});
	}
	xe.Command = K;
});
var De = w((b, Fe) => {
	'use strict';
	var ve = f(S()),
		Ae = f(ye()),
		Ee = f(A()),
		$e = f(I()),
		Se = f(B());
	Fe.exports;
	var { Argument: He } = ve.default,
		{ Command: Y } = Ae.default,
		{ CommanderError: At, InvalidArgumentError: Ve } = Ee.default,
		{ Help: Et } = $e.default,
		{ Option: ke } = Se.default;
	b.program = new Y();
	b.createCommand = (o) => new Y(o);
	b.createOption = (o, e) => new ke(o, e);
	b.createArgument = (o, e) => new He(o, e);
	b.Command = Y;
	b.Option = ke;
	b.Argument = He;
	b.Help = Et;
	b.CommanderError = At;
	b.InvalidArgumentError = Ve;
	b.InvalidOptionArgumentError = Ve;
});
import $t from 'tty';
var y = w((ni, V) => {
	'use strict';
	V.exports;
	var Te = process.argv || [],
		H = process.env,
		St =
			!('NO_COLOR' in H || Te.includes('--no-color')) &&
			('FORCE_COLOR' in H ||
				Te.includes('--color') ||
				process.platform === 'win32' ||
				(ne != null && $t.isatty(1) && H.TERM !== 'dumb') ||
				'CI' in H),
		Ht =
			(o, e, t = o) =>
			(i) => {
				let n = '' + i,
					s = n.indexOf(e, o.length);
				return ~s ? o + Vt(n, e, t, s) + e : o + n + e;
			},
		Vt = (o, e, t, i) => {
			let n = '',
				s = 0;
			do
				(n += o.substring(s, i) + t),
					(s = i + e.length),
					(i = o.indexOf(e, s));
			while (~i);
			return n + o.substring(s);
		},
		Ne = (o = St) => {
			let e = o ? Ht : () => String;
			return {
				isColorSupported: o,
				reset: e('\x1B[0m', '\x1B[0m'),
				bold: e('\x1B[1m', '\x1B[22m', '\x1B[22m\x1B[1m'),
				dim: e('\x1B[2m', '\x1B[22m', '\x1B[22m\x1B[2m'),
				italic: e('\x1B[3m', '\x1B[23m'),
				underline: e('\x1B[4m', '\x1B[24m'),
				inverse: e('\x1B[7m', '\x1B[27m'),
				hidden: e('\x1B[8m', '\x1B[28m'),
				strikethrough: e('\x1B[9m', '\x1B[29m'),
				black: e('\x1B[30m', '\x1B[39m'),
				red: e('\x1B[31m', '\x1B[39m'),
				green: e('\x1B[32m', '\x1B[39m'),
				yellow: e('\x1B[33m', '\x1B[39m'),
				blue: e('\x1B[34m', '\x1B[39m'),
				magenta: e('\x1B[35m', '\x1B[39m'),
				cyan: e('\x1B[36m', '\x1B[39m'),
				white: e('\x1B[37m', '\x1B[39m'),
				gray: e('\x1B[90m', '\x1B[39m'),
				bgBlack: e('\x1B[40m', '\x1B[49m'),
				bgRed: e('\x1B[41m', '\x1B[49m'),
				bgGreen: e('\x1B[42m', '\x1B[49m'),
				bgYellow: e('\x1B[43m', '\x1B[49m'),
				bgBlue: e('\x1B[44m', '\x1B[49m'),
				bgMagenta: e('\x1B[45m', '\x1B[49m'),
				bgCyan: e('\x1B[46m', '\x1B[49m'),
				bgWhite: e('\x1B[47m', '\x1B[49m'),
			};
		};
	V.exports = Ne();
	V.exports.createColors = Ne;
});
var je = f(De(), 1),
	{
		program: Gt,
		createCommand: Ut,
		createArgument: Jt,
		createOption: Kt,
		CommanderError: Yt,
		InvalidArgumentError: zt,
		InvalidOptionArgumentError: Qt,
		Command: Me,
		Argument: Xt,
		Option: Zt,
		Help: ei,
	} = je.default;
var qe = f(y(), 1);
import D from 'node:path';
import X from 'node:fs/promises';
var Pe = f(y(), 1);
import k from 'fs/promises';
import F from 'node:path';
var z = (o, e, t) => {
		let i = F.relative(o, t);
		return F.resolve(F.join(e, i));
	},
	We = async (o, e, t, i, n, s) => {
		let r;
		try {
			r = await import('svelte/compiler');
		} catch {
			console.error(
				Pe.default.red('Please install svelte and svelte-preprocess'),
			),
				process.exit(1);
		}
		let l = t.filter((u) => u.endsWith('.svelte')),
			a = JSON.parse(await k.readFile(s, 'utf-8'));
		for (let u of l) {
			let h = await k.readFile(u, 'utf-8'),
				g = (
					await r.preprocess(
						h,
						{
							script: async ({ content: m, attributes: C }) => {
								if (C.lang !== 'ts') return { code: m };
								let { code: v } = await i.transform(m, {
									sourcefile: u,
									loader: 'ts',
									logLevel: 'debug',
									target: 'esnext',
									format: 'esm',
									minify: !1,
									platform: n,
									tsconfigRaw: a,
								});
								return { code: v };
							},
						},
						{ filename: u },
					)
				).code,
				O = z(o, e, u);
			await k.mkdir(F.dirname(O), { recursive: !0 }),
				await k.writeFile(O, g, 'utf-8');
		}
	};
import kt from 'node:path';
import Q from 'node:fs/promises';
var Ie = async (o, e, t) => {
		let i = t.filter((n) => n.endsWith('.d.ts'));
		if (i.length !== 0)
			for (let n of i) {
				let s = z(o, e, n);
				await Q.mkdir(kt.dirname(s), { recursive: !0 }),
					await Q.copyFile(n, s);
			}
	},
	Re = () => ({
		name: 'dts-import',
		setup: (o) => {
			o.onLoad({ filter: /\.ts$/ }, async (e) => {
				let t = await Q.readFile(e.path, 'utf-8'),
					i = /import\s+.*['"][^'"]+\.d\.ts['"];?\s*/g;
				return { contents: t.replace(i, '').trim(), loader: 'ts' };
			});
		},
	});
var Le = async (o) => {
		let e = 0,
			t = await X.readdir(o, { withFileTypes: !0 });
		for (let i of t) {
			let n = D.join(o, i.name),
				s = await X.stat(n);
			s.isFile() ? e++ : s.isDirectory() && (e += await Le(n));
		}
		return e;
	},
	Be = async (o, e, t, i) => {
		let n = Date.now();
		t.clean &&
			(await X.rm(D.resolve(t.output), { recursive: !0, force: !0 })),
			await i.build({
				entryPoints: e.filter(
					(l) => !l.endsWith('.svelte') && !l.endsWith('.d.ts'),
				),
				bundle: !1,
				format: 'esm',
				platform: t.platform,
				outdir: D.resolve(t.output),
				tsconfig: D.resolve(t.tsconfig),
				keepNames: !0,
				treeShaking: !0,
				target: 'esnext',
				logLevel: 'debug',
				splitting: !1,
				plugins: [Re()],
			}),
			await We(o, t.output, e, i, t.platform, t.tsconfig);
		let s = Date.now(),
			r = await Le(t.output);
		console.info(
			qe.default.green(
				`\u{1F525} Build complete in ${Math.floor(s - n)}ms - ${r} files`,
			),
		);
	};
var E = f(y(), 1);
var j = f(y(), 1);
import { createRequire as Mt } from 'node:module';
var Je = f(y(), 1);
import * as _ from 'path';
var Ke, d;
try {
	(Ke = await import('svelte2tsx')), (d = await import('typescript'));
} catch {
	console.error(
		Je.default.red(
			'Please make sure you have svelte2tsx and typescript installed in your project to generate declaration files',
		),
	),
		process.exit(1);
}
async function Ye(o) {
	let e = await jt(o),
		{ options: t, filenames: i } = Ft(o, e),
		n = await Dt(t, e),
		l = d
			.createProgram(i, t, n)
			.emit()
			.diagnostics.filter(
				(a) => a.code === 2527 || (a.code >= 4e3 && a.code <= 4108),
			);
	if (l.length > 0) {
		let a = new Map();
		l.forEach((u) => {
			let h = u.file?.fileName;
			if (h) {
				let c = a.get(h) || [];
				c.push(
					d.flattenDiagnosticMessageText(
						u.messageText,
						`
`,
					),
				),
					a.set(h, c);
			}
		}),
			console.warn(
				'd.ts type declaration files for the following files were likely not generated due to the following errors:',
			),
			console.warn(
				[...a.entries()].map(
					([u, h]) => `${u}
${h.map((c) => `  - ${c}`).join(`
`)}`,
				).join(`
`),
			);
	}
}
var Ft = (o, e) => {
		let t = _.resolve(o.entry),
			i = _.resolve(o.tsConfig),
			n = _.dirname(i),
			{ error: s, config: r } = d.readConfigFile(i, d.sys.readFile);
		if (s)
			throw new Error(
				`Malformed tsconfig
` + JSON.stringify(s, null, 2),
			);
		(r.include = [`${t}/**/*.svelte`]), (r.files = []);
		let { options: l, fileNames: a } = d.parseJsonConfigFileContent(
				r,
				d.sys,
				n,
				{ sourceMap: !1, rootDir: t },
				i,
				void 0,
				[
					{
						extension: 'svelte',
						isMixedContent: !0,
						scriptKind: d.ScriptKind.Deferred,
					},
				],
			),
			u = a.map((h) => {
				if (!Z(h)) return h;
				let c = e.add(h);
				return h + (c ? '.ts' : '.js');
			});
		return (
			u.push(o.svelteShimsPath),
			{
				options: {
					...l,
					noEmit: !1,
					moduleResolution:
						d.ModuleResolutionKind.NodeJs ??
						d.ModuleResolutionKind.Node10,
					declaration: !0,
					emitDeclarationOnly: !0,
					declarationDir: o.declarationDir,
					allowNonTsExtensions: !0,
				},
				filenames: u,
			}
		);
	},
	Dt = async (o, e) => {
		let t = d.createCompilerHost(o),
			i = _.relative(process.cwd(), _.dirname(o.configFilePath))
				.split(_.sep)
				.join('/'),
			n = {
				...d.sys,
				fileExists(r) {
					let l = d.sys.fileExists(r);
					if (l) return !0;
					let a = Ue(r);
					if (a === r) return !1;
					if (((l = d.sys.fileExists(a)), l && Z(a))) {
						let u = e.add(a);
						if ((u && !Ge(r)) || (!u && Ge(r))) return !1;
					}
					return l;
				},
				readFile(r, l = 'utf-8') {
					let a = Ue(r);
					if (r !== a || Z(r)) {
						let u = e.get(a);
						return u === void 0 ? d.sys.readFile(r, l) : u;
					} else return d.sys.readFile(r, l);
				},
				readDirectory(r, l, a, u, h) {
					let c = (l || []).concat('.svelte');
					return d.sys.readDirectory(r, c, a, u, h);
				},
				writeFile(r, l, a) {
					return (
						(r = i ? _.join(i, r) : r),
						r.endsWith('d.ts.map')
							? (l = l.replace(
									/"sources":\["(.+?)"\]/,
									(u, h) => (
										(h =
											i && h.includes(i)
												? h.slice(0, h.indexOf(i)) +
													h.slice(
														h.indexOf(i) +
															i.length +
															1,
													)
												: h),
										e.get(_.join(o.rootDir, ee(h))) &&
											(h = ee(h)),
										`"sources":["${h}"]`
									),
								))
							: r.endsWith('js.map') &&
								(l = l.replace(
									/"sources":\["(.+?)"\]/,
									(u, h) => (
										(h =
											i && h.includes(i)
												? h.slice(0, h.indexOf(i)) +
													h.slice(
														h.indexOf(i) +
															i.length +
															1,
													)
												: h),
										`"sources":["${h}"]`
									),
								)),
						d.sys.writeFile(r, l, a)
					);
				},
			};
		(t.fileExists = n.fileExists),
			(t.readFile = n.readFile),
			(t.readDirectory = n.readDirectory),
			(t.writeFile = n.writeFile),
			(t.resolveModuleNames = (r, l, a, u, h) =>
				r.map((c) => s(c, l, h))),
			(t.resolveModuleNameLiterals = (r, l, a, u) =>
				r.map((h) => ({ resolvedModule: s(h.text, l, u) })));
		function s(r, l, a) {
			let u = d.resolveModuleName(r, l, a, d.sys).resolvedModule;
			return u && !ze(u.resolvedFileName)
				? u
				: d.resolveModuleName(r, l, a, n).resolvedModule;
		}
		return t;
	},
	jt = async (o) => {
		let e = new Map(),
			t = o.svelteShimsPath
				.replace(/\\/g, '/')
				.endsWith('svelte2tsx/svelte-shims-v4.d.ts'),
			i = t ? void 0 : '3.42.0';
		function n(s) {
			let r = d.sys.readFile(s, 'utf-8'),
				l = /<script\s+[^>]*?lang=('|")(ts|typescript)('|")/.test(
					r ?? '',
				),
				a = Ke.svelte2tsx(r ?? '', {
					filename: s,
					isTsFile: l,
					mode: 'dts',
					version: i,
					noSvelteComponentTyped: t,
				}).code;
			return e.set(s.replace(/\\/g, '/'), a), l;
		}
		return { add: n, get: (s) => e.get(s.replace(/\\/g, '/')) };
	};
function Z(o) {
	return o.endsWith('.svelte');
}
function Ge(o) {
	return o.endsWith('.ts');
}
function ze(o) {
	return o.endsWith('.svelte.ts') || o.endsWith('svelte.js');
}
function ee(o) {
	return o.slice(0, -3);
}
function Ue(o) {
	return ze(o) ? ee(o) : o;
}
var Qe = async (o, e, t, i) => {
		let n;
		try {
			n = await import('typescript');
		} catch {
			console.error(
				j.default.bgBlack(
					j.default.red(
						'Please make sure you have typescript installed in your project to generate declaration files',
					),
				),
			);
			return;
		}
		let s = Date.now();
		n
			.createProgram(e, {
				strict: !0,
				declaration: !0,
				emitDeclarationOnly: !0,
				outDir: t,
			})
			.emit(),
			await Tt(o, e, t, i),
			await Ie(o, t, e);
		let l = Date.now();
		console.info(
			j.default.green(
				`\u{1F389} Declaration files generated in ${Math.floor(l - s)}ms`,
			),
		);
	},
	Tt = async (o, e, t, i) => {
		if (!e.filter((r) => r.endsWith('.svelte')).length) return;
		let s = Mt(import.meta.url);
		await Ye({
			entry: o,
			tsConfig: i,
			svelteShimsPath: s.resolve('svelte2tsx/svelte-shims-v4.d.ts'),
			declarationDir: t,
		});
	};
import Xe from 'node:path';
import Ze from 'node:fs/promises';
var et = async (o) => {
		let e = [];
		for (let t of await Ze.readdir(o)) {
			let i = Xe.resolve(Xe.join(o, t));
			(await Ze.stat(i)).isDirectory()
				? (e = e.concat(await et(i)))
				: e.push(i);
		}
		return e;
	},
	te = new Me();
te.name('sucker')
	.description('A simple cli wrapper for esbuild')
	.version('0.0.1');
te.command('bundle')
	.description('bundle and transpile your code')
	.argument('<entry>', 'entry directory')
	.option('-o, --output <output>', 'output directory', 'dist')
	.option('-p, --platform <platform>', 'target platform', 'node')
	.option('-c, --clean', 'clean output directory before bundling', !1)
	.option(
		'-ts, --tsconfig <tsconfig>',
		'path to tsconfig.json',
		'tsconfig.json',
	)
	.option('-d, --dts', 'generate declaration files', !1)
	.action(async (o, e) => {
		let t;
		try {
			t = await import('esbuild');
		} catch {
			console.error(
				E.default.bgBlack(
					E.default.red(
						'Please make sure you have esbuild installed in your project',
					),
				),
			),
				process.exit(1);
		}
		console.info(E.default.blue('\u2B50 Bundling your code...'));
		let i = await et(o);
		await Be(o, i, e, t),
			e.dts &&
				(console.info(
					E.default.blue('\u2B50 Generating declaration files...'),
				),
				await Qe(o, i, e.output, e.tsconfig));
	});
await te.parseAsync(process.argv);
export { et as getAllFiles };
