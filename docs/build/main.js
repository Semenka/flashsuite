
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35732/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /**
     * Returns a Promise that resolves to the value of window.ethereum if it is
     * set within the given timeout, or null.
     * The Promise will not reject, but an error will be thrown if invalid options
     * are provided.
     *
     * @param options - Options bag.
     * @param options.mustBeMetaMask - Whether to only look for MetaMask providers.
     * Default: false
     * @param options.silent - Whether to silence console errors. Does not affect
     * thrown errors. Default: false
     * @param options.timeout - Milliseconds to wait for 'ethereum#initialized' to
     * be dispatched. Default: 3000
     * @returns A Promise that resolves with the Provider if it is detected within
     * given timeout, otherwise null.
     */
    function detectEthereumProvider({ mustBeMetaMask = false, silent = false, timeout = 3000, } = {}) {
        _validateInputs();
        let handled = false;
        return new Promise((resolve) => {
            if (window.ethereum) {
                handleEthereum();
            }
            else {
                window.addEventListener('ethereum#initialized', handleEthereum, { once: true });
                setTimeout(() => {
                    handleEthereum();
                }, timeout);
            }
            function handleEthereum() {
                if (handled) {
                    return;
                }
                handled = true;
                window.removeEventListener('ethereum#initialized', handleEthereum);
                const { ethereum } = window;
                if (ethereum && (!mustBeMetaMask || ethereum.isMetaMask)) {
                    resolve(ethereum);
                }
                else {
                    const message = mustBeMetaMask && ethereum
                        ? 'Non-MetaMask window.ethereum detected.'
                        : 'Unable to detect window.ethereum.';
                    !silent && console.error('@metamask/detect-provider:', message);
                    resolve(null);
                }
            }
        });
        function _validateInputs() {
            if (typeof mustBeMetaMask !== 'boolean') {
                throw new Error(`@metamask/detect-provider: Expected option 'mustBeMetaMask' to be a boolean.`);
            }
            if (typeof silent !== 'boolean') {
                throw new Error(`@metamask/detect-provider: Expected option 'silent' to be a boolean.`);
            }
            if (typeof timeout !== 'number') {
                throw new Error(`@metamask/detect-provider: Expected option 'timeout' to be a number.`);
            }
        }
    }
    var dist = detectEthereumProvider;

    /* svelte/metamask.svelte generated by Svelte v3.32.3 */

    const { console: console_1 } = globals;
    const file = "svelte/metamask.svelte";

    // (74:6) {#if signer}
    function create_if_block_1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			if (img.src !== (img_src_value = "images/account_icon.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "loading", "lazy");
    			attr_dev(img, "id", "platformLogo");
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", img_class_value = "placeholderimage " + (/*signer*/ ctx[0] ? "address-icon" : "no-address-icon") + " svelte-1klzz7o");
    			add_location(img, file, 75, 10, 2117);
    			attr_dev(div, "id", "identiconAddressImage");
    			attr_dev(div, "class", "buttondisk fs-account-icon-wrapper svelte-1klzz7o");
    			add_location(div, file, 74, 8, 2031);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*signer*/ 1 && img_class_value !== (img_class_value = "placeholderimage " + (/*signer*/ ctx[0] ? "address-icon" : "no-address-icon") + " svelte-1klzz7o")) {
    				attr_dev(img, "class", img_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(74:6) {#if signer}",
    		ctx
    	});

    	return block;
    }

    // (82:8) {:else}
    function create_else_block(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Connect wallet";
    			attr_dev(span, "class", "connect-text svelte-1klzz7o");
    			set_style(span, "margin-left", "32px");
    			add_location(span, file, 82, 10, 2500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*connectMetamask*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(82:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (80:8) {#if signer}
    function create_if_block(ctx) {
    	let span;
    	let t_value = /*signer*/ ctx[0].substr(0, 6) + "..." + /*signer*/ ctx[0].substring(/*signer*/ ctx[0].length - 4, /*signer*/ ctx[0].length) + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file, 80, 10, 2377);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*signer*/ 1 && t_value !== (t_value = /*signer*/ ctx[0].substr(0, 6) + "..." + /*signer*/ ctx[0].substring(/*signer*/ ctx[0].length - 4, /*signer*/ ctx[0].length) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(80:8) {#if signer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let t1;
    	let div1;
    	let if_block0 = /*signer*/ ctx[0] && create_if_block_1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*signer*/ ctx[0]) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div1 = element("div");
    			if_block1.c();
    			attr_dev(div0, "class", "frostedglasseffect notfixed");
    			add_location(div0, file, 71, 4, 1928);
    			attr_dev(div1, "id", "userAddressSet");
    			attr_dev(div1, "class", "textdarkmode");
    			add_location(div1, file, 78, 6, 2299);
    			attr_dev(div2, "class", "blockcontents");
    			add_location(div2, file, 72, 4, 1976);
    			attr_dev(div3, "class", "frostedglasswrapper left");
    			add_location(div3, file, 70, 2, 1885);
    			attr_dev(div4, "href", "#");
    			attr_dev(div4, "class", "headerbutton w-inline-block");
    			add_location(div4, file, 69, 0, 1832);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			if (if_block0) if_block0.m(div2, null);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			if_block1.m(div1, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*signer*/ ctx[0]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(div2, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Metamask", slots, []);
    	let { signer = "" } = $$props;
    	let { addresses = [] } = $$props;
    	let { chainId = "" } = $$props;

    	async function handleChainId(_chainId) {
    		if (_chainId) {
    			$$invalidate(2, chainId = _chainId);
    			console.log("handleChainId", chainId, signer, addresses);
    		}
    	}

    	async function handleAccounts(_accounts) {
    		if (_accounts.length === 0) {
    			connectMetamask();
    		} else if (_accounts[0] !== signer) {
    			$$invalidate(0, signer = _accounts[0]);

    			if (addresses.indexOf(signer) === -1) {
    				addresses.push(signer);
    				console.log("handleAccounts", chainId, signer, addresses);
    			}
    		}
    	}

    	async function connectMetamask() {
    		console.log("connectMetamask");

    		ethereum.request({ method: "eth_requestAccounts" }).then(handleAccounts).catch(e => {
    			if (e.code === 4001) {
    				alert("Please connect to MetaMask.");
    			} else {
    				console.error("ERROR eth_requestAccounts", e);
    			}
    		});
    	}

    	async function init() {
    		console.log("init");
    		const provider = await dist();

    		if (provider) {
    			if (provider !== window.ethereum) {
    				alert("Do you have multiple wallets installed?");
    			}

    			ethereum.request({ method: "eth_accounts" }).then(handleAccounts).catch(e => console.error("ERROR eth_accounts", e));
    			ethereum.request({ method: "eth_chainId" }).then(handleChainId).catch(e => console.error("ERROR eth_chainId", e));
    			ethereum.on("chainChanged", handleChainId);
    			ethereum.on("accountsChanged", handleAccounts);
    		} else {
    			console.log("Please install MetaMask!");
    		}
    	}

    	onMount(async function () {
    		init();
    	});

    	const writable_props = ["signer", "addresses", "chainId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Metamask> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("signer" in $$props) $$invalidate(0, signer = $$props.signer);
    		if ("addresses" in $$props) $$invalidate(3, addresses = $$props.addresses);
    		if ("chainId" in $$props) $$invalidate(2, chainId = $$props.chainId);
    	};

    	$$self.$capture_state = () => ({
    		detectEthereumProvider: dist,
    		onMount,
    		signer,
    		addresses,
    		chainId,
    		handleChainId,
    		handleAccounts,
    		connectMetamask,
    		init
    	});

    	$$self.$inject_state = $$props => {
    		if ("signer" in $$props) $$invalidate(0, signer = $$props.signer);
    		if ("addresses" in $$props) $$invalidate(3, addresses = $$props.addresses);
    		if ("chainId" in $$props) $$invalidate(2, chainId = $$props.chainId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [signer, connectMetamask, chainId, addresses];
    }

    class Metamask extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { signer: 0, addresses: 3, chainId: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Metamask",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get signer() {
    		throw new Error("<Metamask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set signer(value) {
    		throw new Error("<Metamask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addresses() {
    		throw new Error("<Metamask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addresses(value) {
    		throw new Error("<Metamask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chainId() {
    		throw new Error("<Metamask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chainId(value) {
    		throw new Error("<Metamask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/container.svelte generated by Svelte v3.32.3 */

    const { console: console_1$1 } = globals;
    const file$1 = "svelte/container.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let metamask;
    	let updating_signer;
    	let updating_addresses;
    	let updating_chainId;
    	let t;
    	let div2;
    	let current;

    	function metamask_signer_binding(value) {
    		/*metamask_signer_binding*/ ctx[5](value);
    	}

    	function metamask_addresses_binding(value) {
    		/*metamask_addresses_binding*/ ctx[6](value);
    	}

    	function metamask_chainId_binding(value) {
    		/*metamask_chainId_binding*/ ctx[7](value);
    	}

    	let metamask_props = {};

    	if (/*signer*/ ctx[0] !== void 0) {
    		metamask_props.signer = /*signer*/ ctx[0];
    	}

    	if (/*addresses*/ ctx[1] !== void 0) {
    		metamask_props.addresses = /*addresses*/ ctx[1];
    	}

    	if (/*chainId*/ ctx[2] !== void 0) {
    		metamask_props.chainId = /*chainId*/ ctx[2];
    	}

    	metamask = new Metamask({ props: metamask_props, $$inline: true });
    	binding_callbacks.push(() => bind(metamask, "signer", metamask_signer_binding));
    	binding_callbacks.push(() => bind(metamask, "addresses", metamask_addresses_binding));
    	binding_callbacks.push(() => bind(metamask, "chainId", metamask_chainId_binding));
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(metamask.$$.fragment);
    			t = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "nnavbarcontents svelte-1hdsfe0");
    			add_location(div0, file$1, 11, 2, 218);
    			attr_dev(div1, "class", "nnavbar svelte-1hdsfe0");
    			add_location(div1, file$1, 10, 0, 194);
    			attr_dev(div2, "class", "headermain fs-headermain svelte-1hdsfe0");
    			add_location(div2, file$1, 15, 0, 321);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(metamask, div0, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div2, anchor);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const metamask_changes = {};

    			if (!updating_signer && dirty & /*signer*/ 1) {
    				updating_signer = true;
    				metamask_changes.signer = /*signer*/ ctx[0];
    				add_flush_callback(() => updating_signer = false);
    			}

    			if (!updating_addresses && dirty & /*addresses*/ 2) {
    				updating_addresses = true;
    				metamask_changes.addresses = /*addresses*/ ctx[1];
    				add_flush_callback(() => updating_addresses = false);
    			}

    			if (!updating_chainId && dirty & /*chainId*/ 4) {
    				updating_chainId = true;
    				metamask_changes.chainId = /*chainId*/ ctx[2];
    				add_flush_callback(() => updating_chainId = false);
    			}

    			metamask.$set(metamask_changes);

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(metamask.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(metamask.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(metamask);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Container", slots, ['default']);
    	let { signer = "" } = $$props;
    	let { addresses = [] } = $$props;
    	let { chainId = "" } = $$props;
    	const writable_props = ["signer", "addresses", "chainId"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Container> was created with unknown prop '${key}'`);
    	});

    	function metamask_signer_binding(value) {
    		signer = value;
    		$$invalidate(0, signer);
    	}

    	function metamask_addresses_binding(value) {
    		addresses = value;
    		$$invalidate(1, addresses);
    	}

    	function metamask_chainId_binding(value) {
    		chainId = value;
    		$$invalidate(2, chainId);
    	}

    	$$self.$$set = $$props => {
    		if ("signer" in $$props) $$invalidate(0, signer = $$props.signer);
    		if ("addresses" in $$props) $$invalidate(1, addresses = $$props.addresses);
    		if ("chainId" in $$props) $$invalidate(2, chainId = $$props.chainId);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Metamask, signer, addresses, chainId });

    	$$self.$inject_state = $$props => {
    		if ("signer" in $$props) $$invalidate(0, signer = $$props.signer);
    		if ("addresses" in $$props) $$invalidate(1, addresses = $$props.addresses);
    		if ("chainId" in $$props) $$invalidate(2, chainId = $$props.chainId);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*signer*/ 1) {
    			console.log("CONTAINER SIGNER", signer);
    		}
    	};

    	return [
    		signer,
    		addresses,
    		chainId,
    		$$scope,
    		slots,
    		metamask_signer_binding,
    		metamask_addresses_binding,
    		metamask_chainId_binding
    	];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { signer: 0, addresses: 1, chainId: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get signer() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set signer(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addresses() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addresses(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get chainId() {
    		throw new Error("<Container>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set chainId(value) {
    		throw new Error("<Container>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* svelte/main.svelte generated by Svelte v3.32.3 */
    const file$2 = "svelte/main.svelte";

    // (9:0) <Container bind:address bind:balance bind:network bind:signer>
    function create_default_slot(ctx) {
    	let div10;
    	let div0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let h4;
    	let t2;
    	let p0;
    	let t4;
    	let div9;
    	let div4;
    	let a0;
    	let div3;
    	let div1;
    	let t5;
    	let div2;
    	let img1;
    	let img1_src_value;
    	let t6;
    	let p1;
    	let t8;
    	let div8;
    	let a1;
    	let div7;
    	let div5;
    	let t9;
    	let div6;
    	let img2;
    	let img2_src_value;
    	let t10;
    	let p2;

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div0 = element("div");
    			img0 = element("img");
    			t0 = space();
    			h4 = element("h4");
    			h4.textContent = "Flashloan DApps";
    			t2 = space();
    			p0 = element("p");
    			p0.textContent = "without the need to write a single line of code";
    			t4 = space();
    			div9 = element("div");
    			div4 = element("div");
    			a0 = element("a");
    			div3 = element("div");
    			div1 = element("div");
    			t5 = space();
    			div2 = element("div");
    			img1 = element("img");
    			t6 = space();
    			p1 = element("p");
    			p1.textContent = "Allows you to migrate your position, full and partially from one address to another.";
    			t8 = space();
    			div8 = element("div");
    			a1 = element("a");
    			div7 = element("div");
    			div5 = element("div");
    			t9 = space();
    			div6 = element("div");
    			img2 = element("img");
    			t10 = space();
    			p2 = element("p");
    			p2.textContent = "A graphical interface that helps you identify good arbitrage opportunities";
    			if (img0.src !== (img0_src_value = "images/FLSuite-Logo-Full-Dark.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "loading", "eager");
    			attr_dev(img0, "width", "400");
    			attr_dev(img0, "id", "flashSuiteLogo");
    			attr_dev(img0, "alt", "");
    			attr_dev(img0, "class", "flashsuitelogo svelte-12xl72x");
    			add_location(img0, file$2, 11, 6, 335);
    			attr_dev(h4, "class", "textdarkmode svelte-12xl72x");
    			add_location(h4, file$2, 12, 6, 467);
    			attr_dev(p0, "class", "headerparagraph svelte-12xl72x");
    			add_location(p0, file$2, 13, 6, 519);
    			attr_dev(div0, "class", "headercontents left svelte-12xl72x");
    			add_location(div0, file$2, 10, 4, 295);
    			attr_dev(div1, "class", "frostedglasseffect svelte-12xl72x");
    			add_location(div1, file$2, 19, 12, 833);
    			if (img1.src !== (img1_src_value = "images/FlashPos-Sub-Logo-Dark.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "loading", "lazy");
    			attr_dev(img1, "width", "125");
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "flashlogo svelte-12xl72x");
    			add_location(img1, file$2, 20, 36, 904);
    			attr_dev(div2, "class", "blockimage svelte-12xl72x");
    			add_location(div2, file$2, 20, 12, 880);
    			attr_dev(div3, "class", "frostedglasswrapper svelte-12xl72x");
    			add_location(div3, file$2, 18, 10, 787);
    			attr_dev(a0, "id", "flashPosTrigger");
    			attr_dev(a0, "href", "flashpos.html");
    			attr_dev(a0, "class", "headerbutton w-inline-block svelte-12xl72x");
    			add_location(a0, file$2, 17, 8, 695);
    			attr_dev(p1, "class", "headerparagraph headeritemparagraph svelte-12xl72x");
    			add_location(p1, file$2, 23, 8, 1048);
    			attr_dev(div4, "class", "headeritemcontents svelte-12xl72x");
    			add_location(div4, file$2, 16, 6, 654);
    			attr_dev(div5, "class", "frostedglasseffect svelte-12xl72x");
    			add_location(div5, file$2, 28, 12, 1382);
    			if (img2.src !== (img2_src_value = "images/FlashArb-Sub-Logo-Dark.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "loading", "lazy");
    			attr_dev(img2, "width", "125");
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "flashlogo svelte-12xl72x");
    			add_location(img2, file$2, 29, 36, 1453);
    			attr_dev(div6, "class", "blockimage svelte-12xl72x");
    			add_location(div6, file$2, 29, 12, 1429);
    			attr_dev(div7, "class", "frostedglasswrapper svelte-12xl72x");
    			add_location(div7, file$2, 27, 10, 1336);
    			attr_dev(a1, "id", "flashArbTrigger");
    			attr_dev(a1, "href", "flasharb.html");
    			attr_dev(a1, "class", "headerbutton w-inline-block svelte-12xl72x");
    			add_location(a1, file$2, 26, 8, 1244);
    			attr_dev(p2, "class", "headerparagraph headeritemparagraph svelte-12xl72x");
    			add_location(p2, file$2, 32, 8, 1597);
    			attr_dev(div8, "class", "headeritemcontents svelte-12xl72x");
    			add_location(div8, file$2, 25, 6, 1203);
    			attr_dev(div9, "class", "headercontents right svelte-12xl72x");
    			add_location(div9, file$2, 15, 4, 613);
    			attr_dev(div10, "data-w-id", "4a69aa65-f69d-177b-618b-fec329a2edbb");
    			set_style(div10, "opacity", "1");
    			attr_dev(div10, "class", "header1400container svelte-12xl72x");
    			add_location(div10, file$2, 9, 2, 190);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div0);
    			append_dev(div0, img0);
    			append_dev(div0, t0);
    			append_dev(div0, h4);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(div10, t4);
    			append_dev(div10, div9);
    			append_dev(div9, div4);
    			append_dev(div4, a0);
    			append_dev(a0, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, img1);
    			append_dev(div4, t6);
    			append_dev(div4, p1);
    			append_dev(div9, t8);
    			append_dev(div9, div8);
    			append_dev(div8, a1);
    			append_dev(a1, div7);
    			append_dev(div7, div5);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			append_dev(div6, img2);
    			append_dev(div8, t10);
    			append_dev(div8, p2);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(9:0) <Container bind:address bind:balance bind:network bind:signer>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let container;
    	let updating_address;
    	let updating_balance;
    	let updating_network;
    	let updating_signer;
    	let current;

    	function container_address_binding(value) {
    		/*container_address_binding*/ ctx[4](value);
    	}

    	function container_balance_binding(value) {
    		/*container_balance_binding*/ ctx[5](value);
    	}

    	function container_network_binding(value) {
    		/*container_network_binding*/ ctx[6](value);
    	}

    	function container_signer_binding(value) {
    		/*container_signer_binding*/ ctx[7](value);
    	}

    	let container_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	if (/*address*/ ctx[0] !== void 0) {
    		container_props.address = /*address*/ ctx[0];
    	}

    	if (/*balance*/ ctx[2] !== void 0) {
    		container_props.balance = /*balance*/ ctx[2];
    	}

    	if (/*network*/ ctx[1] !== void 0) {
    		container_props.network = /*network*/ ctx[1];
    	}

    	if (/*signer*/ ctx[3] !== void 0) {
    		container_props.signer = /*signer*/ ctx[3];
    	}

    	container = new Container({ props: container_props, $$inline: true });
    	binding_callbacks.push(() => bind(container, "address", container_address_binding));
    	binding_callbacks.push(() => bind(container, "balance", container_balance_binding));
    	binding_callbacks.push(() => bind(container, "network", container_network_binding));
    	binding_callbacks.push(() => bind(container, "signer", container_signer_binding));

    	const block = {
    		c: function create() {
    			create_component(container.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(container, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const container_changes = {};

    			if (dirty & /*$$scope*/ 256) {
    				container_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_address && dirty & /*address*/ 1) {
    				updating_address = true;
    				container_changes.address = /*address*/ ctx[0];
    				add_flush_callback(() => updating_address = false);
    			}

    			if (!updating_balance && dirty & /*balance*/ 4) {
    				updating_balance = true;
    				container_changes.balance = /*balance*/ ctx[2];
    				add_flush_callback(() => updating_balance = false);
    			}

    			if (!updating_network && dirty & /*network*/ 2) {
    				updating_network = true;
    				container_changes.network = /*network*/ ctx[1];
    				add_flush_callback(() => updating_network = false);
    			}

    			if (!updating_signer && dirty & /*signer*/ 8) {
    				updating_signer = true;
    				container_changes.signer = /*signer*/ ctx[3];
    				add_flush_callback(() => updating_signer = false);
    			}

    			container.$set(container_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(container.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(container.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(container, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Main", slots, []);
    	let address;
    	let network;
    	let balance;
    	let signer;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Main> was created with unknown prop '${key}'`);
    	});

    	function container_address_binding(value) {
    		address = value;
    		$$invalidate(0, address);
    	}

    	function container_balance_binding(value) {
    		balance = value;
    		$$invalidate(2, balance);
    	}

    	function container_network_binding(value) {
    		network = value;
    		$$invalidate(1, network);
    	}

    	function container_signer_binding(value) {
    		signer = value;
    		$$invalidate(3, signer);
    	}

    	$$self.$capture_state = () => ({
    		Container,
    		address,
    		network,
    		balance,
    		signer
    	});

    	$$self.$inject_state = $$props => {
    		if ("address" in $$props) $$invalidate(0, address = $$props.address);
    		if ("network" in $$props) $$invalidate(1, network = $$props.network);
    		if ("balance" in $$props) $$invalidate(2, balance = $$props.balance);
    		if ("signer" in $$props) $$invalidate(3, signer = $$props.signer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		address,
    		network,
    		balance,
    		signer,
    		container_address_binding,
    		container_balance_binding,
    		container_network_binding,
    		container_signer_binding
    	];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    new Main({
      target: document.body,
      props: {}
    });

}());
//# sourceMappingURL=main.js.map
