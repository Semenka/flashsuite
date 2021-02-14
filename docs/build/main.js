
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35731/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
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
    function not_equal(a, b) {
        return a != a ? b == b : a !== b;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const signer = writable("");
    const chainId = writable("");
    const addresses = writable([]);

    /* svelte/metamask.svelte generated by Svelte v3.32.3 */

    const { console: console_1 } = globals;

    function create_fragment(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
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
    	let $chainId;
    	let $signer;
    	let $addresses;
    	validate_store(chainId, "chainId");
    	component_subscribe($$self, chainId, $$value => $$invalidate(0, $chainId = $$value));
    	validate_store(signer, "signer");
    	component_subscribe($$self, signer, $$value => $$invalidate(1, $signer = $$value));
    	validate_store(addresses, "addresses");
    	component_subscribe($$self, addresses, $$value => $$invalidate(2, $addresses = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Metamask", slots, []);

    	async function handleChainId(_chainId) {
    		console.log("handleChainId <=", _chainId);

    		if (_chainId) {
    			set_store_value(chainId, $chainId = _chainId, $chainId);
    		}
    	}

    	async function handleAccounts(_accounts) {
    		if (_accounts.length === 0) {
    			connectMetamask();
    		} else if (_accounts[0] !== $signer) {
    			set_store_value(signer, $signer = _accounts[0], $signer);

    			if ($addresses.indexOf($signer) === -1) {
    				$addresses.push($signer);
    				console.log("handleAccounts", _accounts, "=>", $signer, $addresses);
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

    	onMount(async function () {
    		console.log("Metamask init");
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
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Metamask> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		detectEthereumProvider: dist,
    		onMount,
    		signer,
    		chainId,
    		addresses,
    		handleChainId,
    		handleAccounts,
    		connectMetamask,
    		$chainId,
    		$signer,
    		$addresses
    	});

    	return [];
    }

    class Metamask extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Metamask",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* svelte/connect.svelte generated by Svelte v3.32.3 */
    const file = "svelte/connect.svelte";

    function add_css() {
    	var style = element("style");
    	style.id = "svelte-1klzz7o-style";
    	style.textContent = ".connect-text.svelte-1klzz7o{cursor:pointer}.fs-account-icon-wrapper.svelte-1klzz7o{display:flex;justify-content:center}.address-icon.svelte-1klzz7o{width:80%}.no-address-icon.svelte-1klzz7o{opacity:0}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC5zdmVsdGUiLCJzb3VyY2VzIjpbImNvbm5lY3Quc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCBNZXRhbWFzayBmcm9tIFwiLi9tZXRhbWFzay5zdmVsdGVcIjtcbiAgaW1wb3J0IHsgc2lnbmVyIH0gZnJvbSBcIi4vbWV0YW1hc2subWpzXCI7XG5cbiAgY29uc3QgdHJ1bmNhdGVBZGRyZXNzID0gKF9hZGRyZXNzKSA9PiAoX2FkZHJlc3MgPyBfYWRkcmVzcy5zdWJzdHIoMCwgNikgKyBcIi4uLlwiICsgX2FkZHJlc3Muc3Vic3RyaW5nKF9hZGRyZXNzLmxlbmd0aCAtIDQsIF9hZGRyZXNzLmxlbmd0aCkgOiBcIlwiKTtcbjwvc2NyaXB0PlxuXG48ZGl2IGhyZWY9XCIjXCIgY2xhc3M9XCJoZWFkZXJidXR0b24gdy1pbmxpbmUtYmxvY2tcIj5cbiAgPGRpdiBjbGFzcz1cImZyb3N0ZWRnbGFzc3dyYXBwZXIgbGVmdFwiPlxuICAgIDxkaXYgY2xhc3M9XCJmcm9zdGVkZ2xhc3NlZmZlY3Qgbm90Zml4ZWRcIiAvPlxuICAgIDxkaXYgY2xhc3M9XCJibG9ja2NvbnRlbnRzXCI+XG4gICAgICB7I2lmICRzaWduZXJ9XG4gICAgICAgIDxkaXYgaWQ9XCJpZGVudGljb25BZGRyZXNzSW1hZ2VcIiBjbGFzcz1cImJ1dHRvbmRpc2sgZnMtYWNjb3VudC1pY29uLXdyYXBwZXJcIj5cbiAgICAgICAgICA8aW1nIHNyYz1cImltYWdlcy9hY2NvdW50X2ljb24uc3ZnXCIgbG9hZGluZz1cImxhenlcIiBpZD1cInBsYXRmb3JtTG9nb1wiIGFsdD1cIlwiIGNsYXNzPVwicGxhY2Vob2xkZXJpbWFnZSB7JHNpZ25lciA/ICdhZGRyZXNzLWljb24nIDogJ25vLWFkZHJlc3MtaWNvbid9XCIgLz5cbiAgICAgICAgPC9kaXY+XG4gICAgICB7L2lmfVxuICAgICAgPGRpdiBpZD1cInVzZXJBZGRyZXNzU2V0XCIgY2xhc3M9XCJ0ZXh0ZGFya21vZGVcIj5cbiAgICAgICAgeyNpZiAkc2lnbmVyICE9PSBcIlwifVxuICAgICAgICAgIDxzcGFuPnt0cnVuY2F0ZUFkZHJlc3MoJHNpZ25lci50b1N0cmluZygpKX08L3NwYW4+XG4gICAgICAgIHs6ZWxzZX1cbiAgICAgICAgICA8c3BhbiBjbGFzcz1cImNvbm5lY3QtdGV4dFwiPkNvbm5lY3Qgd2FsbGV0PC9zcGFuPlxuICAgICAgICB7L2lmfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gIDwvZGl2PlxuPC9kaXY+XG5cbjxNZXRhbWFzayAvPlxuXG48c3R5bGU+XG4gIC5jb25uZWN0LXRleHQge1xuICAgIGN1cnNvcjogcG9pbnRlcjtcbiAgfVxuXG4gIC5mcy1hY2NvdW50LWljb24td3JhcHBlciB7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgfVxuICAuYWRkcmVzcy1pY29uIHtcbiAgICB3aWR0aDogODAlO1xuICB9XG5cbiAgLm5vLWFkZHJlc3MtaWNvbiB7XG4gICAgb3BhY2l0eTogMDtcbiAgfVxuPC9zdHlsZT5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4QkUsYUFBYSxlQUFDLENBQUMsQUFDYixNQUFNLENBQUUsT0FBTyxBQUNqQixDQUFDLEFBRUQsd0JBQXdCLGVBQUMsQ0FBQyxBQUN4QixPQUFPLENBQUUsSUFBSSxDQUNiLGVBQWUsQ0FBRSxNQUFNLEFBQ3pCLENBQUMsQUFDRCxhQUFhLGVBQUMsQ0FBQyxBQUNiLEtBQUssQ0FBRSxHQUFHLEFBQ1osQ0FBQyxBQUVELGdCQUFnQixlQUFDLENBQUMsQUFDaEIsT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDIn0= */";
    	append_dev(document.head, style);
    }

    // (12:6) {#if $signer}
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
    			attr_dev(img, "class", img_class_value = "placeholderimage " + (/*$signer*/ ctx[0] ? "address-icon" : "no-address-icon") + " svelte-1klzz7o");
    			add_location(img, file, 13, 10, 542);
    			attr_dev(div, "id", "identiconAddressImage");
    			attr_dev(div, "class", "buttondisk fs-account-icon-wrapper svelte-1klzz7o");
    			add_location(div, file, 12, 8, 456);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$signer*/ 1 && img_class_value !== (img_class_value = "placeholderimage " + (/*$signer*/ ctx[0] ? "address-icon" : "no-address-icon") + " svelte-1klzz7o")) {
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
    		source: "(12:6) {#if $signer}",
    		ctx
    	});

    	return block;
    }

    // (20:8) {:else}
    function create_else_block(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Connect wallet";
    			attr_dev(span, "class", "connect-text svelte-1klzz7o");
    			add_location(span, file, 20, 10, 888);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(20:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:8) {#if $signer !== ""}
    function create_if_block(ctx) {
    	let span;
    	let t_value = /*truncateAddress*/ ctx[1](/*$signer*/ ctx[0].toString()) + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file, 18, 10, 811);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$signer*/ 1 && t_value !== (t_value = /*truncateAddress*/ ctx[1](/*$signer*/ ctx[0].toString()) + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:8) {#if $signer !== \\\"\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div4;
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let t1;
    	let div1;
    	let t2;
    	let metamask;
    	let current;
    	let if_block0 = /*$signer*/ ctx[0] && create_if_block_1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*$signer*/ ctx[0] !== "") return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	metamask = new Metamask({ $$inline: true });

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
    			t2 = space();
    			create_component(metamask.$$.fragment);
    			attr_dev(div0, "class", "frostedglasseffect notfixed");
    			add_location(div0, file, 9, 4, 352);
    			attr_dev(div1, "id", "userAddressSet");
    			attr_dev(div1, "class", "textdarkmode");
    			add_location(div1, file, 16, 6, 725);
    			attr_dev(div2, "class", "blockcontents");
    			add_location(div2, file, 10, 4, 400);
    			attr_dev(div3, "class", "frostedglasswrapper left");
    			add_location(div3, file, 8, 2, 309);
    			attr_dev(div4, "href", "#");
    			attr_dev(div4, "class", "headerbutton w-inline-block");
    			add_location(div4, file, 7, 0, 256);
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
    			insert_dev(target, t2, anchor);
    			mount_component(metamask, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$signer*/ ctx[0]) {
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
    		i: function intro(local) {
    			if (current) return;
    			transition_in(metamask.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(metamask.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if (detaching) detach_dev(t2);
    			destroy_component(metamask, detaching);
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
    	let $signer;
    	validate_store(signer, "signer");
    	component_subscribe($$self, signer, $$value => $$invalidate(0, $signer = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Connect", slots, []);

    	const truncateAddress = _address => _address
    	? _address.substr(0, 6) + "..." + _address.substring(_address.length - 4, _address.length)
    	: "";

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Connect> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Metamask,
    		signer,
    		truncateAddress,
    		$signer
    	});

    	return [$signer, truncateAddress];
    }

    class Connect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1klzz7o-style")) add_css();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Connect",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* svelte/container.svelte generated by Svelte v3.32.3 */
    const file$1 = "svelte/container.svelte";

    function add_css$1() {
    	var style = element("style");
    	style.id = "svelte-1hdsfe0-style";
    	style.textContent = ".nnavbar.svelte-1hdsfe0{position:absolute;left:0%;top:6%;right:0%;bottom:auto;z-index:2;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;width:100%;height:55px;padding-bottom:0px;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;background-color:transparent;box-shadow:none}.nnavbarcontents.svelte-1hdsfe0{position:fixed;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;width:100%;max-width:1400px;margin-right:0px;margin-left:0px;padding-right:140px;padding-left:140px;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-align-self:stretch;-ms-flex-item-align:stretch;align-self:stretch;-webkit-box-flex:0;-webkit-flex:0 0 auto;-ms-flex:0 0 auto;flex:0 0 auto}.headermain.svelte-1hdsfe0{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;height:100%;min-height:100vh;margin-bottom:0px;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;background-image:url(\"../images/Synth-BG-Header-Hi.png\");background-position:50% 50%;background-size:cover;background-repeat:no-repeat;background-attachment:fixed}.fs-headermain.svelte-1hdsfe0{padding-top:10%;padding-bottom:10%}@media screen and (max-width: 479px){.nnavbarcontents.svelte-1hdsfe0{margin-right:20px;margin-left:20px}}@media screen and (max-width: 991px){.nnavbarcontents.svelte-1hdsfe0{margin-right:40px;margin-left:40px}}@media screen and (min-width: 1920px){.nnavbarcontents.svelte-1hdsfe0{padding-right:0px;padding-left:0px;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFpbmVyLnN2ZWx0ZSIsInNvdXJjZXMiOlsiY29udGFpbmVyLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgQ29ubmVjdCBmcm9tIFwiLi9jb25uZWN0LnN2ZWx0ZVwiO1xuPC9zY3JpcHQ+XG5cbjxkaXYgY2xhc3M9XCJubmF2YmFyXCI+XG4gIDxkaXYgY2xhc3M9XCJubmF2YmFyY29udGVudHNcIj5cbiAgICA8Q29ubmVjdCAgLz5cbiAgPC9kaXY+XG48L2Rpdj5cbjxkaXYgY2xhc3M9XCJoZWFkZXJtYWluIGZzLWhlYWRlcm1haW5cIj5cbiAgPHNsb3QgLz5cbjwvZGl2PlxuXG48c3R5bGU+XG4gIC5ubmF2YmFyIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgbGVmdDogMCU7XG4gICAgdG9wOiA2JTtcbiAgICByaWdodDogMCU7XG4gICAgYm90dG9tOiBhdXRvO1xuICAgIHotaW5kZXg6IDI7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgaGVpZ2h0OiA1NXB4O1xuICAgIHBhZGRpbmctYm90dG9tOiAwcHg7XG4gICAgLXdlYmtpdC1ib3gtb3JpZW50OiBob3Jpem9udGFsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XG4gICAgYm94LXNoYWRvdzogbm9uZTtcbiAgfVxuXG4gIC5ubmF2YmFyY29udGVudHMge1xuICAgIHBvc2l0aW9uOiBmaXhlZDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDE0MDBweDtcbiAgICBtYXJnaW4tcmlnaHQ6IDBweDtcbiAgICBtYXJnaW4tbGVmdDogMHB4O1xuICAgIHBhZGRpbmctcmlnaHQ6IDE0MHB4O1xuICAgIHBhZGRpbmctbGVmdDogMTQwcHg7XG4gICAgLXdlYmtpdC1ib3gtb3JpZW50OiBob3Jpem9udGFsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGVuZDtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgLW1zLWZsZXgtcGFjazogZW5kO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogc3RyZXRjaDtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBzdHJldGNoO1xuICAgIGFsaWduLXNlbGY6IHN0cmV0Y2g7XG4gICAgLXdlYmtpdC1ib3gtZmxleDogMDtcbiAgICAtd2Via2l0LWZsZXg6IDAgMCBhdXRvO1xuICAgIC1tcy1mbGV4OiAwIDAgYXV0bztcbiAgICBmbGV4OiAwIDAgYXV0bztcbiAgfVxuXG4gIC5oZWFkZXJtYWluIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBoZWlnaHQ6IDEwMCU7XG4gICAgbWluLWhlaWdodDogMTAwdmg7XG4gICAgbWFyZ2luLWJvdHRvbTogMHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtcGFjazogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoXCIuLi9pbWFnZXMvU3ludGgtQkctSGVhZGVyLUhpLnBuZ1wiKTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiA1MCUgNTAlO1xuICAgIGJhY2tncm91bmQtc2l6ZTogY292ZXI7XG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgICBiYWNrZ3JvdW5kLWF0dGFjaG1lbnQ6IGZpeGVkO1xuICB9XG5cbiAgLmZzLWhlYWRlcm1haW4ge1xuICAgIHBhZGRpbmctdG9wOiAxMCU7XG4gICAgcGFkZGluZy1ib3R0b206IDEwJTtcbiAgfVxuXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDQ3OXB4KSB7XG4gICAgLm5uYXZiYXJjb250ZW50cyB7XG4gICAgICBtYXJnaW4tcmlnaHQ6IDIwcHg7XG4gICAgICBtYXJnaW4tbGVmdDogMjBweDtcbiAgICB9XG4gIH1cblxuICBAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiA5OTFweCkge1xuICAgIC5ubmF2YmFyY29udGVudHMge1xuICAgICAgbWFyZ2luLXJpZ2h0OiA0MHB4O1xuICAgICAgbWFyZ2luLWxlZnQ6IDQwcHg7XG4gICAgfVxuICB9XG5cbiAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTkyMHB4KSB7XG4gICAgLm5uYXZiYXJjb250ZW50cyB7XG4gICAgICBwYWRkaW5nLXJpZ2h0OiAwcHg7XG4gICAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICAgIC13ZWJraXQtYm94LXBhY2s6IGVuZDtcbiAgICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBmbGV4LWVuZDtcbiAgICAgIC1tcy1mbGV4LXBhY2s6IGVuZDtcbiAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgfVxuICB9XG48L3N0eWxlPlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWNFLFFBQVEsZUFBQyxDQUFDLEFBQ1IsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsSUFBSSxDQUFFLEVBQUUsQ0FDUixHQUFHLENBQUUsRUFBRSxDQUNQLEtBQUssQ0FBRSxFQUFFLENBQ1QsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsQ0FBQyxDQUNWLE9BQU8sQ0FBRSxX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 */";
    	append_dev(document.head, style);
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let connect;
    	let t;
    	let div2;
    	let current;
    	connect = new Connect({ $$inline: true });
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(connect.$$.fragment);
    			t = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "nnavbarcontents svelte-1hdsfe0");
    			add_location(div0, file$1, 5, 2, 86);
    			attr_dev(div1, "class", "nnavbar svelte-1hdsfe0");
    			add_location(div1, file$1, 4, 0, 62);
    			attr_dev(div2, "class", "headermain fs-headermain svelte-1hdsfe0");
    			add_location(div2, file$1, 9, 0, 149);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(connect, div0, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div2, anchor);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(connect.$$.fragment, local);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(connect.$$.fragment, local);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(connect);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div2);
    			if (default_slot) default_slot.d(detaching);
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
    	validate_slots("Container", slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Container> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Connect });
    	return [$$scope, slots];
    }

    class Container extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-1hdsfe0-style")) add_css$1();
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Container",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* svelte/main.svelte generated by Svelte v3.32.3 */
    const file$2 = "svelte/main.svelte";

    function add_css$2() {
    	var style = element("style");
    	style.id = "svelte-12xl72x-style";
    	style.textContent = "h4.svelte-12xl72x{margin-top:10px;margin-bottom:10px;font-size:18px;line-height:24px;font-weight:700}p.svelte-12xl72x{display:block;max-width:none;margin:10px 0px;padding-left:0px;-webkit-align-self:auto;-ms-flex-item-align:auto;-ms-grid-row-align:auto;align-self:auto;-webkit-box-flex:0;-webkit-flex:0 auto;-ms-flex:0 auto;flex:0 auto;text-align:left}a.svelte-12xl72x{text-decoration:underline}.flashsuitelogo.svelte-12xl72x{margin-bottom:-22px;-webkit-align-self:flex-start;-ms-flex-item-align:start;align-self:flex-start}.headercontents.svelte-12xl72x{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-box-align:start;-webkit-align-items:flex-start;-ms-flex-align:start;align-items:flex-start}.headercontents.left.svelte-12xl72x{height:100%;padding-right:20px;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.headercontents.right.svelte-12xl72x{width:50%;padding-top:100px;padding-left:20px;-webkit-box-orient:horizontal;-webkit-box-direction:normal;-webkit-flex-direction:row;-ms-flex-direction:row;flex-direction:row;-webkit-box-pack:end;-webkit-justify-content:flex-end;-ms-flex-pack:end;justify-content:flex-end;-webkit-box-align:start;-webkit-align-items:flex-start;-ms-flex-align:start;align-items:flex-start;-webkit-align-self:center;-ms-flex-item-align:center;-ms-grid-row-align:center;align-self:center}.headerparagraph.svelte-12xl72x{padding:0px;-webkit-align-self:flex-start;-ms-flex-item-align:start;align-self:flex-start;color:#ffe6fc;line-height:22px}.headerparagraph.headeritemparagraph.svelte-12xl72x{width:auto;padding-top:10px;padding-right:0px;padding-left:0px}.textdarkmode.svelte-12xl72x{margin-top:0px;margin-bottom:0px;color:#ffe6fc}.headerbutton.svelte-12xl72x{overflow:hidden;width:100%;max-width:200px;min-height:auto;min-width:auto;padding:0px;-webkit-align-self:center;-ms-flex-item-align:center;-ms-grid-row-align:center;align-self:center;border-style:solid;border-width:2px;border-color:#fff;border-radius:50px;background-color:transparent}.frostedglasswrapper.svelte-12xl72x{position:static;left:auto;top:0%;right:0%;bottom:0%;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;overflow:hidden;height:45px;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;border-radius:30px}.frostedglasseffect.svelte-12xl72x{width:100%;height:100%;background-color:transparent;background-image:-webkit-gradient(linear, left top, left bottom, from(rgba(246, 202, 255, 0.23)), to(rgba(246, 202, 255, 0.23))), url(\"../images/Synth-BG-Header-Hi.png\");background-image:linear-gradient(180deg, rgba(246, 202, 255, 0.23), rgba(246, 202, 255, 0.23)), url(\"../images/Synth-BG-Header-Hi.png\");background-position:0px 0px, 50% 50%;background-size:auto, cover;background-repeat:repeat, no-repeat;background-attachment:scroll, fixed;-webkit-filter:blur(3px);filter:blur(3px)}.headeritemcontents.svelte-12xl72x{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;width:auto;height:100%;padding:20px;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.flashlogo.svelte-12xl72x{position:static;top:44px;z-index:1}.blockimage.svelte-12xl72x{position:absolute;z-index:1;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-align-self:center;-ms-flex-item-align:center;align-self:center}.header1400container.svelte-12xl72x{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;width:100%;max-width:900px;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-align-self:center;-ms-flex-item-align:center;align-self:center}.right.svelte-12xl72x{margin-top:0px;margin-bottom:0px}.left.svelte-12xl72x{margin-top:0px;margin-bottom:0px;text-align:left}@media screen and (min-width: 1920px){p.svelte-12xl72x{margin-top:10px;margin-bottom:20px;font-size:22px;line-height:28px}.flashsuitelogo.svelte-12xl72x{max-width:100%;min-width:100%;margin-bottom:-31px}.headercontents.right.svelte-12xl72x{padding-top:100px}.headerparagraph.svelte-12xl72x{font-size:22px;line-height:28px}.headerparagraph.headeritemparagraph.svelte-12xl72x{width:auto;padding-right:0px;padding-left:0px;-webkit-align-self:center;-ms-flex-item-align:center;-ms-grid-row-align:center;align-self:center}.textdarkmode.svelte-12xl72x{font-size:22px;line-height:32px}.headerbutton.svelte-12xl72x{max-width:300px;min-width:100px;margin-right:0px}.frostedglasswrapper.svelte-12xl72x{height:55px;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}.headeritemcontents.svelte-12xl72x{padding:40px 60px}.flashlogo.svelte-12xl72x{min-width:120%}.blockimage.svelte-12xl72x{-webkit-align-self:auto;-ms-flex-item-align:auto;-ms-grid-row-align:auto;align-self:auto;-webkit-box-flex:0;-webkit-flex:0 auto;-ms-flex:0 auto;flex:0 auto}.header1400container.svelte-12xl72x{max-width:1400px}.right.svelte-12xl72x{font-size:20px}.left.svelte-12xl72x{font-size:20px}}@media screen and (max-width: 991px){p.svelte-12xl72x{text-align:center}.headercontents.right.svelte-12xl72x{width:auto;padding-top:40px}.header1400container.svelte-12xl72x{padding-right:40px;padding-left:40px;-webkit-box-orient:vertical;-webkit-box-direction:normal;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column}}@media screen and (max-width: 767px){.headerbutton.svelte-12xl72x{max-width:125px;min-width:125px}.flashlogo.svelte-12xl72x{max-width:80%}}@media screen and (max-width: 479px){.flashsuitelogo.svelte-12xl72x{margin-bottom:0px}}@media screen and (min-width: 1920px){@media screen and (min-width: 1920px){}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5zdmVsdGUiLCJzb3VyY2VzIjpbIm1haW4uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCBDb250YWluZXIgZnJvbSBcIi4vY29udGFpbmVyLnN2ZWx0ZVwiO1xuICBsZXQgYWRkcmVzcztcbiAgbGV0IG5ldHdvcms7XG4gIGxldCBiYWxhbmNlO1xuICBsZXQgc2lnbmVyO1xuPC9zY3JpcHQ+XG5cbjxDb250YWluZXIgPlxuICA8ZGl2IGRhdGEtdy1pZD1cIjRhNjlhYTY1LWY2OWQtMTc3Yi02MThiLWZlYzMyOWEyZWRiYlwiIHN0eWxlPVwib3BhY2l0eToxXCIgY2xhc3M9XCJoZWFkZXIxNDAwY29udGFpbmVyXCI+XG4gICAgPGRpdiBjbGFzcz1cImhlYWRlcmNvbnRlbnRzIGxlZnRcIj5cbiAgICAgIDxpbWcgc3JjPVwiaW1hZ2VzL0ZMU3VpdGUtTG9nby1GdWxsLURhcmsuc3ZnXCIgbG9hZGluZz1cImVhZ2VyXCIgd2lkdGg9XCI0MDBcIiBpZD1cImZsYXNoU3VpdGVMb2dvXCIgYWx0PVwiXCIgY2xhc3M9XCJmbGFzaHN1aXRlbG9nb1wiIC8+XG4gICAgICA8aDQgY2xhc3M9XCJ0ZXh0ZGFya21vZGVcIj5GbGFzaGxvYW4gREFwcHM8L2g0PlxuICAgICAgPHAgY2xhc3M9XCJoZWFkZXJwYXJhZ3JhcGhcIj53aXRob3V0IHRoZSBuZWVkIHRvIHdyaXRlIGEgc2luZ2xlIGxpbmUgb2YgY29kZTwvcD5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiaGVhZGVyY29udGVudHMgcmlnaHRcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJoZWFkZXJpdGVtY29udGVudHNcIj5cbiAgICAgICAgPGEgaWQ9XCJmbGFzaFBvc1RyaWdnZXJcIiBocmVmPVwiZmxhc2hwb3MuaHRtbFwiIGNsYXNzPVwiaGVhZGVyYnV0dG9uIHctaW5saW5lLWJsb2NrXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImZyb3N0ZWRnbGFzc3dyYXBwZXJcIj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJmcm9zdGVkZ2xhc3NlZmZlY3RcIiAvPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImJsb2NraW1hZ2VcIj48aW1nIHNyYz1cImltYWdlcy9GbGFzaFBvcy1TdWItTG9nby1EYXJrLnN2Z1wiIGxvYWRpbmc9XCJsYXp5XCIgd2lkdGg9XCIxMjVcIiBhbHQ9XCJcIiBjbGFzcz1cImZsYXNobG9nb1wiIC8+PC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvYT5cbiAgICAgICAgPHAgY2xhc3M9XCJoZWFkZXJwYXJhZ3JhcGggaGVhZGVyaXRlbXBhcmFncmFwaFwiPkFsbG93cyB5b3UgdG8gbWlncmF0ZSB5b3VyIHBvc2l0aW9uLCBmdWxsIGFuZCBwYXJ0aWFsbHkgZnJvbSBvbmUgYWRkcmVzcyB0byBhbm90aGVyLjwvcD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cImhlYWRlcml0ZW1jb250ZW50c1wiPlxuICAgICAgICA8YSBpZD1cImZsYXNoQXJiVHJpZ2dlclwiIGhyZWY9XCJmbGFzaGFyYi5odG1sXCIgY2xhc3M9XCJoZWFkZXJidXR0b24gdy1pbmxpbmUtYmxvY2tcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiZnJvc3RlZGdsYXNzd3JhcHBlclwiPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImZyb3N0ZWRnbGFzc2VmZmVjdFwiIC8+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYmxvY2tpbWFnZVwiPjxpbWcgc3JjPVwiaW1hZ2VzL0ZsYXNoQXJiLVN1Yi1Mb2dvLURhcmsuc3ZnXCIgbG9hZGluZz1cImxhenlcIiB3aWR0aD1cIjEyNVwiIGFsdD1cIlwiIGNsYXNzPVwiZmxhc2hsb2dvXCIgLz48L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9hPlxuICAgICAgICA8cCBjbGFzcz1cImhlYWRlcnBhcmFncmFwaCBoZWFkZXJpdGVtcGFyYWdyYXBoXCI+QSBncmFwaGljYWwgaW50ZXJmYWNlIHRoYXQgaGVscHMgeW91IGlkZW50aWZ5IGdvb2QgYXJiaXRyYWdlIG9wcG9ydHVuaXRpZXM8L3A+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG48L0NvbnRhaW5lcj5cblxuPHN0eWxlPlxuICAudy1sYXlvdXQtZ3JpZCB7XG4gICAgZGlzcGxheTogLW1zLWdyaWQ7XG4gICAgZGlzcGxheTogZ3JpZDtcbiAgICBncmlkLWF1dG8tY29sdW1uczogMWZyO1xuICAgIC1tcy1ncmlkLWNvbHVtbnM6IDFmciAxZnI7XG4gICAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiAxZnIgMWZyO1xuICAgIC1tcy1ncmlkLXJvd3M6IGF1dG8gYXV0bztcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IGF1dG8gYXV0bztcbiAgICBncmlkLXJvdy1nYXA6IDE2cHg7XG4gICAgZ3JpZC1jb2x1bW4tZ2FwOiAxNnB4O1xuICB9XG5cbiAgYm9keSB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzQ2MDQ1NjtcbiAgICBmb250LWZhbWlseTogTW9udHNlcnJhdCwgc2Fucy1zZXJpZjtcbiAgICBjb2xvcjogIzI0MTEzMDtcbiAgICBmb250LXNpemU6IDE2cHg7XG4gICAgbGluZS1oZWlnaHQ6IDI0cHg7XG4gIH1cblxuICBoMSB7XG4gICAgbWFyZ2luLXRvcDogMTBweDtcbiAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICAgIGZvbnQtc2l6ZTogMjRweDtcbiAgICBsaW5lLWhlaWdodDogMzJweDtcbiAgICBmb250LXdlaWdodDogODAwO1xuICB9XG5cbiAgaDIge1xuICAgIG1hcmdpbi10b3A6IDBweDtcbiAgICBtYXJnaW4tYm90dG9tOiAwcHg7XG4gICAgcGFkZGluZy1yaWdodDogMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMTBweDtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgLW1zLWdyaWQtcm93LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICBsaW5lLWhlaWdodDogMjhweDtcbiAgICBmb250LXdlaWdodDogOTAwO1xuICB9XG5cbiAgaDMge1xuICAgIG1hcmdpbi10b3A6IDIwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgICBmb250LXNpemU6IDE2cHg7XG4gICAgbGluZS1oZWlnaHQ6IDMwcHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgfVxuXG4gIGg0IHtcbiAgICBtYXJnaW4tdG9wOiAxMHB4O1xuICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gICAgZm9udC1zaXplOiAxOHB4O1xuICAgIGxpbmUtaGVpZ2h0OiAyNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICBwIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBtYXgtd2lkdGg6IG5vbmU7XG4gICAgbWFyZ2luOiAxMHB4IDBweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGF1dG87XG4gICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogYXV0bztcbiAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGF1dG87XG4gICAgYWxpZ24tc2VsZjogYXV0bztcbiAgICAtd2Via2l0LWJveC1mbGV4OiAwO1xuICAgIC13ZWJraXQtZmxleDogMCBhdXRvO1xuICAgIC1tcy1mbGV4OiAwIGF1dG87XG4gICAgZmxleDogMCBhdXRvO1xuICAgIHRleHQtYWxpZ246IGxlZnQ7XG4gIH1cblxuICBhIHtcbiAgICB0ZXh0LWRlY29yYXRpb246IHVuZGVybGluZTtcbiAgfVxuXG4gIC5mbGFzaHN1aXRlbG9nbyB7XG4gICAgbWFyZ2luLWJvdHRvbTogLTIycHg7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IHN0YXJ0O1xuICAgIGFsaWduLXNlbGY6IGZsZXgtc3RhcnQ7XG4gIH1cblxuICAuaGVhZGVyY29udGVudHMge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IHN0YXJ0O1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgLW1zLWZsZXgtYWxpZ246IHN0YXJ0O1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICB9XG5cbiAgLmhlYWRlcmNvbnRlbnRzLmxlZnQge1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBwYWRkaW5nLXJpZ2h0OiAyMHB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgfVxuXG4gIC5oZWFkZXJjb250ZW50cy5yaWdodCB7XG4gICAgd2lkdGg6IDUwJTtcbiAgICBwYWRkaW5nLXRvcDogMTAwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAyMHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogaG9yaXpvbnRhbDtcbiAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IG5vcm1hbDtcbiAgICAtd2Via2l0LWZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgLW1zLWZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAtd2Via2l0LWJveC1wYWNrOiBlbmQ7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgIC1tcy1mbGV4LXBhY2s6IGVuZDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBzdGFydDtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LWFsaWduOiBzdGFydDtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgLW1zLWdyaWQtcm93LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICB9XG5cbiAgLmhlYWRlcnBhcmFncmFwaCB7XG4gICAgcGFkZGluZzogMHB4O1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogZmxleC1zdGFydDtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBzdGFydDtcbiAgICBhbGlnbi1zZWxmOiBmbGV4LXN0YXJ0O1xuICAgIGNvbG9yOiAjZmZlNmZjO1xuICAgIGxpbmUtaGVpZ2h0OiAyMnB4O1xuICB9XG5cbiAgLmhlYWRlcnBhcmFncmFwaC5oZWFkZXJpdGVtcGFyYWdyYXBoIHtcbiAgICB3aWR0aDogYXV0bztcbiAgICBwYWRkaW5nLXRvcDogMTBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiAwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAwcHg7XG4gIH1cblxuICAudGV4dGRhcmttb2RlIHtcbiAgICBtYXJnaW4tdG9wOiAwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMHB4O1xuICAgIGNvbG9yOiAjZmZlNmZjO1xuICB9XG5cbiAgLnRleHRkYXJrbW9kZS50b2tlbiB7XG4gICAgZGlzcGxheTogYmxvY2s7XG4gICAgcGFkZGluZy1sZWZ0OiA1MHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IHN0YXJ0O1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgLW1zLWZsZXgtYWxpZ246IHN0YXJ0O1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICB9XG5cbiAgLnRleHRkYXJrbW9kZS5iYWxhbmNlIHtcbiAgICBkaXNwbGF5OiBibG9jaztcbiAgICBwYWRkaW5nLXJpZ2h0OiAyMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMjBweDtcbiAgICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBzdGFydDtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LWFsaWduOiBzdGFydDtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICB9XG5cbiAgLnRleHRkYXJrbW9kZS51c2VybWVzc2FnZSB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgY29sb3I6ICNmZmY7XG4gICAgZm9udC1zaXplOiAxNHB4O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICAudGV4dGRhcmttb2RlLmJ1dHRvbiB7XG4gICAgY29sb3I6ICNmZmY7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC5oZWFkZXJidXR0b24ge1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgbWF4LXdpZHRoOiAyMDBweDtcbiAgICBtaW4taGVpZ2h0OiBhdXRvO1xuICAgIG1pbi13aWR0aDogYXV0bztcbiAgICBwYWRkaW5nOiAwcHg7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgIC1tcy1ncmlkLXJvdy1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICBib3JkZXItc3R5bGU6IHNvbGlkO1xuICAgIGJvcmRlci13aWR0aDogMnB4O1xuICAgIGJvcmRlci1jb2xvcjogI2ZmZjtcbiAgICBib3JkZXItcmFkaXVzOiA1MHB4O1xuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgLmZyb3N0ZWRnbGFzc3dyYXBwZXIge1xuICAgIHBvc2l0aW9uOiBzdGF0aWM7XG4gICAgbGVmdDogYXV0bztcbiAgICB0b3A6IDAlO1xuICAgIHJpZ2h0OiAwJTtcbiAgICBib3R0b206IDAlO1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgaGVpZ2h0OiA0NXB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgYm9yZGVyLXJhZGl1czogMzBweDtcbiAgfVxuXG4gIC5mcm9zdGVkZ2xhc3N3cmFwcGVyLmxlZnQge1xuICAgIC13ZWJraXQtYm94LXBhY2s6IHN0YXJ0O1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LXBhY2s6IHN0YXJ0O1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgfVxuXG4gIC5mcm9zdGVkZ2xhc3NlZmZlY3Qge1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiAtd2Via2l0LWdyYWRpZW50KGxpbmVhciwgbGVmdCB0b3AsIGxlZnQgYm90dG9tLCBmcm9tKHJnYmEoMjQ2LCAyMDIsIDI1NSwgMC4yMykpLCB0byhyZ2JhKDI0NiwgMjAyLCAyNTUsIDAuMjMpKSksIHVybChcIi4uL2ltYWdlcy9TeW50aC1CRy1IZWFkZXItSGkucG5nXCIpO1xuICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCgxODBkZWcsIHJnYmEoMjQ2LCAyMDIsIDI1NSwgMC4yMyksIHJnYmEoMjQ2LCAyMDIsIDI1NSwgMC4yMykpLCB1cmwoXCIuLi9pbWFnZXMvU3ludGgtQkctSGVhZGVyLUhpLnBuZ1wiKTtcbiAgICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiAwcHggMHB4LCA1MCUgNTAlO1xuICAgIGJhY2tncm91bmQtc2l6ZTogYXV0bywgY292ZXI7XG4gICAgYmFja2dyb3VuZC1yZXBlYXQ6IHJlcGVhdCwgbm8tcmVwZWF0O1xuICAgIGJhY2tncm91bmQtYXR0YWNobWVudDogc2Nyb2xsLCBmaXhlZDtcbiAgICAtd2Via2l0LWZpbHRlcjogYmx1cigzcHgpO1xuICAgIGZpbHRlcjogYmx1cigzcHgpO1xuICB9XG5cbiAgLmhlYWRlcml0ZW1jb250ZW50cyB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgd2lkdGg6IGF1dG87XG4gICAgaGVpZ2h0OiAxMDAlO1xuICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgLXdlYmtpdC1ib3gtb3JpZW50OiB2ZXJ0aWNhbDtcbiAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IG5vcm1hbDtcbiAgICAtd2Via2l0LWZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLW1zLWZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIH1cblxuICAuZmxhc2hsb2dvIHtcbiAgICBwb3NpdGlvbjogc3RhdGljO1xuICAgIHRvcDogNDRweDtcbiAgICB6LWluZGV4OiAxO1xuICB9XG5cbiAgLmJsb2NraW1hZ2Uge1xuICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICB6LWluZGV4OiAxO1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgfVxuXG4gIC5oZWFkZXIxNDAwY29udGFpbmVyIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXgtd2lkdGg6IDkwMHB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgfVxuXG4gIC5uYXZiYXJpdGVtcyB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgd2lkdGg6IGF1dG87XG4gICAgcGFkZGluZy10b3A6IDBweDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogaG9yaXpvbnRhbDtcbiAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IHJldmVyc2U7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gICAgLW1zLWZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZTtcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gICAgLXdlYmtpdC1ib3gtcGFjazogc3RhcnQ7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gICAgLW1zLWZsZXgtcGFjazogc3RhcnQ7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgfVxuXG4gIC5hZGRyZXNzYmxvY2sge1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGNlbnRlcjtcbiAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gIH1cblxuICAuYWRkcmVzc2Jsb2NrLnRleHRkYXJrbW9kZSB7XG4gICAgcGFkZGluZy1sZWZ0OiAwcHg7XG4gIH1cblxuICAubmF2YmxvY2tpdGVtc3RyaWdnZXIge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIHdpZHRoOiAxMjBweDtcbiAgICBoZWlnaHQ6IDU1cHg7XG4gICAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtcGFjazogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtd2Via2l0LXRyYW5zaXRpb246IGJvcmRlciAyMDBtcyBlYXNlLCBiYWNrZ3JvdW5kLWNvbG9yIDIwMG1zIGVhc2U7XG4gICAgdHJhbnNpdGlvbjogYm9yZGVyIDIwMG1zIGVhc2UsIGJhY2tncm91bmQtY29sb3IgMjAwbXMgZWFzZTtcbiAgICBjdXJzb3I6IHBvaW50ZXI7XG4gIH1cblxuICAubmF2YmxvY2tpdGVtc3RyaWdnZXI6aG92ZXIge1xuICAgIGJvcmRlci1ib3R0b206IDRweCBzb2xpZCAjZmY1MDBiO1xuICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC4yMik7XG4gIH1cblxuICAubmF2YmxvY2tpdGVtc3RyaWdnZXI6YWN0aXZlIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNSk7XG4gIH1cblxuICAubmF2YmxvY2tpdGVtc3RyaWdnZXI6Zm9jdXMge1xuICAgIGJvcmRlci1ib3R0b206IDRweCBzb2xpZCAjZmY1MDBiO1xuICB9XG5cbiAgLm5hdmJhcnRleHRibG9jayB7XG4gICAgbWFyZ2luLXRvcDogNDBweDtcbiAgICBtYXJnaW4tbGVmdDogMHB4O1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGNlbnRlcjtcbiAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1ib3gtZmxleDogMTtcbiAgICAtd2Via2l0LWZsZXg6IDE7XG4gICAgLW1zLWZsZXg6IDE7XG4gICAgZmxleDogMTtcbiAgICBjb2xvcjogI2ZmZjtcbiAgICBsaW5lLWhlaWdodDogMTRweDtcbiAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIH1cblxuICAubmF2YmFydGV4dGJsb2NrOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgICBjb2xvcjogIzAwZmZmMjtcbiAgICBmb250LXNpemU6IDE1cHg7XG4gICAgZm9udC1zdHlsZTogbm9ybWFsO1xuICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgIHRleHQtdHJhbnNmb3JtOiBub25lO1xuICB9XG5cbiAgLm5hdmxpbmsge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHdpZHRoOiAxMjBweDtcbiAgICBoZWlnaHQ6IDU1cHg7XG4gICAgbWFyZ2luLXRvcDogLTQwcHg7XG4gICAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtcGFjazogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBjb2xvcjogI2ZmZjtcbiAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gIH1cblxuICAuc2VjdGlvbmZsYXNocG9zIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBoZWlnaHQ6IDkwdmg7XG4gICAgbWFyZ2luLXRvcDogLTE2MHB4O1xuICAgIG1hcmdpbi1ib3R0b206IDBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiAxNDBweDtcbiAgICBwYWRkaW5nLWJvdHRvbTogNjBweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDE0MHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB9XG5cbiAgLmJ1dHRvbmRpc2sge1xuICAgIHBvc2l0aW9uOiBzdGF0aWM7XG4gICAgdG9wOiAtMC44MzMzcHg7XG4gICAgcmlnaHQ6IDE1Ny41NDE3cHg7XG4gICAgd2lkdGg6IDQ1cHg7XG4gICAgaGVpZ2h0OiA0NXB4O1xuICAgIG1hcmdpbi1yaWdodDogMTBweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICBib3JkZXItcmFkaXVzOiA1MHB4O1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmMGYwZjA7XG4gIH1cblxuICAuYnV0dG9uZGlzay5kcm9wZG93biB7XG4gICAgcG9zaXRpb246IHN0YXRpYztcbiAgICB0b3A6IC0xLjgzMzNweDtcbiAgICByaWdodDogMTc5LjU0MTdweDtcbiAgICBtYXJnaW4tcmlnaHQ6IDEwcHg7XG4gICAgcGFkZGluZy1yaWdodDogMHB4O1xuICB9XG5cbiAgLmJ1dHRvbmRpc2sucmV2ZXJzZSB7XG4gICAgbWFyZ2luLXJpZ2h0OiAwcHg7XG4gICAgbWFyZ2luLWxlZnQ6IDEwcHg7XG4gIH1cblxuICAuYXJyb3cge1xuICAgIGNvbG9yOiAjZWJlYmViO1xuICB9XG5cbiAgLmFycm93LmxpZ2h0bW9kZSB7XG4gICAgY29sb3I6ICMyNDExMzA7XG4gIH1cblxuICAuZHJvcGRvd24tdG9nZ2xlIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBoZWlnaHQ6IDQ1cHg7XG4gICAgbWluLXdpZHRoOiAxNTBweDtcbiAgICBwYWRkaW5nOiAwcHg7XG4gICAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtcGFjazogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBib3JkZXItc3R5bGU6IHNvbGlkO1xuICAgIGJvcmRlci13aWR0aDogMnB4O1xuICAgIGJvcmRlci1jb2xvcjogI2ZkZmRmZDtcbiAgICBib3JkZXItcmFkaXVzOiA1MHB4O1xuICB9XG5cbiAgLmRyb3Bkb3duLXRvZ2dsZS5hZGRyZXNzZXMge1xuICAgIC13ZWJraXQtYm94LXBhY2s6IHN0YXJ0O1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LXBhY2s6IHN0YXJ0O1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICBib3JkZXItY29sb3I6ICNmMmRlZjU7XG4gIH1cblxuICAuc2VjdGlvbmNvbnRhaW5lciB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgb3ZlcmZsb3c6IHNjcm9sbDtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBoZWlnaHQ6IDEwMHZoO1xuICAgIG1heC13aWR0aDogMTQwMHB4O1xuICAgIG1hcmdpbjogNjBweCAwcHggMHB4O1xuICAgIHBhZGRpbmctcmlnaHQ6IDBweDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLXdlYmtpdC1ib3gtcGFjazogc3RhcnQ7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gICAgLW1zLWZsZXgtcGFjazogc3RhcnQ7XG4gICAganVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgfVxuXG4gIC5vdmVybGFwYm94IHtcbiAgICB3aWR0aDogMTAwJTtcbiAgICBtYXJnaW4tYm90dG9tOiAyMjZweDtcbiAgICBwYWRkaW5nLWJvdHRvbTogMHB4O1xuICB9XG5cbiAgLnNlY3Rpb25idW1wZXIge1xuICAgIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgICB6LWluZGV4OiAxO1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTV2aDtcbiAgICAtd2Via2l0LWJveC1wYWNrOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1wYWNrOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGJvcmRlcjogMnB4IHNvbGlkICNmMmRlZjU7XG4gICAgYm9yZGVyLXJhZGl1czogMjBweDtcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiAtd2Via2l0LWdyYWRpZW50KGxpbmVhciwgbGVmdCB0b3AsIGxlZnQgYm90dG9tLCBmcm9tKHJnYmEoMTA2LCAyMCwgMTI3LCAwLjk1KSksIHRvKHJnYmEoMjQyLCAyMjIsIDI0NSwgMCkpKTtcbiAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTgwZGVnLCByZ2JhKDEwNiwgMjAsIDEyNywgMC45NSksIHJnYmEoMjQyLCAyMjIsIDI0NSwgMCkpO1xuICB9XG5cbiAgLnNlY3Rpb25idW1wZXIuYm90dG9tIHtcbiAgICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gICAgbGVmdDogMCU7XG4gICAgdG9wOiBhdXRvO1xuICAgIHJpZ2h0OiAwJTtcbiAgICBib3R0b206IC03MyU7XG4gICAgYmFja2dyb3VuZC1pbWFnZTogLXdlYmtpdC1ncmFkaWVudChsaW5lYXIsIGxlZnQgdG9wLCBsZWZ0IGJvdHRvbSwgZnJvbShyZ2JhKDI0MiwgMjIyLCAyNDUsIDApKSwgdG8ocmdiYSgxMDYsIDIwLCAxMjcsIDAuOTUpKSk7XG4gICAgYmFja2dyb3VuZC1pbWFnZTogbGluZWFyLWdyYWRpZW50KDE4MGRlZywgcmdiYSgyNDIsIDIyMiwgMjQ1LCAwKSwgcmdiYSgxMDYsIDIwLCAxMjcsIDAuOTUpKTtcbiAgfVxuXG4gIC5zZWN0aW9ubG9nb2ltYWdlIHtcbiAgICBtYXJnaW46IDEwcHg7XG4gIH1cblxuICAuc2VjdGlvbmNvbnRlbnRzIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBvdmVyZmxvdzogc2Nyb2xsO1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBwYWRkaW5nLXRvcDogMzU1cHg7XG4gICAgcGFkZGluZy1yaWdodDogMTAwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAxMDBweDtcbiAgICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIH1cblxuICAuY29sdW1uc3Bvc2l0aW9ucyB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgLXdlYmtpdC1ib3gtb3JpZW50OiBob3Jpem9udGFsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogc3RhcnQ7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAtbXMtZmxleC1hbGlnbjogc3RhcnQ7XG4gICAgYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gIH1cblxuICAuY29sdW1ucG9zaXRpb24ge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHdpZHRoOiAxMDAlO1xuICAgIGhlaWdodDogMTAwJTtcbiAgICBwYWRkaW5nOiAxMHB4IDBweDtcbiAgICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBzdHJldGNoO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgLW1zLWZsZXgtYWxpZ246IHN0cmV0Y2g7XG4gICAgYWxpZ24taXRlbXM6IHN0cmV0Y2g7XG4gICAgYm9yZGVyOiAycHggc29saWQgI2YyZGVmNTtcbiAgICBib3JkZXItcmFkaXVzOiAyMHB4O1xuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgLmNvbHVtbnRpdGxlYmFyIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBwYWRkaW5nOiAxMHB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGp1c3RpZnk7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgLW1zLWZsZXgtcGFjazoganVzdGlmeTtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB9XG5cbiAgLmNvbHVtbnRpdGxlYmFyLnJldmVyc2Uge1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogaG9yaXpvbnRhbDtcbiAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IHJldmVyc2U7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gICAgLW1zLWZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZTtcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gIH1cblxuICAuYWRyZXNzZHJvcGRvd24ge1xuICAgIHdpZHRoOiA2MCU7XG4gICAgbWFyZ2luLXJpZ2h0OiAwcHg7XG4gICAgbWFyZ2luLWxlZnQ6IDBweDtcbiAgfVxuXG4gIC50ZXh0bGlnaHRtb2RlIHtcbiAgICBtYXJnaW4tdG9wOiAwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMHB4O1xuICAgIGNvbG9yOiAjMjQxMTMwO1xuICB9XG5cbiAgLnRleHRsaWdodG1vZGUudG9rZW4ge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIHBhZGRpbmctbGVmdDogNTBweDtcbiAgICAtd2Via2l0LWJveC1vcmllbnQ6IHZlcnRpY2FsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBzdGFydDtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LWFsaWduOiBzdGFydDtcbiAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgfVxuXG4gIC50ZXh0bGlnaHRtb2RlLmJhbGFuY2Uge1xuICAgIGRpc3BsYXk6IGJsb2NrO1xuICAgIHBhZGRpbmctcmlnaHQ6IDIwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAyMHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IHN0YXJ0O1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgLW1zLWZsZXgtYWxpZ246IHN0YXJ0O1xuICAgIGFsaWduLWl0ZW1zOiBmbGV4LXN0YXJ0O1xuICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gIH1cblxuICAudGV4dGxpZ2h0bW9kZS5udW1iZXJzIHtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICB9XG5cbiAgLnRleHRsaWdodG1vZGUucmF0ZXMge1xuICAgIHBhZGRpbmctcmlnaHQ6IDBweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDBweDtcbiAgICBjb2xvcjogcmdiYSgzNiwgMTcsIDQ4LCAwLjUpO1xuICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICB9XG5cbiAgLnRleHRsaWdodG1vZGUucmF0ZXMuZ3JlZW4ge1xuICAgIHBhZGRpbmctcmlnaHQ6IDVweDtcbiAgICBwYWRkaW5nLWxlZnQ6IDVweDtcbiAgICBjb2xvcjogIzAzYWMxYztcbiAgfVxuXG4gIC50ZXh0bGlnaHRtb2RlLnJhdGVzLnJlZCB7XG4gICAgcGFkZGluZy1yaWdodDogNXB4O1xuICAgIHBhZGRpbmctbGVmdDogNXB4O1xuICAgIGNvbG9yOiAjZDkwYTBhO1xuICB9XG5cbiAgLnRleHRsaWdodG1vZGUuYnV0dG9uIHtcbiAgICBmb250LXNpemU6IDE0cHg7XG4gICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgfVxuXG4gIC50ZXh0bGlnaHRtb2RlLmJ1dHRvZGFya21vZGUge1xuICAgIGNvbG9yOiAjZmZmO1xuICAgIGZvbnQtc2l6ZTogMTRweDtcbiAgICBmb250LXdlaWdodDogNzAwO1xuICB9XG5cbiAgLmhlYWRpbmcge1xuICAgIG1hcmdpbi1ib3R0b206IDBweDtcbiAgfVxuXG4gIC5ibG9ja2NvbnRlbnRzIHtcbiAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgei1pbmRleDogMTtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICAtd2Via2l0LWJveC1wYWNrOiBzdGFydDtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICAtbXMtZmxleC1wYWNrOiBzdGFydDtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gIH1cblxuICAuZHJvcGRvd24tbGlzdCB7XG4gICAgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IDIwcHg7XG4gIH1cblxuICAuZHJvcGRvd24tbGlzdC53LS1vcGVuIHtcbiAgICBib3JkZXI6IDJweCBzb2xpZCAjZjJkZWY1O1xuICAgIGJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6IDIwcHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZjtcbiAgfVxuXG4gIC5kcm9wZG93bml0ZW0ge1xuICAgIGJvcmRlci1yYWRpdXM6IDIwcHg7XG4gICAgZm9udC13ZWlnaHQ6IDQwMDtcbiAgfVxuXG4gIC5wbGF0Zm9ybWFkZHJlc3Nsb2dvIHtcbiAgICBwb3NpdGlvbjogc3RhdGljO1xuICAgIHRvcDogLTAuODMzM3B4O1xuICAgIHJpZ2h0OiAxNTcuNTQxN3B4O1xuICAgIHdpZHRoOiA0NXB4O1xuICAgIGhlaWdodDogNDVweDtcbiAgICBtYXJnaW4tcmlnaHQ6IDEwcHg7XG4gICAgcGFkZGluZy1yaWdodDogMHB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDUwcHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2YwZjBmMDtcbiAgfVxuXG4gIC5wbGF0Zm9ybWFkZHJlc3Nsb2dvLmRyb3Bkb3duIHtcbiAgICBwb3NpdGlvbjogc3RhdGljO1xuICAgIHRvcDogLTEuODMzM3B4O1xuICAgIHJpZ2h0OiAxNzkuNTQxN3B4O1xuICAgIG1hcmdpbi1yaWdodDogMTBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiAwcHg7XG4gIH1cblxuICAucGxhY2Vob2xkZXJpbWFnZSB7XG4gICAgd2lkdGg6IDEwMCU7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICBib3JkZXItcmFkaXVzOiAzMHB4O1xuICB9XG5cbiAgLmNvbm5lY3RpbmRpY2F0b3Ige1xuICAgIG1heC13aWR0aDogbm9uZTtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgLW1zLWdyaWQtcm93LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC13ZWJraXQtYm94LWZsZXg6IDA7XG4gICAgLXdlYmtpdC1mbGV4OiAwIGF1dG87XG4gICAgLW1zLWZsZXg6IDAgYXV0bztcbiAgICBmbGV4OiAwIGF1dG87XG4gIH1cblxuICAudXNlcm1lc3NhZ2VzYmFyIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBwYWRkaW5nOiAwcHggMTBweDtcbiAgICAtd2Via2l0LWJveC1wYWNrOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1wYWNrOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIGJhY2tncm91bmQtY29sb3I6ICM4YTRjYzY7XG4gIH1cblxuICAudXNlcm1lc3NhZ2VzYmFyLm9yYW5nZSB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDE3MDM4O1xuICB9XG5cbiAgLmdyaWRvcmlnaW4ge1xuICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiAxMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMTBweDtcbiAgICAtd2Via2l0LWJveC1wYWNrOiBzdHJldGNoO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIC1tcy1mbGV4LXBhY2s6IHN0cmV0Y2g7XG4gICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIGdyaWQtY29sdW1uLWdhcDogMTBweDtcbiAgICBncmlkLXJvdy1nYXA6IDBweDtcbiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgICAgXCJEZXBvc2l0LVR0aWxlLU9yaWdpbiBMb2FuLVRpdGxlLU9yaWdpblwiXG4gICAgICBcIkRlcG9zaXQtSXRlbS0wMSBMb2FuLUl0ZW0tMDFcIlxuICAgICAgXCJFbXB0eS1hcmVhIEFQUi1SYXRlLUluZm8tTG9hbi0wMVwiXG4gICAgICBcIkRlcG9zaXQtSXRlbS0wMiBMb2FuLWl0ZW0tMDJcIlxuICAgICAgXCJFbXB0eS1BcmVhIEFQUi1SYXRlLUluZm8tTG9hbi0wMlwiO1xuICAgIC1tcy1ncmlkLXJvd3M6IGF1dG8gMHB4IGF1dG8gMHB4IG1pbm1heCgxNXB4LCAxZnIpIDBweCBhdXRvIDBweCBtaW5tYXgoMTVweCwgMWZyKTtcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IGF1dG8gYXV0byBtaW5tYXgoMTVweCwgMWZyKSBhdXRvIG1pbm1heCgxNXB4LCAxZnIpO1xuICB9XG5cbiAgLnJpZ2h0IHtcbiAgICBtYXJnaW4tdG9wOiAwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMHB4O1xuICB9XG5cbiAgLmxlZnQge1xuICAgIG1hcmdpbi10b3A6IDBweDtcbiAgICBtYXJnaW4tYm90dG9tOiAwcHg7XG4gICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgfVxuXG4gIC5kZXBvc2l0aXRlbSB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgcGFkZGluZzogNXB4O1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2Y5ZjVmZjtcbiAgfVxuXG4gIC50b2tlbmRldGFpbHMge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHdpZHRoOiA1MCU7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB9XG5cbiAgLnRva2VuZGV0YWlscy5yZXZlcnNlIHtcbiAgICAtd2Via2l0LWJveC1vcmllbnQ6IGhvcml6b250YWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiByZXZlcnNlO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gICAgZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlO1xuICB9XG5cbiAgLnJlYWRvbmx5ZmllbGQge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHdpZHRoOiA1MCU7XG4gICAgcGFkZGluZzogNXB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIH1cblxuICAubG9hbml0ZW0ge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHBhZGRpbmc6IDVweDtcbiAgICAtd2Via2l0LWJveC1vcmllbnQ6IGhvcml6b250YWw7XG4gICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiByZXZlcnNlO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlO1xuICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogcm93LXJldmVyc2U7XG4gICAgZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlO1xuICAgIGJvcmRlci1yYWRpdXM6IDEwcHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogI2Y4ZjdmODtcbiAgfVxuXG4gIC5ncmlkZGVzdGluYXRpb24ge1xuICAgIG1hcmdpbi10b3A6IDEwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiAxMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMTBweDtcbiAgICAtd2Via2l0LWJveC1wYWNrOiBzdHJldGNoO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIC1tcy1mbGV4LXBhY2s6IHN0cmV0Y2g7XG4gICAganVzdGlmeS1jb250ZW50OiBzdHJldGNoO1xuICAgIGdyaWQtY29sdW1uLWdhcDogMTBweDtcbiAgICBncmlkLXJvdy1nYXA6IDBweDtcbiAgICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgICAgXCJEZXBvc2l0LVR0aWxlLU9yaWdpbiBMb2FuLVRpdGxlLU9yaWdpblwiXG4gICAgICBcIkRlcG9zaXQtSXRlbS0wMSBMb2FuLUl0ZW0tMDFcIlxuICAgICAgXCJFbXB0eS1hcmVhIEFQUi1SYXRlLUluZm8tTG9hbi0wMVwiXG4gICAgICBcIkRlcG9zaXQtSXRlbS0wMiBMb2FuLWl0ZW0tMDJcIlxuICAgICAgXCJFbXB0eS1BcmVhIEFQUi1SYXRlLUluZm8tTG9hbi0wMlwiO1xuICAgIC1tcy1ncmlkLXJvd3M6IGF1dG8gMHB4IGF1dG8gMHB4IG1pbm1heCgxNXB4LCAxZnIpIDBweCBhdXRvIDBweCBtaW5tYXgoMTVweCwgMWZyKTtcbiAgICBncmlkLXRlbXBsYXRlLXJvd3M6IGF1dG8gYXV0byBtaW5tYXgoMTVweCwgMWZyKSBhdXRvIG1pbm1heCgxNXB4LCAxZnIpO1xuICB9XG5cbiAgLmlucHV0dGV4dGZpZWxkIHtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgZGlzcGxheTogZmxleDtcbiAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgIHdpZHRoOiA2MCU7XG4gICAgbWFyZ2luLXRvcDogMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMHB4O1xuICAgIC13ZWJraXQtYm94LW9yaWVudDogaG9yaXpvbnRhbDtcbiAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IG5vcm1hbDtcbiAgICAtd2Via2l0LWZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgLW1zLWZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAtd2Via2l0LWJveC1wYWNrOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1wYWNrOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgYm9yZGVyOiAycHggc29saWQgIzQ2MDQ1NjtcbiAgICBib3JkZXItcmFkaXVzOiAxMHB4O1xuICAgIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDIwMG1zIGVhc2U7XG4gICAgdHJhbnNpdGlvbjogYWxsIDIwMG1zIGVhc2U7XG4gIH1cblxuICAuaW5wdXR0ZXh0ZmllbGQ6aG92ZXIge1xuICAgIGJvcmRlci1zdHlsZTogc29saWQ7XG4gICAgYm9yZGVyLXdpZHRoOiAxcHg7XG4gICAgYm9yZGVyLWNvbG9yOiAjNmQ2ZDZkO1xuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgLmlucHV0dGV4dGZpZWxkOmFjdGl2ZSB7XG4gICAgYm9yZGVyLXN0eWxlOiBzb2xpZDtcbiAgICBib3JkZXItd2lkdGg6IDFweDtcbiAgICBib3JkZXItY29sb3I6ICM2ZDZkNmQ7XG4gIH1cblxuICAuaW5wdXR0ZXh0ZmllbGQ6Zm9jdXMge1xuICAgIGJvcmRlci1jb2xvcjogIzZkNmQ2ZDtcbiAgfVxuXG4gIC5yYXRlc2luZm8ge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGVuZDtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgLW1zLWZsZXgtcGFjazogZW5kO1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICB9XG5cbiAgLmlucHV0Y2hlY2tmaWVsZCB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgICB3aWR0aDogMjVweDtcbiAgICBtYXJnaW4tdG9wOiAwcHg7XG4gICAgbWFyZ2luLWxlZnQ6IDIwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAwcHg7XG4gICAgLXdlYmtpdC1ib3gtb3JpZW50OiBob3Jpem9udGFsO1xuICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAtbXMtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IHN0YXJ0O1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBmbGV4LXN0YXJ0O1xuICAgIC1tcy1mbGV4LXBhY2s6IHN0YXJ0O1xuICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICBib3JkZXItc3R5bGU6IG5vbmU7XG4gICAgYm9yZGVyLXdpZHRoOiAxcHggMXB4IDJweDtcbiAgICBib3JkZXItY29sb3I6ICNlM2UzZTMgI2UzZTNlMyAjMzMzO1xuICAgIGJvcmRlci1yYWRpdXM6IDBweDtcbiAgICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAyMDBtcyBlYXNlO1xuICAgIHRyYW5zaXRpb246IGFsbCAyMDBtcyBlYXNlO1xuICB9XG5cbiAgLmlucHV0Y2hlY2tmaWVsZDpob3ZlciB7XG4gICAgYm9yZGVyLXN0eWxlOiBub25lO1xuICAgIGJvcmRlci13aWR0aDogMXB4IDFweCAycHg7XG4gICAgYm9yZGVyLWNvbG9yOiAjNmQ2ZDZkO1xuICAgIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1xuICB9XG5cbiAgLmlucHV0Y2hlY2tmaWVsZDphY3RpdmUge1xuICAgIGJvcmRlci1zdHlsZTogbm9uZTtcbiAgICBib3JkZXItd2lkdGg6IDFweDtcbiAgICBib3JkZXItY29sb3I6ICM2ZDZkNmQ7XG4gICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuOSk7XG4gICAgLW1zLXRyYW5zZm9ybTogc2NhbGUoMC45KTtcbiAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOSk7XG4gIH1cblxuICAuaW5wdXRjaGVja2ZpZWxkOmZvY3VzIHtcbiAgICBib3JkZXItY29sb3I6ICM2ZDZkNmQ7XG4gIH1cblxuICAuaW1hZ2Uge1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGNlbnRlcjtcbiAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1ib3gtZmxleDogMDtcbiAgICAtd2Via2l0LWZsZXg6IDAgYXV0bztcbiAgICAtbXMtZmxleDogMCBhdXRvO1xuICAgIGZsZXg6IDAgYXV0bztcbiAgfVxuXG4gIC5pbmZyb2ljb24ge1xuICAgIGhlaWdodDogMzBweDtcbiAgfVxuXG4gIC5zZWNvbmRhcnlidXR0b24ge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGhlaWdodDogNTVweDtcbiAgICBtYXgtd2lkdGg6IDI1MHB4O1xuICAgIG1pbi13aWR0aDogMTAwcHg7XG4gICAgbWFyZ2luLXJpZ2h0OiAxMHB4O1xuICAgIHBhZGRpbmctcmlnaHQ6IDIwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAyMHB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBmbGV4LWVuZDtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBlbmQ7XG4gICAgYWxpZ24tc2VsZjogZmxleC1lbmQ7XG4gICAgYm9yZGVyOiAycHggc29saWQgI2YyZGVmNTtcbiAgICBib3JkZXItcmFkaXVzOiAzMHB4O1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNmZmY7XG4gIH1cblxuICAuc2Vjb25kYXJ5YnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjJkZWY1O1xuICB9XG5cbiAgLmNoaXBmbGFzaHBvcyB7XG4gICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgaGVpZ2h0OiA1NXB4O1xuICAgIG1heC13aWR0aDogMjUwcHg7XG4gICAgbWluLXdpZHRoOiAxMDBweDtcbiAgICBtYXJnaW4tcmlnaHQ6IDEwcHg7XG4gICAgbWFyZ2luLWJvdHRvbTogMjBweDtcbiAgICBwYWRkaW5nLXJpZ2h0OiAyMHB4O1xuICAgIHBhZGRpbmctbGVmdDogMjBweDtcbiAgICAtd2Via2l0LWJveC1wYWNrOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1wYWNrOiBjZW50ZXI7XG4gICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGNlbnRlcjtcbiAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgYm9yZGVyOiAycHggc29saWQgI2YyZGVmNTtcbiAgICBib3JkZXItcmFkaXVzOiAzMHB4O1xuICAgIGJhY2tncm91bmQtY29sb3I6ICNhMDRiY2U7XG4gIH1cblxuICAucGFyYWdyYXBoIHtcbiAgICBtYXJnaW4tYm90dG9tOiAyMHB4O1xuICB9XG5cbiAgLm1haW5idXR0b24ge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGhlaWdodDogNTVweDtcbiAgICBtYXgtd2lkdGg6IDI1MHB4O1xuICAgIG1pbi13aWR0aDogMTAwcHg7XG4gICAgbWFyZ2luLXJpZ2h0OiAxMHB4O1xuICAgIHBhZGRpbmctcmlnaHQ6IDIwcHg7XG4gICAgcGFkZGluZy1sZWZ0OiAyMHB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWJveC1hbGlnbjogY2VudGVyO1xuICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICBib3JkZXI6IDJweCBzb2xpZCAjY2U4MGQ5O1xuICAgIGJvcmRlci1yYWRpdXM6IDMwcHg7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogIzdmMmZmZjtcbiAgICBjb2xvcjogI2ZmZjtcbiAgfVxuXG4gIC5tYWluYnV0dG9uOmhvdmVyIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjM2YwNDU0O1xuICB9XG5cbiAgLmJ1dHRvbndyYXBwZXIge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIHBhZGRpbmctdG9wOiA0MHB4O1xuICAgIHBhZGRpbmctYm90dG9tOiA0MHB4O1xuICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC1tcy1mbGV4LXBhY2s6IGNlbnRlcjtcbiAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICB9XG5cbiAgLmhlYWx0aGZhY3RvcmluZm8ge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIGhlaWdodDogMzBweDtcbiAgICBtYXJnaW4tdG9wOiAxMHB4O1xuICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XG4gICAgcGFkZGluZzogMHB4IDEwcHg7XG4gICAgLXdlYmtpdC1ib3gtcGFjazogY2VudGVyO1xuICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgLW1zLWZsZXgtcGFjazogY2VudGVyO1xuICAgIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcbiAgfVxuXG4gIC5oZWFsdGhmYWN0b3JpbmZvLm9yYW5nZSB7XG4gICAgZGlzcGxheTogbm9uZTtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZDE3MDM4O1xuICB9XG5cbiAgLmhmY29udGVudHMge1xuICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICBkaXNwbGF5OiBmbGV4O1xuICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgLXdlYmtpdC1hbGlnbi1pdGVtczogY2VudGVyO1xuICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAtd2Via2l0LWFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICB9XG5cbiAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTkyMHB4KSB7XG4gICAgaDEge1xuICAgICAgZm9udC1zaXplOiAzMHB4O1xuICAgICAgbGluZS1oZWlnaHQ6IDQwcHg7XG4gICAgfVxuXG4gICAgaDIge1xuICAgICAgZm9udC1zaXplOiAyNHB4O1xuICAgIH1cblxuICAgIHAge1xuICAgICAgbWFyZ2luLXRvcDogMTBweDtcbiAgICAgIG1hcmdpbi1ib3R0b206IDIwcHg7XG4gICAgICBmb250LXNpemU6IDIycHg7XG4gICAgICBsaW5lLWhlaWdodDogMjhweDtcbiAgICB9XG5cbiAgICAuZmxhc2hzdWl0ZWxvZ28ge1xuICAgICAgbWF4LXdpZHRoOiAxMDAlO1xuICAgICAgbWluLXdpZHRoOiAxMDAlO1xuICAgICAgbWFyZ2luLWJvdHRvbTogLTMxcHg7XG4gICAgfVxuXG4gICAgLmhlYWRlcmNvbnRlbnRzLnJpZ2h0IHtcbiAgICAgIHBhZGRpbmctdG9wOiAxMDBweDtcbiAgICB9XG5cbiAgICAuaGVhZGVycGFyYWdyYXBoIHtcbiAgICAgIGZvbnQtc2l6ZTogMjJweDtcbiAgICAgIGxpbmUtaGVpZ2h0OiAyOHB4O1xuICAgIH1cblxuICAgIC5oZWFkZXJwYXJhZ3JhcGguaGVhZGVyaXRlbXBhcmFncmFwaCB7XG4gICAgICB3aWR0aDogYXV0bztcbiAgICAgIHBhZGRpbmctcmlnaHQ6IDBweDtcbiAgICAgIHBhZGRpbmctbGVmdDogMHB4O1xuICAgICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAudGV4dGRhcmttb2RlIHtcbiAgICAgIGZvbnQtc2l6ZTogMjJweDtcbiAgICAgIGxpbmUtaGVpZ2h0OiAzMnB4O1xuICAgIH1cblxuICAgIC50ZXh0ZGFya21vZGUudG9rZW4ge1xuICAgICAgcGFkZGluZy1sZWZ0OiA2OHB4O1xuICAgIH1cblxuICAgIC50ZXh0ZGFya21vZGUuYnV0dG9uIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICAgIGxpbmUtaGVpZ2h0OiAyNHB4O1xuICAgIH1cblxuICAgIC5oZWFkZXJidXR0b24ge1xuICAgICAgbWF4LXdpZHRoOiAzMDBweDtcbiAgICAgIG1pbi13aWR0aDogMTAwcHg7XG4gICAgICBtYXJnaW4tcmlnaHQ6IDBweDtcbiAgICB9XG5cbiAgICAuZnJvc3RlZGdsYXNzd3JhcHBlciB7XG4gICAgICBoZWlnaHQ6IDU1cHg7XG4gICAgICAtd2Via2l0LWJveC1wYWNrOiBjZW50ZXI7XG4gICAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogY2VudGVyO1xuICAgICAgLW1zLWZsZXgtcGFjazogY2VudGVyO1xuICAgICAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgfVxuXG4gICAgLmhlYWRlcml0ZW1jb250ZW50cyB7XG4gICAgICBwYWRkaW5nOiA0MHB4IDYwcHg7XG4gICAgfVxuXG4gICAgLmZsYXNobG9nbyB7XG4gICAgICBtaW4td2lkdGg6IDEyMCU7XG4gICAgfVxuXG4gICAgLmJsb2NraW1hZ2Uge1xuICAgICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBhdXRvO1xuICAgICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogYXV0bztcbiAgICAgIC1tcy1ncmlkLXJvdy1hbGlnbjogYXV0bztcbiAgICAgIGFsaWduLXNlbGY6IGF1dG87XG4gICAgICAtd2Via2l0LWJveC1mbGV4OiAwO1xuICAgICAgLXdlYmtpdC1mbGV4OiAwIGF1dG87XG4gICAgICAtbXMtZmxleDogMCBhdXRvO1xuICAgICAgZmxleDogMCBhdXRvO1xuICAgIH1cblxuICAgIC5oZWFkZXIxNDAwY29udGFpbmVyIHtcbiAgICAgIG1heC13aWR0aDogMTQwMHB4O1xuICAgIH1cblxuICAgIC5hZGRyZXNzYmxvY2sudGV4dGRhcmttb2RlIHtcbiAgICAgIHBhZGRpbmctbGVmdDogMjBweDtcbiAgICB9XG5cbiAgICAuYnV0dG9uZGlzayB7XG4gICAgICB0b3A6IDBweDtcbiAgICAgIHJpZ2h0OiAyMjUuNTQxN3B4O1xuICAgICAgd2lkdGg6IDU1cHg7XG4gICAgICBoZWlnaHQ6IDU1cHg7XG4gICAgfVxuXG4gICAgLmJ1dHRvbmRpc2suZHJvcGRvd24ge1xuICAgICAgdG9wOiAwcHg7XG4gICAgICByaWdodDogMTE1LjU0MTdweDtcbiAgICB9XG5cbiAgICAuZHJvcGRvd24tdG9nZ2xlIHtcbiAgICAgIGhlaWdodDogNTVweDtcbiAgICB9XG5cbiAgICAuc2VjdGlvbmNvbnRhaW5lciB7XG4gICAgICBoZWlnaHQ6IGF1dG87XG4gICAgfVxuXG4gICAgLnNlY3Rpb25idW1wZXIge1xuICAgICAgaGVpZ2h0OiAxMHZoO1xuICAgIH1cblxuICAgIC5zZWN0aW9uYnVtcGVyLmJvdHRvbSB7XG4gICAgICBib3R0b206IC01ODFweDtcbiAgICB9XG5cbiAgICAuc2VjdGlvbmxvZ29pbWFnZSB7XG4gICAgICBtYXgtd2lkdGg6IDEyMCU7XG4gICAgICBtaW4td2lkdGg6IDI1MHB4O1xuICAgIH1cblxuICAgIC5zZWN0aW9uY29udGVudHMge1xuICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgcGFkZGluZy10b3A6IDIwMHB4O1xuICAgIH1cblxuICAgIC50ZXh0bGlnaHRtb2RlIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICAgIGxpbmUtaGVpZ2h0OiAzMnB4O1xuICAgIH1cblxuICAgIC50ZXh0bGlnaHRtb2RlLnRva2VuIHtcbiAgICAgIHBhZGRpbmctbGVmdDogNjhweDtcbiAgICB9XG5cbiAgICAudGV4dGxpZ2h0bW9kZS5udW1iZXJzIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICB9XG5cbiAgICAudGV4dGxpZ2h0bW9kZS5yYXRlcyB7XG4gICAgICBmb250LXNpemU6IDE0cHg7XG4gICAgfVxuXG4gICAgLnRleHRsaWdodG1vZGUuYnV0dG9uIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICB9XG5cbiAgICAudGV4dGxpZ2h0bW9kZS5idXR0b2Rhcmttb2RlIHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICB9XG5cbiAgICAuYmxvY2tjb250ZW50cyB7XG4gICAgICAtd2Via2l0LWFsaWduLXNlbGY6IGF1dG87XG4gICAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBhdXRvO1xuICAgICAgLW1zLWdyaWQtcm93LWFsaWduOiBhdXRvO1xuICAgICAgYWxpZ24tc2VsZjogYXV0bztcbiAgICAgIC13ZWJraXQtYm94LWZsZXg6IDA7XG4gICAgICAtd2Via2l0LWZsZXg6IDAgYXV0bztcbiAgICAgIC1tcy1mbGV4OiAwIGF1dG87XG4gICAgICBmbGV4OiAwIGF1dG87XG4gICAgfVxuXG4gICAgLnBsYXRmb3JtYWRkcmVzc2xvZ28ge1xuICAgICAgdG9wOiAwcHg7XG4gICAgICByaWdodDogMjI1LjU0MTdweDtcbiAgICAgIHdpZHRoOiA1NXB4O1xuICAgICAgaGVpZ2h0OiA1NXB4O1xuICAgIH1cblxuICAgIC5wbGF0Zm9ybWFkZHJlc3Nsb2dvLmRyb3Bkb3duIHtcbiAgICAgIHRvcDogMHB4O1xuICAgICAgcmlnaHQ6IDExNS41NDE3cHg7XG4gICAgfVxuXG4gICAgLnJpZ2h0IHtcbiAgICAgIGZvbnQtc2l6ZTogMjBweDtcbiAgICB9XG5cbiAgICAubGVmdCB7XG4gICAgICBmb250LXNpemU6IDIwcHg7XG4gICAgfVxuXG4gICAgLmdyaWRkZXN0aW5hdGlvbiB7XG4gICAgICBncmlkLXRlbXBsYXRlLWFyZWFzOlxuICAgICAgICBcIkRlcG9zaXQtVHRpbGUtT3JpZ2luIExvYW4tVGl0bGUtT3JpZ2luXCJcbiAgICAgICAgXCJEZXBvc2l0LUl0ZW0tMDEgTG9hbi1JdGVtLTAxXCJcbiAgICAgICAgXCJFbXB0eS1hcmVhIEFQUi1SYXRlLUluZm8tTG9hbi0wMVwiXG4gICAgICAgIFwiQXJlYS0yIEFyZWFcIjtcbiAgICAgIC1tcy1ncmlkLXJvd3M6IGF1dG8gYXV0byBtaW5tYXgoMTVweCwgMWZyKSBtaW5tYXgoMjBweCwgMWZyKTtcbiAgICAgIGdyaWQtdGVtcGxhdGUtcm93czogYXV0byBhdXRvIG1pbm1heCgxNXB4LCAxZnIpIG1pbm1heCgyMHB4LCAxZnIpO1xuICAgIH1cblxuICAgIC5pbnB1dHRleHRmaWVsZCB7XG4gICAgICBib3JkZXI6IDJweCBzb2xpZCAjNDYwNDU2O1xuICAgICAgYm9yZGVyLXJhZGl1czogMTBweDtcbiAgICB9XG5cbiAgICAucmF0ZXNpbmZvIHtcbiAgICAgIGRpc3BsYXk6IC13ZWJraXQtYm94O1xuICAgICAgZGlzcGxheTogLXdlYmtpdC1mbGV4O1xuICAgICAgZGlzcGxheTogLW1zLWZsZXhib3g7XG4gICAgICBkaXNwbGF5OiBmbGV4O1xuICAgICAgLXdlYmtpdC1ib3gtb3JpZW50OiBob3Jpem9udGFsO1xuICAgICAgLXdlYmtpdC1ib3gtZGlyZWN0aW9uOiBub3JtYWw7XG4gICAgICAtd2Via2l0LWZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICAtbXMtZmxleC1kaXJlY3Rpb246IHJvdztcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gICAgICAtd2Via2l0LWJveC1wYWNrOiBlbmQ7XG4gICAgICAtd2Via2l0LWp1c3RpZnktY29udGVudDogZmxleC1lbmQ7XG4gICAgICAtbXMtZmxleC1wYWNrOiBlbmQ7XG4gICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtZW5kO1xuICAgICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIH1cblxuICAgIC5zZWNvbmRhcnlidXR0b24ge1xuICAgICAgaGVpZ2h0OiA2MHB4O1xuICAgICAgYm9yZGVyOiAycHggc29saWQgI2YyZGVmNTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDMwcHg7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmO1xuICAgIH1cblxuICAgIC5jaGlwZmxhc2hwb3Mge1xuICAgICAgaGVpZ2h0OiA0MHB4O1xuICAgICAgbWFyZ2luLWJvdHRvbTogMjBweDtcbiAgICAgIHBhZGRpbmctdG9wOiAxMHB4O1xuICAgICAgcGFkZGluZy1ib3R0b206IDEwcHg7XG4gICAgICAtd2Via2l0LWJveC1mbGV4OiAwO1xuICAgICAgLXdlYmtpdC1mbGV4OiAwIGF1dG87XG4gICAgICAtbXMtZmxleDogMCBhdXRvO1xuICAgICAgZmxleDogMCBhdXRvO1xuICAgICAgYm9yZGVyOiAycHggc29saWQgI2YyZGVmNTtcbiAgICAgIGJvcmRlci1yYWRpdXM6IDMwcHg7XG4gICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjYTA0YmNlO1xuICAgIH1cblxuICAgIC5wYXJhZ3JhcGgge1xuICAgICAgZm9udC1zaXplOiAyMHB4O1xuICAgIH1cblxuICAgIC5tYWluYnV0dG9uIHtcbiAgICAgIGhlaWdodDogNjBweDtcbiAgICAgIGJvcmRlcjogMnB4IHNvbGlkICNmMmRlZjU7XG4gICAgICBib3JkZXItcmFkaXVzOiAzMHB4O1xuICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzdmMmZmZjtcbiAgICB9XG5cbiAgICAuaGVhbHRoZmFjdG9yaW5mbyB7XG4gICAgICAtd2Via2l0LWJveC1hbGlnbjogZW5kO1xuICAgICAgLXdlYmtpdC1hbGlnbi1pdGVtczogZmxleC1lbmQ7XG4gICAgICAtbXMtZmxleC1hbGlnbjogZW5kO1xuICAgICAgYWxpZ24taXRlbXM6IGZsZXgtZW5kO1xuICAgIH1cbiAgfVxuXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDk5MXB4KSB7XG4gICAgcCB7XG4gICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gICAgfVxuXG4gICAgLmhlYWRlcmNvbnRlbnRzLnJpZ2h0IHtcbiAgICAgIHdpZHRoOiBhdXRvO1xuICAgICAgcGFkZGluZy10b3A6IDQwcHg7XG4gICAgfVxuXG4gICAgLmhlYWRlcjE0MDBjb250YWluZXIge1xuICAgICAgcGFkZGluZy1yaWdodDogNDBweDtcbiAgICAgIHBhZGRpbmctbGVmdDogNDBweDtcbiAgICAgIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gICAgICAtd2Via2l0LWJveC1kaXJlY3Rpb246IG5vcm1hbDtcbiAgICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICAgIC1tcy1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgICB9XG5cbiAgICAubmF2YmxvY2tpdGVtc3RyaWdnZXIge1xuICAgICAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gICAgICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7XG4gICAgICBkaXNwbGF5OiAtbXMtZmxleGJveDtcbiAgICAgIGRpc3BsYXk6IGZsZXg7XG4gICAgICB3aWR0aDogOTBweDtcbiAgICB9XG5cbiAgICAubmF2YmxvY2tpdGVtc3RyaWdnZXI6YWN0aXZlIHtcbiAgICAgIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC41KTtcbiAgICB9XG5cbiAgICAubmF2bGluayB7XG4gICAgICB3aWR0aDogYXV0bztcbiAgICB9XG5cbiAgICAuc2VjdGlvbmNvbnRlbnRzIHtcbiAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgIG1hcmdpbi10b3A6IDBweDtcbiAgICAgIHBhZGRpbmctdG9wOiA0MTlweDtcbiAgICAgIHBhZGRpbmctcmlnaHQ6IDIwcHg7XG4gICAgICBwYWRkaW5nLWxlZnQ6IDIwcHg7XG4gICAgfVxuXG4gICAgLmNvbHVtbnNwb3NpdGlvbnMge1xuICAgICAgLXdlYmtpdC1ib3gtb3JpZW50OiB2ZXJ0aWNhbDtcbiAgICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgLW1zLWZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgLXdlYmtpdC1ib3gtYWxpZ246IGNlbnRlcjtcbiAgICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIC1tcy1mbGV4LWFsaWduOiBjZW50ZXI7XG4gICAgICBhbGlnbi1pdGVtczogY2VudGVyO1xuICAgIH1cbiAgfVxuXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDc2N3B4KSB7XG4gICAgLmhlYWRlcmJ1dHRvbiB7XG4gICAgICBtYXgtd2lkdGg6IDEyNXB4O1xuICAgICAgbWluLXdpZHRoOiAxMjVweDtcbiAgICB9XG5cbiAgICAuZmxhc2hsb2dvIHtcbiAgICAgIG1heC13aWR0aDogODAlO1xuICAgIH1cblxuICAgIC5uYXZiYXJpdGVtcyB7XG4gICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgd2lkdGg6IDMyMHB4O1xuICAgIH1cblxuICAgIC5uYXZibG9ja2l0ZW1zdHJpZ2dlciB7XG4gICAgICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgICAgIGRpc3BsYXk6IC13ZWJraXQtZmxleDtcbiAgICAgIGRpc3BsYXk6IC1tcy1mbGV4Ym94O1xuICAgICAgZGlzcGxheTogZmxleDtcbiAgICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgICAgYWxpZ24tc2VsZjogY2VudGVyO1xuICAgIH1cblxuICAgIC5uYXZiYXJ0ZXh0YmxvY2sge1xuICAgICAgZGlzcGxheTogYmxvY2s7XG4gICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgaGVpZ2h0OiBhdXRvO1xuICAgICAgbWFyZ2luLXRvcDogLTFweDtcbiAgICAgIC13ZWJraXQtYm94LXBhY2s6IGNlbnRlcjtcbiAgICAgIC13ZWJraXQtanVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gICAgICAtbXMtZmxleC1wYWNrOiBjZW50ZXI7XG4gICAgICBqdXN0aWZ5LWNvbnRlbnQ6IGNlbnRlcjtcbiAgICAgIC13ZWJraXQtYm94LWFsaWduOiBjZW50ZXI7XG4gICAgICAtd2Via2l0LWFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gICAgICAtbXMtZmxleC1hbGlnbjogY2VudGVyO1xuICAgICAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgICAgIC13ZWJraXQtYWxpZ24tc2VsZjogYXV0bztcbiAgICAgIC1tcy1mbGV4LWl0ZW0tYWxpZ246IGF1dG87XG4gICAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGF1dG87XG4gICAgICBhbGlnbi1zZWxmOiBhdXRvO1xuICAgIH1cblxuICAgIC5uYXZsaW5rIHtcbiAgICAgIHdpZHRoOiBhdXRvO1xuICAgICAgbWFyZ2luLXRvcDogLTNweDtcbiAgICB9XG5cbiAgICAubmF2bGluay53LS1jdXJyZW50IHtcbiAgICAgIG1hcmdpbi10b3A6IDFweDtcbiAgICB9XG5cbiAgICAuc2VjdGlvbmZsYXNocG9zIHtcbiAgICAgIHBhZGRpbmctcmlnaHQ6IDIwcHg7XG4gICAgICBwYWRkaW5nLWxlZnQ6IDIwcHg7XG4gICAgfVxuXG4gICAgLmNvbHVtbnNwb3NpdGlvbnMge1xuICAgICAgLXdlYmtpdC1ib3gtb3JpZW50OiB2ZXJ0aWNhbDtcbiAgICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogbm9ybWFsO1xuICAgICAgLXdlYmtpdC1mbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgICAgLW1zLWZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gICAgICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICAgIH1cbiAgfVxuXG4gIEBtZWRpYSBzY3JlZW4gYW5kIChtYXgtd2lkdGg6IDQ3OXB4KSB7XG4gICAgLmZsYXNoc3VpdGVsb2dvIHtcbiAgICAgIG1hcmdpbi1ib3R0b206IDBweDtcbiAgICB9XG5cbiAgICAubm5hdmJhcmNvbnRlbnRzIHtcbiAgICAgIG1hcmdpbi1yaWdodDogMjBweDtcbiAgICAgIG1hcmdpbi1sZWZ0OiAyMHB4O1xuICAgIH1cblxuICAgIC5uYXZiYXJpdGVtcyB7XG4gICAgICB3aWR0aDogYXV0bztcbiAgICAgIC13ZWJraXQtYm94LW9yaWVudDogaG9yaXpvbnRhbDtcbiAgICAgIC13ZWJraXQtYm94LWRpcmVjdGlvbjogcmV2ZXJzZTtcbiAgICAgIC13ZWJraXQtZmxleC1kaXJlY3Rpb246IHJvdy1yZXZlcnNlO1xuICAgICAgLW1zLWZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZTtcbiAgICAgIGZsZXgtZGlyZWN0aW9uOiByb3ctcmV2ZXJzZTtcbiAgICAgIC13ZWJraXQtYm94LXBhY2s6IHN0YXJ0O1xuICAgICAgLXdlYmtpdC1qdXN0aWZ5LWNvbnRlbnQ6IGZsZXgtc3RhcnQ7XG4gICAgICAtbXMtZmxleC1wYWNrOiBzdGFydDtcbiAgICAgIGp1c3RpZnktY29udGVudDogZmxleC1zdGFydDtcbiAgICAgIC13ZWJraXQtZmxleC13cmFwOiBub3dyYXA7XG4gICAgICAtbXMtZmxleC13cmFwOiBub3dyYXA7XG4gICAgICBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgICAgIC13ZWJraXQtYm94LWFsaWduOiBzdGFydDtcbiAgICAgIC13ZWJraXQtYWxpZ24taXRlbXM6IGZsZXgtc3RhcnQ7XG4gICAgICAtbXMtZmxleC1hbGlnbjogc3RhcnQ7XG4gICAgICBhbGlnbi1pdGVtczogZmxleC1zdGFydDtcbiAgICAgIC13ZWJraXQtYWxpZ24tY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgICAgIC1tcy1mbGV4LWxpbmUtcGFjazoganVzdGlmeTtcbiAgICAgIGFsaWduLWNvbnRlbnQ6IHNwYWNlLWJldHdlZW47XG4gICAgfVxuXG4gICAgLm5hdmJsb2NraXRlbXN0cmlnZ2VyIHtcbiAgICAgIGRpc3BsYXk6IG5vbmU7XG4gICAgfVxuXG4gICAgLm5hdmJhcnRleHRibG9jayB7XG4gICAgICBkaXNwbGF5OiBub25lO1xuICAgIH1cblxuICAgIC5uYXZsaW5rLnctLWN1cnJlbnQge1xuICAgICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICMwZmY7XG4gICAgfVxuICB9XG5cbiAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTkyMHB4KSB7XG4gICAgI0FQUkxvYW4wMU9SRy53LW5vZGUtOWM1OTIwY2Q1YTNkLTNlNWI5N2VlIHtcbiAgICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgICAgLW1zLWdyaWQtcm93LWFsaWduOiBjZW50ZXI7XG4gICAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgfVxuXG4gICAgI0FQUkxvYW4wMU9SRy53LW5vZGUtNmE4NjFmMzEzMDlkLTNlNWI5N2VlIHtcbiAgICAgIC13ZWJraXQtYWxpZ24tc2VsZjogY2VudGVyO1xuICAgICAgLW1zLWZsZXgtaXRlbS1hbGlnbjogY2VudGVyO1xuICAgICAgLW1zLWdyaWQtcm93LWFsaWduOiBjZW50ZXI7XG4gICAgICBhbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgfVxuXG4gICAgI3ctbm9kZS1lMmZkNTFjNDViZmQtM2U1Yjk3ZWUge1xuICAgICAgLW1zLWdyaWQtcm93OiA1O1xuICAgICAgLW1zLWdyaWQtY29sdW1uOiAxO1xuICAgICAgZ3JpZC1hcmVhOiBFbXB0eS1hcmVhO1xuICAgIH1cblxuICAgIC5ncmlkZGVzdGluYXRpb24gPiAjdy1ub2RlLWUyZmQ1MWM0NWJmZC0zZTViOTdlZSB7XG4gICAgICAtbXMtZ3JpZC1yb3c6IDU7XG4gICAgICAtbXMtZ3JpZC1jb2x1bW46IDE7XG4gICAgfVxuXG4gICAgQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogMTkyMHB4KSB7XG4gICAgICAuZ3JpZGRlc3RpbmF0aW9uID4gI3ctbm9kZS1lMmZkNTFjNDViZmQtM2U1Yjk3ZWUge1xuICAgICAgICAtbXMtZ3JpZC1yb3c6IDM7XG4gICAgICAgIC1tcy1ncmlkLWNvbHVtbjogMTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAjQVBSTG9hbjAxT1JHLnctbm9kZS00NjAwNjY5YWYyMjMtM2U1Yjk3ZWUge1xuICAgICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAjQVBSTG9hbjAxT1JHLnctbm9kZS01NmI2NmI2MjZlNzktM2U1Yjk3ZWUge1xuICAgICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICB9XG5cbiAgICAjQVBSTG9hbjAxT1JHLnctbm9kZS04MWI1YjFmOTU3NzctM2U1Yjk3ZWUge1xuICAgICAgLXdlYmtpdC1hbGlnbi1zZWxmOiBjZW50ZXI7XG4gICAgICAtbXMtZmxleC1pdGVtLWFsaWduOiBjZW50ZXI7XG4gICAgICAtbXMtZ3JpZC1yb3ctYWxpZ246IGNlbnRlcjtcbiAgICAgIGFsaWduLXNlbGY6IGNlbnRlcjtcbiAgICB9XG4gIH1cbjwvc3R5bGU+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBMEZFLEVBQUUsZUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLElB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 */";
    	append_dev(document.head, style);
    }

    // (9:0) <Container >
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
    			add_location(img0, file$2, 11, 6, 285);
    			attr_dev(h4, "class", "textdarkmode svelte-12xl72x");
    			add_location(h4, file$2, 12, 6, 417);
    			attr_dev(p0, "class", "headerparagraph svelte-12xl72x");
    			add_location(p0, file$2, 13, 6, 469);
    			attr_dev(div0, "class", "headercontents left svelte-12xl72x");
    			add_location(div0, file$2, 10, 4, 245);
    			attr_dev(div1, "class", "frostedglasseffect svelte-12xl72x");
    			add_location(div1, file$2, 19, 12, 783);
    			if (img1.src !== (img1_src_value = "images/FlashPos-Sub-Logo-Dark.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "loading", "lazy");
    			attr_dev(img1, "width", "125");
    			attr_dev(img1, "alt", "");
    			attr_dev(img1, "class", "flashlogo svelte-12xl72x");
    			add_location(img1, file$2, 20, 36, 854);
    			attr_dev(div2, "class", "blockimage svelte-12xl72x");
    			add_location(div2, file$2, 20, 12, 830);
    			attr_dev(div3, "class", "frostedglasswrapper svelte-12xl72x");
    			add_location(div3, file$2, 18, 10, 737);
    			attr_dev(a0, "id", "flashPosTrigger");
    			attr_dev(a0, "href", "flashpos.html");
    			attr_dev(a0, "class", "headerbutton w-inline-block svelte-12xl72x");
    			add_location(a0, file$2, 17, 8, 645);
    			attr_dev(p1, "class", "headerparagraph headeritemparagraph svelte-12xl72x");
    			add_location(p1, file$2, 23, 8, 998);
    			attr_dev(div4, "class", "headeritemcontents svelte-12xl72x");
    			add_location(div4, file$2, 16, 6, 604);
    			attr_dev(div5, "class", "frostedglasseffect svelte-12xl72x");
    			add_location(div5, file$2, 28, 12, 1332);
    			if (img2.src !== (img2_src_value = "images/FlashArb-Sub-Logo-Dark.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "loading", "lazy");
    			attr_dev(img2, "width", "125");
    			attr_dev(img2, "alt", "");
    			attr_dev(img2, "class", "flashlogo svelte-12xl72x");
    			add_location(img2, file$2, 29, 36, 1403);
    			attr_dev(div6, "class", "blockimage svelte-12xl72x");
    			add_location(div6, file$2, 29, 12, 1379);
    			attr_dev(div7, "class", "frostedglasswrapper svelte-12xl72x");
    			add_location(div7, file$2, 27, 10, 1286);
    			attr_dev(a1, "id", "flashArbTrigger");
    			attr_dev(a1, "href", "flasharb.html");
    			attr_dev(a1, "class", "headerbutton w-inline-block svelte-12xl72x");
    			add_location(a1, file$2, 26, 8, 1194);
    			attr_dev(p2, "class", "headerparagraph headeritemparagraph svelte-12xl72x");
    			add_location(p2, file$2, 32, 8, 1547);
    			attr_dev(div8, "class", "headeritemcontents svelte-12xl72x");
    			add_location(div8, file$2, 25, 6, 1153);
    			attr_dev(div9, "class", "headercontents right svelte-12xl72x");
    			add_location(div9, file$2, 15, 4, 563);
    			attr_dev(div10, "data-w-id", "4a69aa65-f69d-177b-618b-fec329a2edbb");
    			set_style(div10, "opacity", "1");
    			attr_dev(div10, "class", "header1400container svelte-12xl72x");
    			add_location(div10, file$2, 9, 2, 140);
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
    		source: "(9:0) <Container >",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let container;
    	let current;

    	container = new Container({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

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

    			if (dirty & /*$$scope*/ 16) {
    				container_changes.$$scope = { dirty, ctx };
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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

    	$$self.$capture_state = () => ({
    		Container,
    		address,
    		network,
    		balance,
    		signer
    	});

    	$$self.$inject_state = $$props => {
    		if ("address" in $$props) address = $$props.address;
    		if ("network" in $$props) network = $$props.network;
    		if ("balance" in $$props) balance = $$props.balance;
    		if ("signer" in $$props) signer = $$props.signer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [];
    }

    class Main extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		if (!document.getElementById("svelte-12xl72x-style")) add_css$2();
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Main",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    new Main({
      target: document.body,
      props: {}
    });

}());
//# sourceMappingURL=main.js.map
