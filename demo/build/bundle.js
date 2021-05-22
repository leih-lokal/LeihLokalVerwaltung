var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    const active_docs = new Set();
    let active$1 = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active$1 += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active$1 -= deleted;
            if (!active$1)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active$1)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
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
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind$1(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
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
            mount_component(component, options.target, options.anchor, options.customElement);
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

    /**
     * @typedef {Object} WrappedComponent Object returned by the `wrap` method
     * @property {SvelteComponent} component - Component to load (this is always asynchronous)
     * @property {RoutePrecondition[]} [conditions] - Route pre-conditions to validate
     * @property {Object} [props] - Optional dictionary of static props
     * @property {Object} [userData] - Optional user data dictionary
     * @property {bool} _sveltesparouter - Internal flag; always set to true
     */

    /**
     * @callback AsyncSvelteComponent
     * @returns {Promise<SvelteComponent>} Returns a Promise that resolves with a Svelte component
     */

    /**
     * @callback RoutePrecondition
     * @param {RouteDetail} detail - Route detail object
     * @returns {boolean|Promise<boolean>} If the callback returns a false-y value, it's interpreted as the precondition failed, so it aborts loading the component (and won't process other pre-condition callbacks)
     */

    /**
     * @typedef {Object} WrapOptions Options object for the call to `wrap`
     * @property {SvelteComponent} [component] - Svelte component to load (this is incompatible with `asyncComponent`)
     * @property {AsyncSvelteComponent} [asyncComponent] - Function that returns a Promise that fulfills with a Svelte component (e.g. `{asyncComponent: () => import('Foo.svelte')}`)
     * @property {SvelteComponent} [loadingComponent] - Svelte component to be displayed while the async route is loading (as a placeholder); when unset or false-y, no component is shown while component
     * @property {object} [loadingParams] - Optional dictionary passed to the `loadingComponent` component as params (for an exported prop called `params`)
     * @property {object} [userData] - Optional object that will be passed to events such as `routeLoading`, `routeLoaded`, `conditionsFailed`
     * @property {object} [props] - Optional key-value dictionary of static props that will be passed to the component. The props are expanded with {...props}, so the key in the dictionary becomes the name of the prop.
     * @property {RoutePrecondition[]|RoutePrecondition} [conditions] - Route pre-conditions to add, which will be executed in order
     */

    /**
     * Wraps a component to enable multiple capabilities:
     * 1. Using dynamically-imported component, with (e.g. `{asyncComponent: () => import('Foo.svelte')}`), which also allows bundlers to do code-splitting.
     * 2. Adding route pre-conditions (e.g. `{conditions: [...]}`)
     * 3. Adding static props that are passed to the component
     * 4. Adding custom userData, which is passed to route events (e.g. route loaded events) or to route pre-conditions (e.g. `{userData: {foo: 'bar}}`)
     * 
     * @param {WrapOptions} args - Arguments object
     * @returns {WrappedComponent} Wrapped component
     */
    function wrap(args) {
        if (!args) {
            throw Error('Parameter args is required')
        }

        // We need to have one and only one of component and asyncComponent
        // This does a "XNOR"
        if (!args.component == !args.asyncComponent) {
            throw Error('One and only one of component and asyncComponent is required')
        }

        // If the component is not async, wrap it into a function returning a Promise
        if (args.component) {
            args.asyncComponent = () => Promise.resolve(args.component);
        }

        // Parameter asyncComponent and each item of conditions must be functions
        if (typeof args.asyncComponent != 'function') {
            throw Error('Parameter asyncComponent must be a function')
        }
        if (args.conditions) {
            // Ensure it's an array
            if (!Array.isArray(args.conditions)) {
                args.conditions = [args.conditions];
            }
            for (let i = 0; i < args.conditions.length; i++) {
                if (!args.conditions[i] || typeof args.conditions[i] != 'function') {
                    throw Error('Invalid parameter conditions[' + i + ']')
                }
            }
        }

        // Check if we have a placeholder component
        if (args.loadingComponent) {
            args.asyncComponent.loading = args.loadingComponent;
            args.asyncComponent.loadingParams = args.loadingParams || undefined;
        }

        // Returns an object that contains all the functions to execute too
        // The _sveltesparouter flag is to confirm the object was created by this router
        const obj = {
            component: args.asyncComponent,
            userData: args.userData,
            conditions: (args.conditions && args.conditions.length) ? args.conditions : undefined,
            props: (args.props && Object.keys(args.props).length) ? args.props : {},
            _sveltesparouter: true
        };

        return obj
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
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
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.38.2 */

    function create_else_block$a(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*props*/ 4)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*props*/ ctx[2])])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler_1*/ ctx[7]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    // (202:0) {#if componentParams}
    function create_if_block$e(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [{ params: /*componentParams*/ ctx[1] }, /*props*/ ctx[2]];
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    		switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = (dirty & /*componentParams, props*/ 6)
    			? get_spread_update(switch_instance_spread_levels, [
    					dirty & /*componentParams*/ 2 && { params: /*componentParams*/ ctx[1] },
    					dirty & /*props*/ 4 && get_spread_object(/*props*/ ctx[2])
    				])
    			: {};

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					switch_instance.$on("routeEvent", /*routeEvent_handler*/ ctx[6]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment$J(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$e, create_else_block$a];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*componentParams*/ ctx[1]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    /**
     * @typedef {Object} Location
     * @property {string} location - Location (page/view), for example `/book`
     * @property {string} [querystring] - Querystring from the hash, as a string not parsed
     */
    /**
     * Returns the current location from the hash.
     *
     * @returns {Location} Location object
     * @private
     */
    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	// Check if there's a querystring
    	const qsPosition = location.indexOf("?");

    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(null, // eslint-disable-next-line prefer-arrow-callback
    function start(set) {
    	set(getLocation());

    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location$1 = derived(loc, $loc => $loc.location);
    derived(loc, $loc => $loc.querystring);

    async function replace(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	// Execute this code when the current call stack is complete
    	await tick();

    	const dest = (location.charAt(0) == "#" ? "" : "#") + location;

    	try {
    		window.history.replaceState(undefined, undefined, dest);
    	} catch(e) {
    		// eslint-disable-next-line no-console
    		console.warn("Caught exception while replacing the current page. If you're running this in the Svelte REPL, please note that the `replace` method might not work in this environment.");
    	}

    	// The method above doesn't trigger the hashchange event, so let's do that manually
    	window.dispatchEvent(new Event("hashchange"));
    }

    function link(node, hrefVar) {
    	// Only apply to <a> tags
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	updateLink(node, hrefVar || node.getAttribute("href"));

    	return {
    		update(updated) {
    			updateLink(node, updated);
    		}
    	};
    }

    // Internal function used by the link function
    function updateLink(node, href) {
    	// Destination must start with '/'
    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute: " + href);
    	}

    	// Add # to the href attribute
    	node.setAttribute("href", "#" + href);

    	node.addEventListener("click", scrollstateHistoryHandler);
    }

    /**
     * The handler attached to an anchor tag responsible for updating the
     * current history state with the current scroll state
     *
     * @param {HTMLElementEventMap} event - an onclick event attached to an anchor tag
     */
    function scrollstateHistoryHandler(event) {
    	// Prevent default anchor onclick behaviour
    	event.preventDefault();

    	const href = event.currentTarget.getAttribute("href");

    	// Setting the url (3rd arg) to href will break clicking for reasons, so don't try to do that
    	history.replaceState(
    		{
    			scrollX: window.scrollX,
    			scrollY: window.scrollY
    		},
    		undefined,
    		undefined
    	);

    	// This will force an update as desired, but this time our scroll state will be attached
    	window.location.hash = href;
    }

    function instance$J($$self, $$props, $$invalidate) {
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;
    	let { restoreScrollState = false } = $$props;

    	/**
     * Container for a route: path, component
     */
    	class RouteItem {
    		/**
     * Initializes the object and creates a regular expression from the path, using regexparam.
     *
     * @param {string} path - Path to the route (must start with '/' or '*')
     * @param {SvelteComponent|WrappedComponent} component - Svelte component for the route, optionally wrapped
     */
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			// Path must be a regular or expression, or a string starting with '/' or '*'
    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument - strings must start with / or *");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			// Check if the component is wrapped and we have conditions
    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.component;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    				this.props = component.props || {};
    			} else {
    				// Convert the component to a function that returns a Promise, to normalize it
    				this.component = () => Promise.resolve(component);

    				this.conditions = [];
    				this.props = {};
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		/**
     * Checks if `path` matches the current route.
     * If there's a match, will return the list of parameters from the URL (if any).
     * In case of no match, the method will return `null`.
     *
     * @param {string} path - Path to test
     * @returns {null|Object.<string, string>} List of paramters from the URL if there's a match, or `null` otherwise.
     */
    		match(path) {
    			// If there's a prefix, check if it matches the start of the path.
    			// If not, bail early, else remove it before we run the matching.
    			if (prefix) {
    				if (typeof prefix == "string") {
    					if (path.startsWith(prefix)) {
    						path = path.substr(prefix.length) || "/";
    					} else {
    						return null;
    					}
    				} else if (prefix instanceof RegExp) {
    					const match = path.match(prefix);

    					if (match && match[0]) {
    						path = path.substr(match[0].length) || "/";
    					} else {
    						return null;
    					}
    				}
    			}

    			// Check if the pattern matches
    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			// If the input was a regular expression, this._keys would be false, so return matches as is
    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				// In the match parameters, URL-decode all values
    				try {
    					out[this._keys[i]] = decodeURIComponent(matches[i + 1] || "") || null;
    				} catch(e) {
    					out[this._keys[i]] = null;
    				}

    				i++;
    			}

    			return out;
    		}

    		/**
     * Dictionary with route details passed to the pre-conditions functions, as well as the `routeLoading`, `routeLoaded` and `conditionsFailed` events
     * @typedef {Object} RouteDetail
     * @property {string|RegExp} route - Route matched as defined in the route definition (could be a string or a reguar expression object)
     * @property {string} location - Location path
     * @property {string} querystring - Querystring from the hash
     * @property {object} [userData] - Custom data passed by the user
     * @property {SvelteComponent} [component] - Svelte component (only in `routeLoaded` events)
     * @property {string} [name] - Name of the Svelte component (only in `routeLoaded` events)
     */
    		/**
     * Executes all conditions (if any) to control whether the route can be shown. Conditions are executed in the order they are defined, and if a condition fails, the following ones aren't executed.
     * 
     * @param {RouteDetail} detail - Route detail
     * @returns {bool} Returns true if all the conditions succeeded
     */
    		async checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!await this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	// Set up all routes
    	const routesList = [];

    	if (routes instanceof Map) {
    		// If it's a map, iterate on it right away
    		routes.forEach((route, path) => {
    			routesList.push(new RouteItem(path, route));
    		});
    	} else {
    		// We have an object, so iterate on its own properties
    		Object.keys(routes).forEach(path => {
    			routesList.push(new RouteItem(path, routes[path]));
    		});
    	}

    	// Props for the component to render
    	let component = null;

    	let componentParams = null;
    	let props = {};

    	// Event dispatcher from Svelte
    	const dispatch = createEventDispatcher();

    	// Just like dispatch, but executes on the next iteration of the event loop
    	async function dispatchNextTick(name, detail) {
    		// Execute this code when the current call stack is complete
    		await tick();

    		dispatch(name, detail);
    	}

    	// If this is set, then that means we have popped into this var the state of our last scroll position
    	let previousScrollState = null;

    	if (restoreScrollState) {
    		window.addEventListener("popstate", event => {
    			// If this event was from our history.replaceState, event.state will contain
    			// our scroll history. Otherwise, event.state will be null (like on forward
    			// navigation)
    			if (event.state && event.state.scrollY) {
    				previousScrollState = event.state;
    			} else {
    				previousScrollState = null;
    			}
    		});

    		afterUpdate(() => {
    			// If this exists, then this is a back navigation: restore the scroll position
    			if (previousScrollState) {
    				window.scrollTo(previousScrollState.scrollX, previousScrollState.scrollY);
    			} else {
    				// Otherwise this is a forward navigation: scroll to top
    				window.scrollTo(0, 0);
    			}
    		});
    	}

    	// Always have the latest value of loc
    	let lastLoc = null;

    	// Current object of the component loaded
    	let componentObj = null;

    	// Handle hash change events
    	// Listen to changes in the $loc store and update the page
    	// Do not use the $: syntax because it gets triggered by too many things
    	loc.subscribe(async newLoc => {
    		lastLoc = newLoc;

    		// Find a route matching the location
    		let i = 0;

    		while (i < routesList.length) {
    			const match = routesList[i].match(newLoc.location);

    			if (!match) {
    				i++;
    				continue;
    			}

    			const detail = {
    				route: routesList[i].path,
    				location: newLoc.location,
    				querystring: newLoc.querystring,
    				userData: routesList[i].userData
    			};

    			// Check if the route can be loaded - if all conditions succeed
    			if (!await routesList[i].checkConditions(detail)) {
    				// Don't display anything
    				$$invalidate(0, component = null);

    				componentObj = null;

    				// Trigger an event to notify the user, then exit
    				dispatchNextTick("conditionsFailed", detail);

    				return;
    			}

    			// Trigger an event to alert that we're loading the route
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoading", Object.assign({}, detail));

    			// If there's a component to show while we're loading the route, display it
    			const obj = routesList[i].component;

    			// Do not replace the component if we're loading the same one as before, to avoid the route being unmounted and re-mounted
    			if (componentObj != obj) {
    				if (obj.loading) {
    					$$invalidate(0, component = obj.loading);
    					componentObj = obj;
    					$$invalidate(1, componentParams = obj.loadingParams);
    					$$invalidate(2, props = {});

    					// Trigger the routeLoaded event for the loading component
    					// Create a copy of detail so we don't modify the object for the dynamic route (and the dynamic route doesn't modify our object too)
    					dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));
    				} else {
    					$$invalidate(0, component = null);
    					componentObj = null;
    				}

    				// Invoke the Promise
    				const loaded = await obj();

    				// Now that we're here, after the promise resolved, check if we still want this component, as the user might have navigated to another page in the meanwhile
    				if (newLoc != lastLoc) {
    					// Don't update the component, just exit
    					return;
    				}

    				// If there is a "default" property, which is used by async routes, then pick that
    				$$invalidate(0, component = loaded && loaded.default || loaded);

    				componentObj = obj;
    			}

    			// Set componentParams only if we have a match, to avoid a warning similar to `<Component> was created with unknown prop 'params'`
    			// Of course, this assumes that developers always add a "params" prop when they are expecting parameters
    			if (match && typeof match == "object" && Object.keys(match).length) {
    				$$invalidate(1, componentParams = match);
    			} else {
    				$$invalidate(1, componentParams = null);
    			}

    			// Set static props, if any
    			$$invalidate(2, props = routesList[i].props);

    			// Dispatch the routeLoaded event then exit
    			// We need to clone the object on every event invocation so we don't risk the object to be modified in the next tick
    			dispatchNextTick("routeLoaded", Object.assign({}, detail, { component, name: component.name }));

    			return;
    		}

    		// If we're still here, there was no match, so show the empty component
    		$$invalidate(0, component = null);

    		componentObj = null;
    	});

    	function routeEvent_handler(event) {
    		bubble($$self, event);
    	}

    	function routeEvent_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("routes" in $$props) $$invalidate(3, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(4, prefix = $$props.prefix);
    		if ("restoreScrollState" in $$props) $$invalidate(5, restoreScrollState = $$props.restoreScrollState);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*restoreScrollState*/ 32) {
    			// Update history.scrollRestoration depending on restoreScrollState
    			history.scrollRestoration = restoreScrollState ? "manual" : "auto";
    		}
    	};

    	return [
    		component,
    		componentParams,
    		props,
    		routes,
    		prefix,
    		restoreScrollState,
    		routeEvent_handler,
    		routeEvent_handler_1
    	];
    }

    class Router extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$J, create_fragment$J, safe_not_equal, {
    			routes: 3,
    			prefix: 4,
    			restoreScrollState: 5
    		});
    	}
    }

    const notification = writable();

    /* node_modules/@beyonk/svelte-notifications/src/Notifications.svelte generated by Svelte v3.38.2 */

    function get_each_context$h(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (2:1) {#each toasts as toast (toast.id)}
    function create_each_block$h(key_1, ctx) {
    	let li;
    	let div0;
    	let t0_value = /*toast*/ ctx[8].msg + "";
    	let t0;
    	let t1;
    	let div1;
    	let t2;
    	let li_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function animationend_handler() {
    		return /*animationend_handler*/ ctx[4](/*toast*/ ctx[8]);
    	}

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			li = element("li");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			attr(div0, "class", "content svelte-riwzrl");
    			attr(div1, "class", "progress svelte-riwzrl");
    			set_style(div1, "animation-duration", /*toast*/ ctx[8].timeout + "ms");
    			attr(li, "class", "toast svelte-riwzrl");
    			set_style(li, "background", /*toast*/ ctx[8].background);
    			this.first = li;
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, div0);
    			append(div0, t0);
    			append(li, t1);
    			append(li, div1);
    			append(li, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen(div1, "animationend", animationend_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*toasts*/ 1) && t0_value !== (t0_value = /*toast*/ ctx[8].msg + "")) set_data(t0, t0_value);

    			if (!current || dirty & /*toasts*/ 1) {
    				set_style(div1, "animation-duration", /*toast*/ ctx[8].timeout + "ms");
    			}

    			if (!current || dirty & /*toasts*/ 1) {
    				set_style(li, "background", /*toast*/ ctx[8].background);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (li_outro) li_outro.end(1);
    			current = true;
    		},
    		o(local) {
    			li_outro = create_out_transition(li, animateOut, {});
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			if (detaching && li_outro) li_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$I(ctx) {
    	let ul;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*toasts*/ ctx[0];
    	const get_key = ctx => /*toast*/ ctx[8].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$h(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$h(key, child_ctx));
    	}

    	return {
    		c() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(ul, "class", "toasts svelte-riwzrl");
    		},
    		m(target, anchor) {
    			insert(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*toasts, removeToast*/ 3) {
    				each_value = /*toasts*/ ctx[0];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, outro_and_destroy_block, create_each_block$h, null, get_each_context$h);
    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};
    }

    function animateOut(node, { delay = 0, duration = 1000 }) {

    	return {
    		delay,
    		duration,
    		css: t => `opacity: ${(t - 0.7) * 1}; transform-origin: top right;`
    	};
    }

    function instance$I($$self, $$props, $$invalidate) {
    	let { themes = {
    		danger: "#bb2124",
    		success: "#22bb33",
    		warning: "#f0ad4e",
    		info: "#5bc0de",
    		default: "#aaaaaa"
    	} } = $$props;

    	let { timeout = 3000 } = $$props;
    	let count = 0;
    	let toasts = [];
    	let unsubscribe;

    	function createToast(msg, theme, to) {
    		const background = themes[theme] || themes["default"];

    		$$invalidate(0, toasts = [
    			{
    				id: count,
    				msg,
    				background,
    				timeout: to || timeout,
    				width: "100%"
    			},
    			...toasts
    		]);

    		count = count + 1;
    	}

    	unsubscribe = notification.subscribe(value => {
    		if (!value) {
    			return;
    		}

    		createToast(value.message, value.type, value.timeout);
    		notification.set();
    	});

    	onDestroy(unsubscribe);

    	function removeToast(id) {
    		$$invalidate(0, toasts = toasts.filter(t => t.id != id));
    	}

    	const animationend_handler = toast => removeToast(toast.id);

    	$$self.$$set = $$props => {
    		if ("themes" in $$props) $$invalidate(2, themes = $$props.themes);
    		if ("timeout" in $$props) $$invalidate(3, timeout = $$props.timeout);
    	};

    	return [toasts, removeToast, themes, timeout, animationend_handler];
    }

    class Notifications extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$I, create_fragment$I, safe_not_equal, { themes: 2, timeout: 3 });
    	}
    }

    function send (message, type = 'default', timeout) {
      notification.set({ type, message, timeout });
    }

    function danger (msg, timeout) {
      send(msg, 'danger', timeout);
    }

    function warning (msg, timeout) {
      send(msg, 'warning', timeout);
    }

    function success (msg, timeout) {
      send(msg, 'success', timeout);
    }

    // List of nodes to update
    const nodes = [];

    // Current location
    let location;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        const matchesLocation = el.pattern.test(location);
        toggleClasses(el, el.className, matchesLocation);
        toggleClasses(el, el.inactiveClassName, !matchesLocation);
    }

    function toggleClasses(el, className, shouldAdd) {
        (className || '').split(' ').forEach((cls) => {
            if (!cls) {
                return
            }
            // Remove the class firsts
            el.node.classList.remove(cls);

            // If the pattern doesn't match, then set the class
            if (shouldAdd) {
                el.node.classList.add(cls);
            }
        });
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string|RegExp} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string|RegExp} [opts] - Can be an object of type ActiveOptions, or a string (or regular expressions) representing ActiveOptions.path.
     * @returns {{destroy: function(): void}} Destroy function
     */
    function active(node, opts) {
        // Check options
        if (opts && (typeof opts == 'string' || (typeof opts == 'object' && opts instanceof RegExp))) {
            // Interpret strings and regular expressions as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // If path is a string, it must start with '/' or '*'
        if (!opts.path || 
            typeof opts.path == 'string' && (opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*'))
        ) {
            throw Error('Invalid value for "path" argument')
        }

        // If path is not a regular expression already, make it
        const {pattern} = typeof opts.path == 'string' ?
            regexparam(opts.path) :
            {pattern: opts.path};

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            inactiveClassName: opts.inactiveClassName,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    var docs = [
    	{
    		firstname: "Nissy",
    		lastname: "Tunno",
    		email: "ntunnol4@princeton.edu",
    		city: "Shikeng",
    		street: "Blue Bill Park",
    		house_number: "6",
    		telephone_number: "6187969517",
    		subscribed_to_newsletter: false,
    		_id: "7e2f6d14-4137-564e-86e7-ca46dcf8cf74",
    		id: 1,
    		type: "customer",
    		registration_date: 1608940800000,
    		renewed_on: 0,
    		postal_code: 21810,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615075200000,
    		highlight: ""
    	},
    	{
    		firstname: "Zilvia",
    		lastname: "Heaviside",
    		email: "zheavisidef8@qq.com",
    		city: "Abeokuta",
    		street: "Evergreen",
    		house_number: "851",
    		telephone_number: "9511662807",
    		subscribed_to_newsletter: false,
    		_id: "f8ed73b5-fd2b-58be-8fbb-d7bd0fa38ee2",
    		id: 2,
    		type: "customer",
    		registration_date: 1605139200000,
    		renewed_on: 0,
    		postal_code: 92750,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616803200000,
    		highlight: ""
    	},
    	{
    		firstname: "Quincey",
    		lastname: "MacAllaster",
    		email: "qmacallaster6n@independent.co.uk",
    		city: "Złoty Stok",
    		postal_code: 48601,
    		street: "Oxford",
    		house_number: "66908",
    		telephone_number: "5742228330",
    		subscribed_to_newsletter: true,
    		_id: "f58638c6-3c92-5bc3-bd42-223eca736f1c",
    		id: 3,
    		type: "customer",
    		registration_date: 1598313600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614816000000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Enrica",
    		lastname: "Luetkemeyers",
    		email: "eluetkemeyerspq@acquirethisname.com",
    		city: "Karang Kulon",
    		street: "Ruskin",
    		house_number: "49",
    		telephone_number: "8479421710",
    		subscribed_to_newsletter: false,
    		_id: "4a2e21d8-12a9-5e07-aee1-953b48399652",
    		id: 4,
    		type: "customer",
    		registration_date: 1586995200000,
    		renewed_on: 0,
    		postal_code: 63473,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616457600000,
    		highlight: ""
    	},
    	{
    		firstname: "Lay",
    		lastname: "Ogelsby",
    		email: "logelsbylw@wordpress.com",
    		city: "Banjar Mambalkajanan",
    		street: "Iowa",
    		house_number: "800",
    		telephone_number: "7174438962",
    		subscribed_to_newsletter: true,
    		_id: "3d04a648-8149-5ddd-a33d-bb9671c8f642",
    		id: 5,
    		type: "customer",
    		registration_date: 1586822400000,
    		renewed_on: 0,
    		postal_code: 84522,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615680000000,
    		highlight: ""
    	},
    	{
    		firstname: "Baldwin",
    		lastname: "Sheilds",
    		email: "bsheildsoi@netscape.com",
    		city: "Valday",
    		postal_code: 86534,
    		street: "Lakewood Gardens",
    		house_number: "28",
    		telephone_number: "6489598645",
    		subscribed_to_newsletter: true,
    		_id: "0ead260b-faef-5d6d-ba89-f0114427ad47",
    		id: 6,
    		type: "customer",
    		registration_date: 1601078400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615507200000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Kennett",
    		lastname: "McNish",
    		email: "kmcnishhm@stumbleupon.com",
    		city: "Paris 07",
    		postal_code: 21630,
    		street: "Clarendon",
    		house_number: "6437",
    		telephone_number: "3364449161",
    		remark: "dui maecenas tristique est et",
    		subscribed_to_newsletter: true,
    		_id: "412e2c9d-0f62-5aa9-b1fa-ebec4e8d25e0",
    		id: 7,
    		type: "customer",
    		registration_date: 1602806400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616284800000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Nikaniki",
    		lastname: "Bursnell",
    		email: "nbursnell8z@house.gov",
    		city: "Verba",
    		postal_code: 68753,
    		street: "Lighthouse Bay",
    		house_number: "7",
    		telephone_number: "3223053856",
    		subscribed_to_newsletter: false,
    		_id: "5375c2e5-1eb8-58f1-ae58-c4cde86a245f",
    		id: 8,
    		type: "customer",
    		registration_date: 1567036800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614902400000,
    		highlight: ""
    	},
    	{
    		firstname: "Adler",
    		lastname: "Murie",
    		email: "amurieqj@state.gov",
    		city: "Tibro",
    		postal_code: 40318,
    		street: "Fairview",
    		house_number: "685",
    		telephone_number: "6309947304",
    		subscribed_to_newsletter: false,
    		_id: "9a818eb9-b7ca-51e3-a940-8c4d7090a444",
    		id: 9,
    		type: "customer",
    		registration_date: 1567728000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615248000000,
    		highlight: ""
    	},
    	{
    		firstname: "Michele",
    		lastname: "Maceur",
    		email: "mmaceurj6@weebly.com",
    		city: "Springfield",
    		postal_code: 21356,
    		street: "Grim",
    		house_number: "8604",
    		telephone_number: "7819757001",
    		subscribed_to_newsletter: true,
    		_id: "1d8db2e5f-22fe-5bd5-aa2c-8b07c1cf213a",
    		id: 10,
    		type: "customer",
    		registration_date: 1583884800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614643200000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Conroy",
    		lastname: "Kubicek",
    		email: "ckubicekq8@addthis.com",
    		city: "Provins",
    		postal_code: 92067,
    		street: "Center",
    		house_number: "9",
    		telephone_number: "9873270667",
    		subscribed_to_newsletter: true,
    		_id: "19f352587-c808-54b6-9835-1b569ae98f23",
    		id: 11,
    		type: "customer",
    		registration_date: 1570060800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615939200000,
    		highlight: ""
    	},
    	{
    		firstname: "Romeo",
    		lastname: "Marushak",
    		email: "rmarushakjo@icio.us",
    		city: "Rogowo",
    		postal_code: 77053,
    		street: "Mayer",
    		house_number: "6922",
    		telephone_number: "4832908208",
    		subscribed_to_newsletter: true,
    		_id: "129abe6ac-4b97-5127-9254-e4cc438caa80",
    		id: 12,
    		type: "customer",
    		registration_date: 1601424000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615939200000,
    		highlight: ""
    	},
    	{
    		firstname: "Claudianus",
    		lastname: "Fevier",
    		email: "cfevierde@xing.com",
    		city: "Nong Phok",
    		postal_code: 23811,
    		street: "Clemons",
    		house_number: "278",
    		telephone_number: "2069133956",
    		subscribed_to_newsletter: true,
    		_id: "1fcd45fd1-893f-5063-959b-3f4217c31b49",
    		id: 13,
    		type: "customer",
    		registration_date: 1599696000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615852800000,
    		highlight: ""
    	},
    	{
    		firstname: "Zea",
    		lastname: "Daville",
    		email: "zdaville8l@macromedia.com",
    		city: "Budapest",
    		postal_code: 46222,
    		street: "Mockingbird",
    		house_number: "8",
    		telephone_number: "1706083031",
    		subscribed_to_newsletter: false,
    		_id: "1a7632ae4-420a-5ffe-9202-3fe491662072",
    		id: 14,
    		type: "customer",
    		registration_date: 1568764800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615507200000,
    		highlight: ""
    	},
    	{
    		firstname: "Garek",
    		lastname: "Janikowski",
    		email: "gjanikowski6w@digg.com",
    		city: "Juhaynah",
    		street: "Raven",
    		house_number: "46054",
    		telephone_number: "5761735353",
    		remark: "luctus et ultrices",
    		subscribed_to_newsletter: false,
    		_id: "1cdbc3f74-9482-5cf0-8b4a-b59b1ab60605",
    		id: 15,
    		type: "customer",
    		registration_date: 1564876800000,
    		renewed_on: 0,
    		postal_code: 19530,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616112000000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Kale",
    		lastname: "Lainge",
    		email: "klainged1@qq.com",
    		city: "Timba Lauk",
    		street: "Schlimgen",
    		house_number: "03714",
    		telephone_number: "5921089325",
    		remark: "morbi odio odio elementum eu interdum eu",
    		subscribed_to_newsletter: false,
    		_id: "1265f3208-739e-564e-baf1-2d2ed78662fe",
    		id: 16,
    		type: "customer",
    		registration_date: 1592611200000,
    		renewed_on: 0,
    		postal_code: 49213,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616198400000,
    		highlight: ""
    	},
    	{
    		firstname: "Martguerita",
    		lastname: "Cruft",
    		email: "mcruftnm@devhub.com",
    		city: "Arroio Grande",
    		postal_code: 19960,
    		street: "Roxbury",
    		house_number: "957",
    		telephone_number: "5265199920",
    		subscribed_to_newsletter: false,
    		_id: "63b17439e-665a-5d4b-8f1d-6289ce1b83d5",
    		id: 60,
    		type: "customer",
    		registration_date: 1592611200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: ""
    	},
    	{
    		firstname: "Jeana",
    		lastname: "Collihole",
    		email: "jcolliholeqs@go.com",
    		city: "Zhukovo",
    		postal_code: 11832,
    		street: "Lotheville",
    		house_number: "615",
    		telephone_number: "1237584292",
    		subscribed_to_newsletter: false,
    		_id: "1a5cbb347-f3b5-5b7c-ac01-94ac710d1793",
    		id: 18,
    		type: "customer",
    		registration_date: 1556323200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614988800000,
    		highlight: ""
    	},
    	{
    		firstname: "Zorine",
    		lastname: "Stichel",
    		email: "zstichelby@goo.ne.jp",
    		city: "Carapo",
    		street: "Burning Wood",
    		house_number: "9",
    		telephone_number: "1117290665",
    		subscribed_to_newsletter: false,
    		_id: "16b998ef7-3c74-50a3-90ce-536621a2a470",
    		id: 19,
    		type: "customer",
    		registration_date: 1608595200000,
    		renewed_on: 0,
    		postal_code: 80629,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616716800000,
    		highlight: ""
    	},
    	{
    		firstname: "Fax",
    		lastname: "Moneypenny",
    		email: "fmoneypennyka@w3.org",
    		city: "Bol’shaya Setun’",
    		postal_code: 92795,
    		street: "Heffernan",
    		house_number: "6798",
    		telephone_number: "2892685720",
    		subscribed_to_newsletter: true,
    		_id: "2e5455327-fe25-52e9-a755-f1f197639774",
    		id: 20,
    		type: "customer",
    		registration_date: 1573689600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Jacquie",
    		lastname: "Costanza",
    		email: "jcostanza6k@dyndns.org",
    		city: "Glasgow",
    		postal_code: 25284,
    		street: "Pleasure",
    		house_number: "1",
    		telephone_number: "5476825732",
    		subscribed_to_newsletter: false,
    		_id: "3cf832bcb-0f69-5cbf-b7af-c1ee9255874e",
    		id: 30,
    		type: "customer",
    		registration_date: 1570665600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: ""
    	},
    	{
    		firstname: "Tiphanie",
    		lastname: "Macauley",
    		email: "tmacauleypo@nytimes.com",
    		city: "Daming",
    		street: "Sutteridge",
    		house_number: "84679",
    		telephone_number: "9085448531",
    		subscribed_to_newsletter: false,
    		_id: "27b62deaa-1842-57de-b967-567a496870b9",
    		id: 22,
    		type: "customer",
    		registration_date: 1560643200000,
    		renewed_on: 0,
    		postal_code: 65039,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614988800000,
    		highlight: ""
    	},
    	{
    		firstname: "Ronna",
    		lastname: "Jiggins",
    		email: "rjigginse3@ebay.com",
    		city: "Ancahuasi",
    		street: "Oak",
    		house_number: "2673",
    		telephone_number: "6963406050",
    		subscribed_to_newsletter: true,
    		_id: "270edf7ba-6009-56b3-916e-384ddb3fb780",
    		id: 23,
    		type: "customer",
    		registration_date: 1587168000000,
    		renewed_on: 0,
    		postal_code: 65445,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616025600000,
    		highlight: ""
    	},
    	{
    		firstname: "Adrianne",
    		lastname: "Thomkins",
    		email: "athomkins2x@smh.com.au",
    		city: "Havana",
    		street: "Farragut",
    		house_number: "5441",
    		telephone_number: "3683299884",
    		subscribed_to_newsletter: false,
    		_id: "2d1e8d177-95d1-5c86-8ebe-83866b17851f",
    		id: 24,
    		type: "customer",
    		registration_date: 1611532800000,
    		renewed_on: 0,
    		postal_code: 75196,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614729600000,
    		highlight: ""
    	},
    	{
    		firstname: "Alisa",
    		lastname: "Kindred",
    		email: "akindreddm@exblog.jp",
    		city: "Quellouno",
    		street: "Clemons",
    		house_number: "8",
    		telephone_number: "3967432551",
    		subscribed_to_newsletter: true,
    		_id: "2b6074fc2-095b-5ed3-9a94-9041215f48b1",
    		id: 25,
    		type: "customer",
    		registration_date: 1593561600000,
    		renewed_on: 0,
    		postal_code: 12656,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616112000000,
    		highlight: ""
    	},
    	{
    		firstname: "Piggy",
    		lastname: "Methringham",
    		email: "pmethringhamm5@buzzfeed.com",
    		city: "Malanville",
    		street: "Corry",
    		house_number: "6145",
    		telephone_number: "7739808177",
    		subscribed_to_newsletter: false,
    		_id: "2cd008802-80b5-5df5-a782-09c070f8d122",
    		id: 26,
    		type: "customer",
    		registration_date: 1598659200000,
    		renewed_on: 0,
    		postal_code: 84674,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615248000000,
    		highlight: ""
    	},
    	{
    		firstname: "Christiano",
    		lastname: "Jaqueme",
    		email: "cjaquemecy@netlog.com",
    		city: "Huangjindong",
    		street: "Bluestem",
    		house_number: "5",
    		telephone_number: "7972262708",
    		subscribed_to_newsletter: false,
    		_id: "2e2c9a563-5402-5794-8229-11297a8969cc",
    		id: 27,
    		type: "customer",
    		registration_date: 1599091200000,
    		renewed_on: 0,
    		postal_code: 79663,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615852800000,
    		highlight: ""
    	},
    	{
    		firstname: "Maryanna",
    		lastname: "Grahl",
    		email: "mgrahlq5@house.gov",
    		city: "Mariestad",
    		postal_code: 12423,
    		street: "Caliangt",
    		house_number: "07746",
    		telephone_number: "5865800348",
    		subscribed_to_newsletter: false,
    		_id: "2bd6ddebc-9f56-5977-8b2e-990fa3d5e23f",
    		id: 28,
    		type: "customer",
    		registration_date: 1598659200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: ""
    	},
    	{
    		firstname: "Ellis",
    		lastname: "Clapperton",
    		email: "eclapperton57@ox.ac.uk",
    		city: "Batouri",
    		street: "Rutledge",
    		house_number: "5370",
    		telephone_number: "3007668408",
    		remark: "rhoncus aliquam lacus morbi quis tortor id",
    		subscribed_to_newsletter: true,
    		_id: "2360ce38b-f9f1-5f0b-b3c8-ab7353023e7e",
    		id: 29,
    		type: "customer",
    		registration_date: 1556755200000,
    		renewed_on: 0,
    		postal_code: 75162,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615852800000,
    		highlight: ""
    	},
    	{
    		firstname: "Jacquie",
    		lastname: "Costanza",
    		email: "jcostanza6k@dyndns.org",
    		city: "Glasgow",
    		postal_code: 25284,
    		street: "Pleasure",
    		house_number: "1",
    		telephone_number: "5476825732",
    		subscribed_to_newsletter: false,
    		_id: "317d7be25-ef99-5486-82e8-bebf8c137394",
    		id: 30,
    		type: "customer",
    		registration_date: 1570665600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: ""
    	},
    	{
    		firstname: "Susann",
    		lastname: "Sunderland",
    		email: "ssunderlandlm@behance.net",
    		city: "Guarapari",
    		postal_code: 22229,
    		street: "Browning",
    		house_number: "4",
    		telephone_number: "1556410065",
    		subscribed_to_newsletter: false,
    		_id: "36e2b568a-60ab-5917-8e5a-79dc830bcf64",
    		id: 31,
    		type: "customer",
    		registration_date: 1608336000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614643200000,
    		highlight: ""
    	},
    	{
    		firstname: "Carly",
    		lastname: "Cornwell",
    		email: "ccornwell8e@ed.gov",
    		city: "Na'ale",
    		street: "Golf",
    		house_number: "9602",
    		telephone_number: "7371856075",
    		subscribed_to_newsletter: true,
    		_id: "3b0b3d95d-be1d-5642-ba97-e6997739fb05",
    		id: 32,
    		type: "customer",
    		registration_date: 1564444800000,
    		renewed_on: 0,
    		postal_code: 91998,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616889600000,
    		highlight: ""
    	},
    	{
    		firstname: "Ronica",
    		lastname: "Phifer",
    		email: "rphiferoz@usa.gov",
    		city: "Dengnan",
    		street: "Eggendart",
    		house_number: "9458",
    		telephone_number: "6305604608",
    		subscribed_to_newsletter: true,
    		_id: "358c7e58a-0d11-5626-a587-0e8a6727196c",
    		id: 33,
    		type: "customer",
    		registration_date: 1605830400000,
    		renewed_on: 0,
    		postal_code: 79854,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614556800000,
    		highlight: "rgb(131, 235, 52)"
    	},
    	{
    		firstname: "Rustie",
    		lastname: "Dalglish",
    		email: "rdalglishlk@canalblog.com",
    		city: "Nālūt",
    		street: "Little Fleur",
    		house_number: "6",
    		telephone_number: "6538308624",
    		subscribed_to_newsletter: false,
    		_id: "3392483b6-7974-53ae-b167-2cac31dfc69e",
    		id: 34,
    		type: "customer",
    		registration_date: 1588550400000,
    		renewed_on: 0,
    		postal_code: 96677,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: ""
    	},
    	{
    		firstname: "Latrena",
    		lastname: "Slym",
    		email: "lslymqr@studiopress.com",
    		city: "Zhengdun",
    		street: "Toban",
    		house_number: "918",
    		telephone_number: "6949167944",
    		subscribed_to_newsletter: true,
    		_id: "3fe83f0d0-6cc1-5ea0-9b5c-63b746180dbc",
    		id: 35,
    		type: "customer",
    		registration_date: 1608595200000,
    		renewed_on: 0,
    		postal_code: 58234,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615334400000,
    		highlight: ""
    	},
    	{
    		firstname: "Prisca",
    		lastname: "Mitchener",
    		email: "pmitchenerda@blogspot.com",
    		city: "Berëzovka",
    		postal_code: 98783,
    		street: "Elka",
    		house_number: "6384",
    		telephone_number: "8692116051",
    		subscribed_to_newsletter: true,
    		_id: "65e231748-02b7-5d02-bc8f-76e8b160fbb2",
    		id: 65,
    		type: "customer",
    		registration_date: 1587254400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616716800000,
    		highlight: "rgb(131, 235, 52)"
    	},
    	{
    		firstname: "Virginia",
    		lastname: "Rosbrough",
    		email: "vrosbroughe2@ucla.edu",
    		city: "Orkney",
    		postal_code: 21203,
    		street: "Heath",
    		house_number: "1",
    		telephone_number: "6105929660",
    		subscribed_to_newsletter: false,
    		_id: "3a6801d21-6a7a-56e0-80f9-0d84723e37ca",
    		id: 37,
    		type: "customer",
    		registration_date: 1604448000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614816000000,
    		highlight: ""
    	},
    	{
    		firstname: "Pat",
    		lastname: "Tofful",
    		email: "ptoffulf1@icio.us",
    		city: "Maogang",
    		street: "Tomscot",
    		house_number: "840",
    		telephone_number: "3408564528",
    		subscribed_to_newsletter: false,
    		_id: "350d67f2d-180b-590d-a100-bf75e26fef16",
    		id: 38,
    		type: "customer",
    		registration_date: 1592697600000,
    		renewed_on: 0,
    		postal_code: 28319,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615420800000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Rockey",
    		lastname: "Broadbent",
    		email: "rbroadbentey@geocities.com",
    		city: "Fuying",
    		street: "Kropf",
    		house_number: "45",
    		telephone_number: "8737230430",
    		remark: "bibendum felis sed",
    		subscribed_to_newsletter: false,
    		_id: "37996de63-001c-5733-bac0-b66ea6dc6e18",
    		id: 39,
    		type: "customer",
    		registration_date: 1562457600000,
    		renewed_on: 0,
    		postal_code: 95568,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615161600000,
    		highlight: ""
    	},
    	{
    		firstname: "Ravid",
    		lastname: "Barbrick",
    		email: "rbarbrick6m@flavors.me",
    		city: "Nice",
    		postal_code: 17385,
    		street: "Doe Crossing",
    		house_number: "682",
    		telephone_number: "2851403193",
    		subscribed_to_newsletter: true,
    		_id: "4a4ff5c0b-c1d7-50ef-bab3-c28c273eba9c",
    		id: 40,
    		type: "customer",
    		registration_date: 1614470400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: ""
    	},
    	{
    		firstname: "Dulcea",
    		lastname: "Fumagall",
    		email: "dfumagallf9@printfriendly.com",
    		city: "Kozel’shchyna",
    		street: "Weeping Birch",
    		house_number: "62",
    		telephone_number: "1451626543",
    		remark: "pede lobortis ligula sit amet eleifend pede",
    		subscribed_to_newsletter: false,
    		_id: "8779c3b3e-da0d-5ed1-a3e4-a69dc1201dd6",
    		id: 88,
    		type: "customer",
    		registration_date: 1571702400000,
    		renewed_on: 0,
    		postal_code: 85352,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Willette",
    		lastname: "Fieldgate",
    		email: "wfieldgateco@mysql.com",
    		city: "Hongcao",
    		street: "5th",
    		house_number: "5",
    		telephone_number: "3914167287",
    		subscribed_to_newsletter: false,
    		_id: "418fbf298-4f8e-529f-ace6-e26f2eab4352",
    		id: 42,
    		type: "customer",
    		registration_date: 1586822400000,
    		renewed_on: 0,
    		postal_code: 79551,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616284800000,
    		highlight: ""
    	},
    	{
    		firstname: "Ravid",
    		lastname: "Conre",
    		email: "rconremk@answers.com",
    		city: "Debar",
    		postal_code: 66591,
    		street: "Carey",
    		house_number: "4",
    		telephone_number: "3156842097",
    		subscribed_to_newsletter: true,
    		_id: "4e3d07aa8-da99-5b51-a625-478a9cdf9fb1",
    		id: 43,
    		type: "customer",
    		registration_date: 1595376000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Jacinthe",
    		lastname: "Glanester",
    		email: "jglanester1l@europa.eu",
    		city: "Sindong",
    		street: "Stuart",
    		house_number: "2",
    		telephone_number: "8585537584",
    		subscribed_to_newsletter: false,
    		_id: "421d9a06e-e26c-5df5-b025-c7b2be2d4092",
    		id: 44,
    		type: "customer",
    		registration_date: 1562112000000,
    		renewed_on: 0,
    		postal_code: 70790,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614729600000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Elisabetta",
    		lastname: "Dowdle",
    		email: "edowdlebu@businessinsider.com",
    		city: "Haiyu",
    		street: "Lerdahl",
    		house_number: "508",
    		telephone_number: "8747036789",
    		subscribed_to_newsletter: true,
    		_id: "4e31ec1fc-2dbf-5eee-8df5-fbbcc7fdeeb4",
    		id: 45,
    		type: "customer",
    		registration_date: 1590105600000,
    		renewed_on: 0,
    		postal_code: 56191,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615593600000,
    		highlight: ""
    	},
    	{
    		firstname: "Rori",
    		lastname: "Breslauer",
    		email: "rbreslauerr6@nasa.gov",
    		city: "Portel",
    		postal_code: 60146,
    		street: "Mitchell",
    		house_number: "99669",
    		telephone_number: "9203299507",
    		subscribed_to_newsletter: false,
    		_id: "49ece0cc1-8106-5009-baa1-51fdc9016dc0",
    		id: 46,
    		type: "customer",
    		registration_date: 1580601600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616889600000,
    		highlight: ""
    	},
    	{
    		firstname: "Fred",
    		lastname: "MacAndie",
    		email: "fmacandiep2@tinyurl.com",
    		city: "Puńsk",
    		postal_code: 51572,
    		street: "Steensland",
    		house_number: "63",
    		telephone_number: "1719526668",
    		subscribed_to_newsletter: true,
    		_id: "46380aea5-f1bb-58e5-b742-6e3decea18c7",
    		id: 47,
    		type: "customer",
    		registration_date: 1597017600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616025600000,
    		highlight: ""
    	},
    	{
    		firstname: "L;urette",
    		lastname: "Como",
    		email: "lcomoqu@independent.co.uk",
    		city: "Lahat",
    		street: "Delaware",
    		house_number: "333",
    		telephone_number: "2569559477",
    		subscribed_to_newsletter: true,
    		_id: "4d8abda05-819b-571c-bdcb-f199970bf39c",
    		id: 48,
    		type: "customer",
    		registration_date: 1605916800000,
    		renewed_on: 0,
    		postal_code: 44345,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614816000000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Pattie",
    		lastname: "Beddingham",
    		email: "pbeddinghamla@usatoday.com",
    		city: "Jambu",
    		street: "Northland",
    		house_number: "3",
    		telephone_number: "6151878923",
    		subscribed_to_newsletter: true,
    		_id: "476c45668-8a5c-5a76-a101-c8706edcdf3f",
    		id: 49,
    		type: "customer",
    		registration_date: 1584921600000,
    		renewed_on: 0,
    		postal_code: 89828,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615939200000,
    		highlight: ""
    	},
    	{
    		firstname: "Ham",
    		lastname: "Markussen",
    		email: "hmarkussen5i@fc2.com",
    		city: "Tamnag",
    		postal_code: 38234,
    		street: "Wayridge",
    		house_number: "80",
    		telephone_number: "4594890926",
    		remark: "luctus cum sociis",
    		subscribed_to_newsletter: false,
    		_id: "5a75f48cb-d8c6-5557-8872-978e11c7fc30",
    		id: 50,
    		type: "customer",
    		registration_date: 1584230400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: "rgb(131, 235, 52)"
    	},
    	{
    		firstname: "Missie",
    		lastname: "Crockett",
    		email: "mcrockettj5@networkadvertising.org",
    		city: "Vila Nova da Baronia",
    		postal_code: 91863,
    		street: "Browning",
    		house_number: "5197",
    		telephone_number: "5986241534",
    		subscribed_to_newsletter: true,
    		_id: "526c2d78b-10ca-58b3-a98b-ee8bdac23b08",
    		id: 51,
    		type: "customer",
    		registration_date: 1587945600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616284800000,
    		highlight: ""
    	},
    	{
    		firstname: "Philippa",
    		lastname: "Sames",
    		email: "psames3r@nifty.com",
    		city: "Chashnikovo",
    		postal_code: 14528,
    		street: "Independence",
    		house_number: "9",
    		telephone_number: "9231351931",
    		subscribed_to_newsletter: false,
    		_id: "58c964a9b-c00b-5b38-b219-375fa8d7514d",
    		id: 52,
    		type: "customer",
    		registration_date: 1616889600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616457600000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Prince",
    		lastname: "Ridding",
    		email: "pridding94@netlog.com",
    		city: "Stockholm",
    		postal_code: 60472,
    		street: "Monterey",
    		house_number: "7747",
    		telephone_number: "7256295226",
    		subscribed_to_newsletter: true,
    		_id: "5fa54cdb9-88a4-5bc0-824f-2ade87b8088e",
    		id: 53,
    		type: "customer",
    		registration_date: 1610928000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615248000000,
    		highlight: ""
    	},
    	{
    		firstname: "Trescha",
    		lastname: "Quesne",
    		email: "tquesne9g@csmonitor.com",
    		city: "Jablonec nad Nisou",
    		postal_code: 51056,
    		street: "Burning Wood",
    		house_number: "8645",
    		telephone_number: "8074604503",
    		subscribed_to_newsletter: false,
    		_id: "5237e5fa5-1eea-5c59-a703-7bf4aa9f2206",
    		id: 54,
    		type: "customer",
    		registration_date: 1568246400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615075200000,
    		highlight: ""
    	},
    	{
    		firstname: "Holli",
    		lastname: "Gabby",
    		email: "hgabbyhn@wordpress.com",
    		city: "Qianjia",
    		street: "American Ash",
    		house_number: "57",
    		telephone_number: "1745044269",
    		remark: "neque duis bibendum morbi non quam nec dui luctus rutrum",
    		subscribed_to_newsletter: true,
    		_id: "5b27745d3-f2b0-5d48-b118-b8e61d0b282d",
    		id: 55,
    		type: "customer",
    		registration_date: 1612051200000,
    		renewed_on: 0,
    		postal_code: 52697,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614902400000,
    		highlight: ""
    	},
    	{
    		firstname: "Jo",
    		lastname: "Face",
    		email: "jfacelv@multiply.com",
    		city: "Biskamzha",
    		postal_code: 80407,
    		street: "Schlimgen",
    		house_number: "60501",
    		telephone_number: "4855925050",
    		subscribed_to_newsletter: false,
    		_id: "5af90201b-657b-505e-a555-673914071375",
    		id: 56,
    		type: "customer",
    		registration_date: 1591574400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615420800000,
    		highlight: ""
    	},
    	{
    		firstname: "Clive",
    		lastname: "Edgley",
    		email: "cedgley1d@tuttocitta.it",
    		city: "Kurayoshi",
    		postal_code: 26815,
    		street: "Monument",
    		house_number: "88618",
    		telephone_number: "8624573518",
    		subscribed_to_newsletter: true,
    		_id: "50c0b6448-e1b5-5120-b951-fd2fea3010f2",
    		id: 57,
    		type: "customer",
    		registration_date: 1585785600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616630400000,
    		highlight: ""
    	},
    	{
    		firstname: "Federica",
    		lastname: "Langstone",
    		email: "flangstoneh2@imdb.com",
    		city: "Hongyan",
    		street: "Duke",
    		house_number: "3",
    		telephone_number: "5758393683",
    		subscribed_to_newsletter: true,
    		_id: "5cea3993b-e1d4-5bdf-b7e8-a2a10f58160b",
    		id: 58,
    		type: "customer",
    		registration_date: 1564531200000,
    		renewed_on: 0,
    		postal_code: 90660,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615593600000,
    		highlight: ""
    	},
    	{
    		firstname: "Cristina",
    		lastname: "Orrice",
    		email: "corricegu@angelfire.com",
    		city: "La Mohammedia",
    		street: "Northwestern",
    		house_number: "8",
    		telephone_number: "2399567455",
    		subscribed_to_newsletter: false,
    		_id: "507c066d5-2900-5336-8a25-94511feb0281",
    		id: 59,
    		type: "customer",
    		registration_date: 1612915200000,
    		renewed_on: 0,
    		postal_code: 89250,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615852800000,
    		highlight: ""
    	},
    	{
    		firstname: "Martguerita",
    		lastname: "Cruft",
    		email: "mcruftnm@devhub.com",
    		city: "Arroio Grande",
    		postal_code: 19960,
    		street: "Roxbury",
    		house_number: "957",
    		telephone_number: "5265199920",
    		subscribed_to_newsletter: false,
    		_id: "69b2db8f1-b060-565b-96d7-ed207775668f",
    		id: 60,
    		type: "customer",
    		registration_date: 1592611200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: ""
    	},
    	{
    		firstname: "Dall",
    		lastname: "Attyeo",
    		email: "dattyeoml@skype.com",
    		city: "Kabīrwāla",
    		postal_code: 49113,
    		street: "Kipling",
    		house_number: "4235",
    		telephone_number: "6476359443",
    		subscribed_to_newsletter: true,
    		_id: "69a58e7e8-a2af-5b9e-8eda-60465b07fc3f",
    		id: 61,
    		type: "customer",
    		registration_date: 1605139200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615161600000,
    		highlight: ""
    	},
    	{
    		firstname: "Helyn",
    		lastname: "Hurling",
    		email: "hhurlingej@storify.com",
    		city: "Baishuitan",
    		street: "Old Gate",
    		house_number: "33",
    		telephone_number: "9994070428",
    		subscribed_to_newsletter: true,
    		_id: "6cc6544b1-40ea-5275-95cb-4852593d9221",
    		id: 62,
    		type: "customer",
    		registration_date: 1610409600000,
    		renewed_on: 0,
    		postal_code: 55135,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614816000000,
    		highlight: ""
    	},
    	{
    		firstname: "Ephrem",
    		lastname: "Franz",
    		email: "efranz2z@guardian.co.uk",
    		city: "Quy Đạt",
    		street: "Comanche",
    		house_number: "92245",
    		telephone_number: "8057275524",
    		subscribed_to_newsletter: false,
    		_id: "6585b1715-b9d1-53de-8489-4aa2f63a44a3",
    		id: 63,
    		type: "customer",
    		registration_date: 1611446400000,
    		renewed_on: 0,
    		postal_code: 90416,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615939200000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Dunn",
    		lastname: "Smyth",
    		email: "dsmythq4@amazonaws.com",
    		city: "Rustam jo Goth",
    		postal_code: 34271,
    		street: "Calypso",
    		house_number: "1885",
    		telephone_number: "5344915612",
    		subscribed_to_newsletter: true,
    		_id: "6b17f9c8f-4732-5255-8d4e-d64b4f826b2a",
    		id: 64,
    		type: "customer",
    		registration_date: 1569196800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615420800000,
    		highlight: ""
    	},
    	{
    		firstname: "Prisca",
    		lastname: "Mitchener",
    		email: "pmitchenerda@blogspot.com",
    		city: "Berëzovka",
    		postal_code: 98783,
    		street: "Elka",
    		house_number: "6384",
    		telephone_number: "8692116051",
    		subscribed_to_newsletter: true,
    		_id: "63c24db51-8f97-5eea-bf01-5657596a3d97",
    		id: 65,
    		type: "customer",
    		registration_date: 1587254400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616716800000,
    		highlight: "rgb(131, 235, 52)"
    	},
    	{
    		firstname: "Hendrik",
    		lastname: "Clunan",
    		email: "hclunanhp@hc360.com",
    		city: "Darkton",
    		street: "Anthes",
    		house_number: "21",
    		telephone_number: "4554178902",
    		subscribed_to_newsletter: false,
    		_id: "601b8cd54-0693-557b-8492-e222af6c2c04",
    		id: 66,
    		type: "customer",
    		registration_date: 1581292800000,
    		renewed_on: 0,
    		postal_code: 29588,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616025600000,
    		highlight: ""
    	},
    	{
    		firstname: "Winni",
    		lastname: "Windridge",
    		email: "wwindridgepk@huffingtonpost.com",
    		city: "Nebug",
    		postal_code: 66788,
    		street: "Dwight",
    		house_number: "976",
    		telephone_number: "6814491994",
    		remark: "nam nulla integer pede",
    		subscribed_to_newsletter: false,
    		_id: "6d81d2f51-563c-586a-92fc-de607891653c",
    		id: 67,
    		type: "customer",
    		registration_date: 1589068800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614556800000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Charlotte",
    		lastname: "Bourges",
    		email: "cbourgesfi@amazonaws.com",
    		city: "Carson City",
    		postal_code: 27488,
    		street: "Thackeray",
    		house_number: "2984",
    		telephone_number: "7751917136",
    		subscribed_to_newsletter: true,
    		_id: "694049be4-7469-5288-a47d-a9871173a4ce",
    		id: 68,
    		type: "customer",
    		registration_date: 1560988800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615248000000,
    		highlight: ""
    	},
    	{
    		firstname: "Vergil",
    		lastname: "Chadwell",
    		email: "vchadwellmr@stumbleupon.com",
    		city: "Tabunok",
    		postal_code: 32922,
    		street: "Mallard",
    		house_number: "464",
    		telephone_number: "5293198615",
    		subscribed_to_newsletter: true,
    		_id: "65b2824d8-49b4-5e2c-bc76-34b80280d762",
    		id: 69,
    		type: "customer",
    		registration_date: 1571184000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: ""
    	},
    	{
    		firstname: "Roddy",
    		lastname: "Maltby",
    		email: "rmaltby75@blogspot.com",
    		city: "Igreja",
    		postal_code: 67938,
    		street: "Mayer",
    		house_number: "16316",
    		telephone_number: "5164800572",
    		subscribed_to_newsletter: false,
    		_id: "712804277-7be9-5ab8-a043-41d548e308d2",
    		id: 70,
    		type: "customer",
    		registration_date: 1569369600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616457600000,
    		highlight: ""
    	},
    	{
    		firstname: "Sena",
    		lastname: "Kendle",
    		email: "skendle2@sourceforge.net",
    		city: "Kolbuszowa",
    		postal_code: 24547,
    		street: "Sheridan",
    		house_number: "63",
    		telephone_number: "5258167037",
    		subscribed_to_newsletter: true,
    		_id: "7d3263fd7-ac16-52e8-95e1-813477d60987",
    		id: 71,
    		type: "customer",
    		registration_date: 1579910400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615075200000,
    		highlight: ""
    	},
    	{
    		firstname: "Ker",
    		lastname: "Waything",
    		email: "kwaything2o@prweb.com",
    		city: "El Espino",
    		street: "Mccormick",
    		house_number: "7731",
    		telephone_number: "6742829100",
    		subscribed_to_newsletter: false,
    		_id: "72060c4ea-5888-538a-9c38-1b25e76d43c5",
    		id: 72,
    		type: "customer",
    		registration_date: 1597708800000,
    		renewed_on: 0,
    		postal_code: 86437,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614643200000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Janey",
    		lastname: "Kaley",
    		email: "jkaleyfk@biglobe.ne.jp",
    		city: "Wangren",
    		street: "Coleman",
    		house_number: "5346",
    		telephone_number: "3051525272",
    		subscribed_to_newsletter: true,
    		_id: "702ca9477-c3fc-5352-be5a-af05c860a6ae",
    		id: 73,
    		type: "customer",
    		registration_date: 1565222400000,
    		renewed_on: 0,
    		postal_code: 33282,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615420800000,
    		highlight: ""
    	},
    	{
    		firstname: "Phyllys",
    		lastname: "Blenkiron",
    		email: "pblenkironal@cdbaby.com",
    		city: "Gaya",
    		street: "Cody",
    		house_number: "83",
    		telephone_number: "6805267107",
    		subscribed_to_newsletter: true,
    		_id: "731e0c3ed-15ad-5222-838c-b358c78cd07c",
    		id: 74,
    		type: "customer",
    		registration_date: 1608163200000,
    		renewed_on: 0,
    		postal_code: 69042,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615507200000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Magdaia",
    		lastname: "Curlis",
    		email: "mcurlisq0@nih.gov",
    		city: "Pagangan",
    		postal_code: 42003,
    		street: "Dennis",
    		house_number: "20255",
    		telephone_number: "5885921531",
    		subscribed_to_newsletter: true,
    		_id: "7ed250c4d-a054-5abe-ade7-5fd5b8a8ddd2",
    		id: 75,
    		type: "customer",
    		registration_date: 1611532800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616716800000,
    		highlight: ""
    	},
    	{
    		firstname: "Wolfgang",
    		lastname: "Seville",
    		email: "wsevillejf@dmoz.org",
    		city: "Hitachi-Naka",
    		postal_code: 87115,
    		street: "Orin",
    		house_number: "2777",
    		telephone_number: "1277353453",
    		subscribed_to_newsletter: true,
    		_id: "75a2121e2-ef62-5445-9d33-71413c968326",
    		id: 76,
    		type: "customer",
    		registration_date: 1610150400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615852800000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Tim",
    		lastname: "Spare",
    		email: "tsparep0@amazon.co.jp",
    		city: "Huagai",
    		street: "Blue Bill Park",
    		house_number: "007",
    		telephone_number: "9195402483",
    		subscribed_to_newsletter: false,
    		_id: "7f023d256-05c9-5d4b-8035-cef3f88d442c",
    		id: 77,
    		type: "customer",
    		registration_date: 1592092800000,
    		renewed_on: 0,
    		postal_code: 10500,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616544000000,
    		highlight: "rgb(131, 235, 52)"
    	},
    	{
    		firstname: "Eddie",
    		lastname: "Camillo",
    		email: "ecamillol5@hexun.com",
    		city: "Yancheng",
    		street: "Artisan",
    		house_number: "881",
    		telephone_number: "4335114644",
    		subscribed_to_newsletter: false,
    		_id: "7f4d7c17d-91ff-5a44-afd9-d75345dff29f",
    		id: 78,
    		type: "customer",
    		registration_date: 1574899200000,
    		renewed_on: 0,
    		postal_code: 74393,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615939200000,
    		highlight: ""
    	},
    	{
    		firstname: "Napoleon",
    		lastname: "Strangeways",
    		email: "nstrangeways7@imageshack.us",
    		city: "Halayhay",
    		postal_code: 53007,
    		street: "Fieldstone",
    		house_number: "40",
    		telephone_number: "2156728800",
    		subscribed_to_newsletter: false,
    		_id: "78905d2d2-c782-58b0-a92a-444f7158c87b",
    		id: 79,
    		type: "customer",
    		registration_date: 1597363200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614729600000,
    		highlight: ""
    	},
    	{
    		firstname: "Rona",
    		lastname: "Solman",
    		email: "rsolman73@un.org",
    		city: "Pindobaçu",
    		postal_code: 34416,
    		street: "Tony",
    		house_number: "7",
    		telephone_number: "2913635920",
    		remark: "quisque id",
    		subscribed_to_newsletter: false,
    		_id: "8be562498-5da4-5d2d-94bf-f94f6fb97d64",
    		id: 80,
    		type: "customer",
    		registration_date: 1589673600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616889600000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Diann",
    		lastname: "Feeham",
    		email: "dfeeham9r@wired.com",
    		city: "Yashalta",
    		postal_code: 10851,
    		street: "Lunder",
    		house_number: "91",
    		telephone_number: "7166131057",
    		subscribed_to_newsletter: false,
    		_id: "8dfc7974f-508f-5c66-953a-cb9a12667dd6",
    		id: 81,
    		type: "customer",
    		registration_date: 1595030400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614643200000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Elisha",
    		lastname: "Aliman",
    		email: "ealimanom@gov.uk",
    		city: "Rogów",
    		postal_code: 27706,
    		street: "Ronald Regan",
    		house_number: "3691",
    		telephone_number: "7124227658",
    		subscribed_to_newsletter: true,
    		_id: "8629a3e3d-5133-5a21-834a-c967e15c5c76",
    		id: 82,
    		type: "customer",
    		registration_date: 1553904000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616112000000,
    		highlight: ""
    	},
    	{
    		firstname: "Stevy",
    		lastname: "Bendare",
    		email: "sbendare26@buzzfeed.com",
    		city: "Katrineholm",
    		postal_code: 15840,
    		street: "Kedzie",
    		house_number: "4",
    		telephone_number: "7578766693",
    		subscribed_to_newsletter: true,
    		_id: "8f29ac391-8f43-547c-be9e-aff582945b52",
    		id: 83,
    		type: "customer",
    		registration_date: 1613692800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616371200000,
    		highlight: "rgb(45, 144, 224)"
    	},
    	{
    		firstname: "Alwyn",
    		lastname: "Taunton.",
    		email: "atauntonkt@economist.com",
    		city: "Marugame",
    		postal_code: 52594,
    		street: "Bunting",
    		house_number: "865",
    		telephone_number: "2191189434",
    		subscribed_to_newsletter: true,
    		_id: "894a9d571-4214-5955-995e-0ebd8f540dab",
    		id: 84,
    		type: "customer",
    		registration_date: 1579996800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616284800000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Shannen",
    		lastname: "McCoish",
    		email: "smccoishn2@mlb.com",
    		city: "Versailles",
    		postal_code: 95450,
    		street: "Spohn",
    		house_number: "76",
    		telephone_number: "6853941937",
    		remark: "mauris lacinia sapien quis",
    		subscribed_to_newsletter: false,
    		_id: "8e5e11c11-ad58-5892-be84-d83df5283cdd",
    		id: 85,
    		type: "customer",
    		registration_date: 1616544000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614902400000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Noami",
    		lastname: "McAnalley",
    		email: "nmcanalleyik@huffingtonpost.com",
    		city: "Kiyevskoye",
    		postal_code: 43431,
    		street: "Shopko",
    		house_number: "9",
    		telephone_number: "4039778719",
    		subscribed_to_newsletter: false,
    		_id: "8e6824cb1-023b-5e73-aab3-05325a4de316",
    		id: 86,
    		type: "customer",
    		registration_date: 1560902400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614643200000,
    		highlight: ""
    	},
    	{
    		firstname: "Leonore",
    		lastname: "MacDermid",
    		email: "lmacdermid8w@usa.gov",
    		city: "Ajuy",
    		postal_code: 88597,
    		street: "Erie",
    		house_number: "668",
    		telephone_number: "8972565645",
    		subscribed_to_newsletter: false,
    		_id: "84040f073-ffed-5d16-a66b-79e12ee3ae57",
    		id: 87,
    		type: "customer",
    		registration_date: 1571270400000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616112000000,
    		highlight: ""
    	},
    	{
    		firstname: "Dulcea",
    		lastname: "Fumagall",
    		email: "dfumagallf9@printfriendly.com",
    		city: "Kozel’shchyna",
    		street: "Weeping Birch",
    		house_number: "62",
    		telephone_number: "1451626543",
    		remark: "pede lobortis ligula sit amet eleifend pede",
    		subscribed_to_newsletter: false,
    		_id: "8e76314e7-0d46-5766-a04c-bd295c3bc2dc",
    		id: 88,
    		type: "customer",
    		registration_date: 1571702400000,
    		renewed_on: 0,
    		postal_code: 85352,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: "rgb(250, 45, 30)"
    	},
    	{
    		firstname: "Issy",
    		lastname: "Stone Fewings",
    		email: "istonefewingso0@vkontakte.ru",
    		city: "Šavnik",
    		street: "Lukken",
    		house_number: "1",
    		telephone_number: "5651151894",
    		subscribed_to_newsletter: false,
    		_id: "86990fd92-49a7-59fb-a216-3935b8013850",
    		id: 89,
    		type: "customer",
    		registration_date: 1585267200000,
    		renewed_on: 0,
    		postal_code: 53533,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616284800000,
    		highlight: ""
    	},
    	{
    		firstname: "Carny",
    		lastname: "Frantsev",
    		email: "cfrantsevd4@symantec.com",
    		city: "Zhushan Chengguanzhen",
    		street: "Texas",
    		house_number: "91",
    		telephone_number: "9842799404",
    		subscribed_to_newsletter: true,
    		_id: "98743b6ab-0efb-5a35-b24c-e290b4528f62",
    		id: 90,
    		type: "customer",
    		registration_date: 1602115200000,
    		renewed_on: 0,
    		postal_code: 83402,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616630400000,
    		highlight: ""
    	},
    	{
    		firstname: "Brandie",
    		lastname: "Lonsdale",
    		email: "blonsdaleow@tiny.cc",
    		city: "Paris La Défense",
    		postal_code: 88044,
    		street: "Grasskamp",
    		house_number: "29",
    		telephone_number: "6871364109",
    		subscribed_to_newsletter: true,
    		_id: "991edb0d6-a7a2-5675-a094-5de45b80cdcf",
    		id: 91,
    		type: "customer",
    		registration_date: 1600992000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616112000000,
    		highlight: ""
    	},
    	{
    		firstname: "Obadiah",
    		lastname: "Dumphries",
    		email: "odumphries2s@odnoklassniki.ru",
    		city: "Inda Silasē",
    		street: "Valley Edge",
    		house_number: "647",
    		telephone_number: "5913774046",
    		subscribed_to_newsletter: true,
    		_id: "9e234f31c-839e-548a-9cb1-c9d8f05a3b56",
    		id: 92,
    		type: "customer",
    		registration_date: 1591660800000,
    		renewed_on: 0,
    		postal_code: 38426,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614988800000,
    		highlight: ""
    	},
    	{
    		firstname: "Juditha",
    		lastname: "Grise",
    		email: "jgrisem0@miibeian.gov.cn",
    		city: "Neftobod",
    		street: "Sherman",
    		house_number: "84",
    		telephone_number: "7798210578",
    		subscribed_to_newsletter: false,
    		_id: "92a55f9c6-a552-5b30-a361-0997d51f75b1",
    		id: 93,
    		type: "customer",
    		registration_date: 1569801600000,
    		renewed_on: 0,
    		postal_code: 48155,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614556800000,
    		highlight: ""
    	},
    	{
    		firstname: "Myrvyn",
    		lastname: "Fittes",
    		email: "mfittesfn@surveymonkey.com",
    		city: "Ninomiya",
    		postal_code: 86398,
    		street: "Kinsman",
    		house_number: "497",
    		telephone_number: "9691603411",
    		subscribed_to_newsletter: false,
    		_id: "9c31760df-76f1-538d-b5a3-347f435561bc",
    		id: 94,
    		type: "customer",
    		registration_date: 1596153600000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615939200000,
    		highlight: ""
    	},
    	{
    		firstname: "Albie",
    		lastname: "Govan",
    		email: "agovandf@guardian.co.uk",
    		city: "Tambo",
    		postal_code: 82128,
    		street: "Carioca",
    		house_number: "931",
    		telephone_number: "4105513709",
    		subscribed_to_newsletter: false,
    		_id: "9ee19c652-7497-53e4-b608-371f85e04f7d",
    		id: 95,
    		type: "customer",
    		registration_date: 1576195200000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615420800000,
    		highlight: ""
    	},
    	{
    		firstname: "Aleta",
    		lastname: "Tilston",
    		email: "atilston9i@barnesandnoble.com",
    		city: "Miasteczko Śląskie",
    		postal_code: 99381,
    		street: "Mayfield",
    		house_number: "3",
    		telephone_number: "9081719310",
    		subscribed_to_newsletter: false,
    		_id: "9e3dee01e-100a-51b3-bcbb-ed26ed20aca0",
    		id: 96,
    		type: "customer",
    		registration_date: 1574640000000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614729600000,
    		highlight: "rgb(247, 239, 10)"
    	},
    	{
    		firstname: "Jdavie",
    		lastname: "Beddin",
    		email: "jbeddinly@webeden.co.uk",
    		city: "Madan",
    		street: "Westport",
    		house_number: "64633",
    		telephone_number: "2325769196",
    		subscribed_to_newsletter: false,
    		_id: "99ced28a6-f9c8-5f01-8ebd-ac00af1ea99b",
    		id: 97,
    		type: "customer",
    		registration_date: 1554595200000,
    		renewed_on: 0,
    		postal_code: 68262,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615766400000,
    		highlight: ""
    	},
    	{
    		firstname: "Tallulah",
    		lastname: "Costen",
    		email: "tcostenqx@nydailynews.com",
    		city: "Nglengkong",
    		street: "Jenna",
    		house_number: "57",
    		telephone_number: "3535905033",
    		subscribed_to_newsletter: true,
    		_id: "9ba7b5d1e-fb88-56c8-80ca-8a4a5074a022",
    		id: 98,
    		type: "customer",
    		registration_date: 1615766400000,
    		renewed_on: 0,
    		postal_code: 54790,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1616630400000,
    		highlight: ""
    	},
    	{
    		firstname: "Elliot",
    		lastname: "Fallis",
    		email: "efalliseu@cmu.edu",
    		city: "Rixinhe",
    		street: "Granby",
    		house_number: "583",
    		telephone_number: "4534871698",
    		subscribed_to_newsletter: true,
    		_id: "9ffe1084e-7066-5c8f-8035-4f9d0b321f87",
    		id: 99,
    		type: "customer",
    		registration_date: 1564185600000,
    		renewed_on: 0,
    		postal_code: 63503,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1614816000000,
    		highlight: "rgb(131, 235, 52)"
    	},
    	{
    		firstname: "Laurette",
    		lastname: "Palluschek",
    		email: "lpalluschek2l@rambler.ru",
    		city: "Cereté",
    		postal_code: 49591,
    		street: "Bultman",
    		house_number: "58840",
    		telephone_number: "2535673244",
    		subscribed_to_newsletter: false,
    		_id: "10c947e90e-2466-5144-a701-acecb041fcdc",
    		id: 100,
    		type: "customer",
    		registration_date: 1605916800000,
    		renewed_on: 0,
    		heard: "gesehen, vorbeigelaufen",
    		last_update: 1615075200000,
    		highlight: ""
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d6a829e098949-0dab-5dbc-9ac6-310ad9c31f7e",
    		id: 5025,
    		name: "Campingsessel",
    		brand: "-",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1551052800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/campingsessel/",
    		wc_id: "2276",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5025.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "rund, klappbar",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615248000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8ccc2383882132-8c5f-5fcd-964b-e604e6f60860",
    		id: 1747,
    		name: "Tennisschläger",
    		brand: "Völkl",
    		itype: "syndro soft",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "mit Schutzhülle",
    		added: 1587686400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/tennisschlaeger-3/",
    		wc_id: "3649",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6109.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615248000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8bf6600b7eb659-c365-5ef6-a46b-76246ead86e8",
    		id: 205,
    		name: "Elektro-Öl-Radiator",
    		brand: "DeLonghi",
    		itype: "Venturi",
    		category: "Haushalt",
    		deposit: 35,
    		parts: "1",
    		manual: "",
    		"package": "Originalkarton",
    		added: 1536624000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/haushalt/elektro-oel-radiator/",
    		wc_id: "1967",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/205.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616112000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d8123796d2bd0-dd52-57a6-814e-62f23f8a50e3",
    		id: 6101,
    		name: "Faszienrolle",
    		brand: "Blackroll MED",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 5,
    		parts: "1",
    		manual: "Beschreibung auf Karton",
    		"package": "originalKarton",
    		added: 1582761600000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "rgb(247, 239, 10)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615334400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d33ab0f7c1979-16f7-5602-b4bd-3328334ab1d2",
    		id: 2915,
    		name: "Akkuschrauber",
    		brand: "Bosch",
    		itype: "Ixo full set",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "4",
    		manual: "in Schriftform vorhanden",
    		"package": "originalKarton",
    		added: 1578873600000,
    		status: "onbackorder",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/akkuschrauber-5/",
    		wc_id: "3263",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/2915.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Bedienungsanleitung in Schriftform vorhanden,\nmit Exzenter und Winkelaufsatz",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615161600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d1f0a11714b15-e081-5f84-bf0e-393635982532",
    		id: 2801,
    		name: "Busvorzelt",
    		brand: "Carryox",
    		itype: "10T",
    		category: "Freizeit",
    		deposit: 25,
    		parts: "2",
    		manual: "",
    		"package": "Originalverpackung",
    		added: 1558915200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/vorzelt/",
    		wc_id: "2376",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/06/2801.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "für Busse und Campingvans, 280×300 cm breit, 210 cm hoch, Packmaß 24×74 cm",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616284800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c7efab6adde11-c74b-59d6-81b2-4ff3ef9f0b1d",
    		id: 1243,
    		name: "Handmixer",
    		brand: "KRUPS 3 MIX 3000",
    		itype: "",
    		category: "Küche",
    		deposit: "15",
    		parts: "5",
    		manual: "",
    		"package": "",
    		added: 1611014400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/handmixer-3/",
    		wc_id: "4632",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2021/01/1243_1.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c18bf25d8396e-b315-5ce4-8e5c-94ed120e5b2e",
    		id: 504,
    		name: "Hörnchen-Automat",
    		brand: "Komet",
    		itype: "7117 BE",
    		category: "Küche",
    		deposit: 15,
    		parts: "2",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1536105600000,
    		status: "onbackorder",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/hoernchen-automat/",
    		wc_id: "237",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/504.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615680000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d17c6abab5e69-9cc5-5b34-91e5-2afe3b882850",
    		id: 2708,
    		name: "2708 geändert in 1900 nicht neu besetzen",
    		brand: "",
    		itype: "",
    		category: "",
    		deposit: 0,
    		parts: "",
    		manual: "",
    		"package": "",
    		added: 0,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615766400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d0c6341db9d9b-9081-51be-b989-a8554631778f",
    		id: 2607,
    		name: "Lötpistole",
    		brand: "Parkside",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "6",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "OriginalKarton",
    		added: 1555113600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/loetpistole/",
    		wc_id: "2993",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/2607.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "180W",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614902400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c9b7d28f14478-7e78-5004-ba6b-5107c6e5b2f1",
    		id: 1506,
    		name: "el. Kettensäge",
    		brand: "Dolmar",
    		itype: "-",
    		category: "Garten",
    		deposit: 25,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539561600000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/garten/el-kettensaege/",
    		wc_id: "436",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1506.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Sägeblatt stumpf, muss erneuert werden.\nZum ausleihen muss der Nutzer/ die Nutzerin schriftlich bestätigen, dass er/ sie mit einer Kettensäge umgehen kann und diese nicht im Wald, sondern nur auf dem eigenen Grundstück einsetzt.\nInkl. Verlängerungskabel",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615852800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d62ecbb94f369-49f5-5224-97ec-ff4a0eecfa55",
    		id: 5010,
    		name: "Hydraulik-Holzspalter",
    		brand: "Scheppach",
    		itype: "HL 650",
    		category: "Heimwerker",
    		deposit: 100,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/5010.pdf",
    		"package": "-",
    		added: 1542844800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/1548/",
    		wc_id: "1548",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5010.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "3 PS, Spaltkraft: 6,5 t, Max. Spaltgutlänge: 52 cm, 2.200 W, ca. 50kg",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c63e48371c3f0-f79e-5e41-92d0-04b31f8e3c8b",
    		id: 1116,
    		name: "Sandwichmaker",
    		brand: "Hit",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1543536000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/sandwichmaker/",
    		wc_id: "2862",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1116.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616284800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d26c578b801f0-5f67-5ce8-8625-c56f742e8084",
    		id: 2816,
    		name: "Glätteisen",
    		brand: "Philips",
    		itype: "-",
    		category: "Haushalt",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1564704000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/haushalt/glaetteisen/",
    		wc_id: "3014",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/08/2816.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "mit Braun-Tasche",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614902400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c45cd850b8655-d92c-5f71-a92c-7dd6c51ccd22",
    		id: 830,
    		name: "Silikonspritze",
    		brand: "",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1588550400000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/silikonspritze-2/",
    		wc_id: "3727",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "auch: Profi – Kartuschen-Spritze",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615161600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d0b42b86997cc-a708-5433-a8d4-aeb1d6621644",
    		id: 2605,
    		name: "Wärmeplatte",
    		brand: "Salton",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1554940800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/waermeplatte/",
    		wc_id: "2256",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/2605.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d30889a653910-b212-5c14-9873-a7a0913e94f6",
    		id: 2909,
    		name: "Multi-Scanner",
    		brand: "Tevion",
    		itype: "SPENDENVerKAUF",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "8",
    		manual: "",
    		"package": "",
    		added: 1568160000000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616371200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d78e144e4e1ab-8d02-57af-96db-c91e536ac2af",
    		id: 5055,
    		name: "Feine-Metall-Feilen",
    		brand: "-",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 5,
    		parts: "-",
    		manual: "",
    		"package": "",
    		added: 1602460800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/feine-metall-feilen/",
    		wc_id: "4155",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/10/5055.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "verschiedene Größen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614902400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cf3ff9afba6bb-3c58-5358-9e71-e496e608a440",
    		id: 2402,
    		name: "Babywippe",
    		brand: "chicco",
    		itype: "SPENDENVERKAUF",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1551398400000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616198400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c5d17ca9c1356-f796-56fe-af66-f5a3b3ae981a",
    		id: 1101,
    		name: "Joghurt-Box",
    		brand: "A.Vogel",
    		itype: "SPENDENVERKAUF",
    		category: "Küche",
    		deposit: 5,
    		parts: "5",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1536278400000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614643200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c45cd6de2ea5b-991e-5cc0-abac-e47bf0d0a253",
    		id: 830,
    		name: "Silikonspritze",
    		brand: "",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1588550400000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/silikonspritze-2/",
    		wc_id: "3727",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "auch: Profi – Kartuschen-Spritze",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8be200d800b5d8-69ee-5c89-a2ea-dd4dde204546",
    		id: 15,
    		name: "Stichsäge",
    		brand: "TOP Craft",
    		itype: "TPS 550E",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "2",
    		manual: "",
    		"package": "",
    		added: 1581292800000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/stichsaege-6/",
    		wc_id: "3423",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		highlight: "",
    		synonyms: "Laubsäge, Laubsägemaschine, Wippsäge",
    		description: "mit Auffangbeutel von Bosch",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616889600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c402f6c3b8f99-a612-5b33-9a71-0fd240b04b9a",
    		id: 820,
    		name: "Rollkoffer",
    		brand: "eaglecreek",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539561600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/rollkoffer/",
    		wc_id: "303",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/820.jpg",
    		highlight: "",
    		synonyms: "Trolley",
    		description: "mit Tragegestell",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615593600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c78e3703a7591-a9c6-5e4f-ba10-30d391ca37b6",
    		id: 1231,
    		name: "Wok",
    		brand: "Bodum",
    		itype: "Chambord",
    		category: "Küche",
    		deposit: 15,
    		parts: "4",
    		manual: "",
    		"package": "Originalkarton",
    		added: 1543622400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/wok-2/",
    		wc_id: "2876",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1231.jpg",
    		highlight: "",
    		synonyms: "Wokpfanne",
    		description: "Emaille-beschichtet, für alle Herdarten geeignet (incl. Induktion)\n,gusseisern,370 mm",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615593600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c00c8e7fe29e9-c0ee-5398-a2ab-ebe04774ae2d",
    		id: 308,
    		name: "Römertopf",
    		brand: "-",
    		itype: "-",
    		category: "Küche",
    		deposit: 5,
    		parts: "2",
    		manual: "",
    		"package": "-",
    		added: 1536019200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/roemertopf/",
    		wc_id: "2797",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/308.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615334400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c2e8ca61bec00-41ee-5ce4-8999-89871b229f32",
    		id: 626,
    		name: "Autokindersitz",
    		brand: "Maxi Cosi",
    		itype: "-",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1544659200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/autokindersitz/",
    		wc_id: "172",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/108.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Gr. 9-18 kg",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614902400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d5abd2cb265c9-3c73-5315-ad1b-127a41ff652d",
    		id: 4001,
    		name: "Geschirr",
    		brand: "-",
    		itype: "-",
    		category: "Küche",
    		deposit: 5,
    		parts: "-",
    		manual: "",
    		"package": "-",
    		added: 1541376000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/geschirr/",
    		wc_id: "541",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/4001.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "ca. 30 Teller, Untertassen, Tassen verschiedener Art",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615507200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c8be28c3b8eca-e7f5-52e0-abda-0d237f393294",
    		id: 1328,
    		name: "Kleistermaschine",
    		brand: "Träkle",
    		itype: "CUTTERKANT",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "",
    		manual: "",
    		"package": "OriginalKarton",
    		added: 1597017600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/kleistermaschine-3/",
    		wc_id: "4001",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/08/1328.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615075200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cf3ff4b484f9f-b5f9-50ad-8f98-fb29900238b3",
    		id: 2402,
    		name: "Babywippe",
    		brand: "chicco",
    		itype: "SPENDENVERKAUF",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1551398400000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615593600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c25b4425d4cc2-66f6-52e3-af66-0a611f5d0931",
    		id: 606,
    		name: "Elektr. Gemüseschneider",
    		brand: "Moulinex",
    		itype: "Charlotte HV3",
    		category: "Küche",
    		deposit: 15,
    		parts: "22",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1536105600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/kuechenmaschine-2/",
    		wc_id: "256",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/606.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615248000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d84b47c2e63c2-0a92-5be2-b035-be53c320d82d",
    		id: 6106,
    		name: "nicht neu besetzen jetzt 1430",
    		brand: "",
    		itype: "",
    		category: "",
    		deposit: 0,
    		parts: "",
    		manual: "",
    		"package": "",
    		added: 0,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615766400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8ce87b9c207d9f-ddbd-54df-ab07-c01d821d509f",
    		id: 2208,
    		name: "Bohrmaschine",
    		brand: "AEG",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1549065600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/bohrmaschine-3/",
    		wc_id: "931",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/2208.jpg",
    		highlight: "",
    		synonyms: "Bohrer, Bohrgerät",
    		description: "750 Watt",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615766400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d1014f240f38a-7de3-541c-a62a-a42b99736968",
    		id: 2616,
    		name: "Fahrrad-Kindersitz",
    		brand: "-",
    		itype: "-",
    		category: "Kinder",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "",
    		added: 1557964800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/fahrrad-kindersitz-3/",
    		wc_id: "2995",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/05/2616.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615161600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c6aa0b1582914-57b3-508b-914b-d2287c298708",
    		id: 1207,
    		name: "Stabmixer",
    		brand: "Braun",
    		itype: "SPENDENVERKAUF",
    		category: "Küche",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1536278400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/stabmixer-2/",
    		wc_id: "361",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1207.jpg",
    		highlight: "",
    		synonyms: "Mixstab, Pürierstab, Zauberstab",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615593600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cc929e65a68cc-f386-5eb6-a56e-8aac08860dad",
    		id: 1742,
    		name: "Fugenkratzer",
    		brand: "-",
    		itype: "-",
    		category: "Garten",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1551657600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/garten/fugenkratzer/",
    		wc_id: "2931",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1742-1.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d825a6a782c18-b231-5ed7-b302-70949fd57714",
    		id: 6103,
    		name: "Strommessgerät",
    		brand: "ENBW",
    		itype: "",
    		category: "Haushalt",
    		deposit: 5,
    		parts: "1",
    		manual: "in Schriftform vorhanden",
    		"package": "originalKarton",
    		added: 1582761600000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615161600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d57900089e65a-f3e6-58e9-87d3-cee86d1f040c",
    		id: 3317,
    		name: "Strandliegen",
    		brand: "",
    		itype: "",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "4",
    		manual: "",
    		"package": "",
    		added: 1596153600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/strandliegen/",
    		wc_id: "3940",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/08/3317.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "1 Paar, zerlegbar",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c4bf301b1e8b5-bef7-5701-b817-ffd948c2c3c1",
    		id: 912,
    		name: "Elektrohobel",
    		brand: "KingCraft",
    		itype: "WK 900 EH",
    		category: "Heimwerker",
    		deposit: 45,
    		parts: "5",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1539561600000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614556800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c0a15a0caec43-e9a4-524a-9838-515cfa16eea3",
    		id: 403,
    		name: "Ski/Snowboardhelm versch. Größen",
    		brand: "TCM",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1536019200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/ski-snowboardhelm/",
    		wc_id: "2802",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/403.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "XS/S 50-53cm, 5 versch. Modelle",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616371200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d7ad91456f759-55f0-5e9b-8a46-dba146d6d323",
    		id: 5059,
    		name: "Kabeltrommel",
    		brand: "-",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "1",
    		manual: "-",
    		"package": "-",
    		added: 1605744000000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/kabeltrommel/",
    		wc_id: "4307",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "50m",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615766400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d493871c60c1b-8391-517c-94eb-bdd211665a56",
    		id: 3212,
    		name: "Multifunktionsmixer",
    		brand: "Bullet Express",
    		itype: "KASCHKA",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "",
    		manual: "",
    		"package": "",
    		added: 1567728000000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "rgb(45, 144, 224)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615075200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d2fc66da4e40f-d044-5384-8eb3-dd880557e359",
    		id: 2906,
    		name: "Bohrmaschine",
    		brand: "Bosch",
    		itype: "PBH 16 RE",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "4",
    		manual: "",
    		"package": "",
    		added: 1572220800000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/bohrmaschine-5/",
    		wc_id: "3022",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/10/2906.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615507200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c46be9f726bf9-4588-5029-9fb4-0d41efa466e4",
    		id: 832,
    		name: "Elektr. Fondue",
    		brand: "TCM",
    		itype: "64696",
    		category: "Küche",
    		deposit: 15,
    		parts: "11",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1596758400000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d2ce8b2d07b87-78ce-56ca-b996-249a4a61d97b",
    		id: 2900,
    		name: "Kinder Schlittschuhkuven",
    		brand: "-",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 5,
    		parts: "2",
    		manual: "",
    		"package": "",
    		added: 1592179200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/kinder-schlittschuhkuven/",
    		wc_id: "3823",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/06/2900.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Größe ist auf den jeweiligen Schuh anzupassen -„Eisrutscherle“",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616284800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c3f77487f75f1-c080-547f-b24f-6cb58cc7318a",
    		id: 819,
    		name: "Kindertrage",
    		brand: "fourseasons",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 25,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539043200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/kindertrage/",
    		wc_id: "2044",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/819.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "bis zu 15 kg",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616889600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d5badb1d93846-69a5-514e-8f06-a4538641dd40",
    		id: 4003,
    		name: "Bowle-Set",
    		brand: "-",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "9",
    		manual: "",
    		"package": "-",
    		added: 1542326400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/bowle-set/",
    		wc_id: "3046",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/4003.jpg",
    		highlight: "rgb(131, 235, 52)",
    		synonyms: "",
    		description: "mit 6 Tassen, Schöpfkelle",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8bf93e74e652c3-d5e0-58c2-b1d7-51e93e091bd9",
    		id: 212,
    		name: "Kinderhochstuhl",
    		brand: "icoo",
    		itype: "SPENDENVERKAUF",
    		category: "Kinder",
    		deposit: 15,
    		parts: "4",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/212.pdf",
    		"package": "-",
    		added: 1536624000000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616803200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c08ef2547f2a9-649a-5abf-b36c-74d2aa0f40bc",
    		id: 329,
    		name: "Schokofondue-Set",
    		brand: "kela",
    		itype: "",
    		category: "Küche",
    		deposit: "15",
    		parts: "10",
    		manual: "",
    		"package": "",
    		added: 1611014400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/schokofondue-set/",
    		wc_id: "4631",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2021/01/0329.jpg",
    		highlight: "rgb(247, 239, 10)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c4ffb2edb67ac-bc84-570e-a388-675ef6423e3c",
    		id: 921,
    		name: "Entsafter",
    		brand: "mia",
    		itype: "SP2003",
    		category: "Küche",
    		deposit: 15,
    		parts: "6",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/921.pdf",
    		"package": "-",
    		added: 1544486400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/entsafter-2/",
    		wc_id: "326",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/921.jpg",
    		highlight: "",
    		synonyms: "Fruchtpresse, Kelter, Moster, Mostpresse, Obstpresse, Saftpresse",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cb580b46e334f-3b45-563e-bad2-81dd698c57ab",
    		id: 1703,
    		name: "Lötkolben",
    		brand: "Ersa",
    		itype: "150",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "4",
    		manual: "",
    		"package": "-",
    		added: 1537228800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/loetkolben/",
    		wc_id: "2157",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1703.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "mit Lötfett, -stein, -zinn",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616198400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d7ad9766ded74-9e1e-5163-99c5-b196ebb865fb",
    		id: 5059,
    		name: "Kabeltrommel",
    		brand: "-",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "1",
    		manual: "-",
    		"package": "-",
    		added: 1605744000000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/kabeltrommel/",
    		wc_id: "4307",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		highlight: "rgb(45, 144, 224)",
    		synonyms: "",
    		description: "50m",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616457600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cd734f41f1f7a-72e9-5ea3-a82b-5b901ea7c2d2",
    		id: 1907,
    		name: "belgisches Waffeleisen",
    		brand: "ambiano",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1540771200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/belgisches-waffeleisen/",
    		wc_id: "513",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1907.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614556800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d7ce53c2a4591-c296-575a-876a-9a1ca87056ec",
    		id: 6002,
    		name: "Babysitz",
    		brand: "bébé comfort",
    		itype: "",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "",
    		added: 1581897600000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615507200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c25b46d494223-7b48-5771-94e8-1c431a7b771b",
    		id: 606,
    		name: "Elektr. Gemüseschneider",
    		brand: "Moulinex",
    		itype: "Charlotte HV3",
    		category: "Küche",
    		deposit: 15,
    		parts: "22",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1536105600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/kuechenmaschine-2/",
    		wc_id: "256",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/606.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616630400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cb5408dfb453e-debf-5d64-ad21-98bbbc79ee09",
    		id: 1702,
    		name: "Ravioli-Former",
    		brand: "TCM",
    		itype: "-",
    		category: "Küche",
    		deposit: 5,
    		parts: "3",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1537228800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/ravioli-former/",
    		wc_id: "463",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1702.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615593600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c0beac97e7f68-ab2d-5408-9ed5-04fd1ceb9b72",
    		id: 409,
    		name: "Dampfbügelstation",
    		brand: "TCM",
    		itype: "KASCHKA",
    		category: "Haushalt",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1536019200000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "rgb(45, 144, 224)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d5fcf32d81b01-3391-57ed-b7ca-a6f15977746f",
    		id: 5004,
    		name: "Hammer",
    		brand: "-",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 5,
    		parts: "-",
    		manual: "",
    		"package": "-",
    		added: 1541116800000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/hammer/",
    		wc_id: "1845",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5004.jpg",
    		highlight: "",
    		synonyms: "Fäustel",
    		description: "verschiedene Art und Größen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615680000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d37af3309ec92-21be-579f-920a-d920d5579789",
    		id: 3004,
    		name: "Werkzeugkasten",
    		brand: "-",
    		itype: "",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "",
    		manual: "",
    		"package": "",
    		added: 1578096000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/werkzeugkasten/",
    		wc_id: "3246",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/3004.jpg",
    		highlight: "",
    		synonyms: "Werkzeugbox, Werkzeugkiste, Werkzeugkoffer",
    		description: "Mit Säge und Knieschoner usw…,weiterer Zubehör siehe Bild",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616630400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8be82068492814-5c8b-50c8-811f-9bc01abdcbdc",
    		id: 100,
    		name: "Staubsauger",
    		brand: "Thomas",
    		itype: "SPENDENVERKAUF",
    		category: "Haushalt",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539907200000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614729600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d1261acf28dc8-d531-5d56-bb75-f3011d3c97d1",
    		id: 2622,
    		name: "Metronom",
    		brand: "Wittner",
    		itype: "Tactell piccolino",
    		category: "Freizeit",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1589500800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/metronom/",
    		wc_id: "3761",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/2622.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "made in Germany , Qualität seit 1895",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614643200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c584095a0203e-d196-5afa-a11e-6657f2ce60b2",
    		id: 1009,
    		name: "Luftentfeuchter",
    		brand: "Workzone",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "-",
    		added: 1540512000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/luftentfeuchter/",
    		wc_id: "2068",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1009.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616198400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cb2fd4ab9ccfd-f2e7-5248-84ae-5a70679f882d",
    		id: 1630,
    		name: "Inliner GR. 33-36",
    		brand: "crane",
    		itype: "Art.-Nr. 91943",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "",
    		added: 1581897600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/inliner/",
    		wc_id: "3480",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/6009.jpg",
    		highlight: "rgb(45, 144, 224)",
    		synonyms: "",
    		description: "für Jungen Gr. 33-36, 72mm",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615075200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d07ee12d8ee8c-bdb0-5a3c-97a8-205e99bc43c3",
    		id: 2522,
    		name: "Walkingstöcke",
    		brand: "-",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "2",
    		manual: "",
    		"package": "-",
    		added: 1564704000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/walkingstoecke/",
    		wc_id: "2988",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/08/2522.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Höhe: 110 cm",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616716800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cf3ff4dace921-1ab1-5df2-b129-3d20fe578635",
    		id: 2402,
    		name: "Babywippe",
    		brand: "chicco",
    		itype: "SPENDENVERKAUF",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1551398400000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cb924fde4dc39-6d22-5030-9d46-0f12f8a0dc62",
    		id: 1710,
    		name: "Tortenring",
    		brand: "chg",
    		itype: "-",
    		category: "Küche",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1537747200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/tortenring/",
    		wc_id: "2916",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1710.jpg",
    		highlight: "rgb(131, 235, 52)",
    		synonyms: "",
    		description: "8,5 cm hoch",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cccb7522eba62-95f8-5732-9aec-194f7168a99e",
    		id: 1800,
    		name: "Speiseeismaschine",
    		brand: "studio",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "5",
    		manual: "",
    		"package": "Originalkarton",
    		added: 1596758400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/speiseeismaschine-3/",
    		wc_id: "3970",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1807.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Kühlflüssigkeit über Nacht kühlstellen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616284800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d536d16d0819b-e8cb-5310-9d0a-96e521d3925f",
    		id: 3309,
    		name: "Navigationsgerät",
    		brand: "Tomtom",
    		itype: "",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "2",
    		manual: "",
    		"package": "",
    		added: 1572480000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/navigationsgeraet/",
    		wc_id: "3045",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/10/3309.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615680000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c3397c34d1646-ee64-5074-afd3-ec19b284e644",
    		id: 708,
    		name: "Motorradbatterie-Ladegerät",
    		brand: "smartCharcher",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "2",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1539561600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/motorradbatterie-ladegeraet/",
    		wc_id: "2032",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/708.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "2x vorhanden, Input 230V Output 12V",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614556800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8bf28b529ec261-f758-5017-a410-dcc229a1b34f",
    		id: 120,
    		name: "Infrarot-Temperaturmessgerät",
    		brand: "POWERFIX",
    		itype: "Profi+",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "2",
    		manual: "in Schriftform vorhanden",
    		"package": "OriginalKarton",
    		added: 1602720000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/infrarot-temperaturmessgeraet/",
    		wc_id: "4166",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/10/P1060730.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Anleitung in Schriftform vorhanden\nZeigt Wärmeverluste an Fenstern, Türen oder Isolierungen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616112000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c7e63daed8914-6b8a-5a54-b6f4-aa87cf6924ca",
    		id: 1242,
    		name: "Laufrad",
    		brand: "Puky",
    		itype: "12,5 Zoll",
    		category: "Kinder",
    		deposit: "15",
    		parts: "1",
    		manual: "",
    		"package": "",
    		added: 1610755200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/laufrad-2/",
    		wc_id: "4615",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2021/01/2116.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616371200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cd4fb620b75eb-3748-587c-a9f8-46ae60013650",
    		id: 1902,
    		name: "Reithelm",
    		brand: "SPENDENVERKAF",
    		itype: "-",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539907200000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8ca0c9f0c8e1e5-8bde-5319-9ad3-0f180c83a630",
    		id: 1517,
    		name: "Einrad",
    		brand: "-",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1548460800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/einrad/",
    		wc_id: "888",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1517.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614556800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8bf867511fe1ed-be02-5e95-bb6a-87d22d68eebb",
    		id: 210,
    		name: "Stativleinwand",
    		brand: "universa",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539648000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/stativleinwand/",
    		wc_id: "183",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/210.jpg",
    		highlight: "rgb(247, 239, 10)",
    		synonyms: "",
    		description: "Maximale Maße der Leinwand: 1,2 m x 1,25 m",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615852800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c3536931f52dc-5151-5cf8-96fa-3fc6458fcbb4",
    		id: 711,
    		name: "Küchenmaschine",
    		brand: "Braun",
    		itype: "Type 4200",
    		category: "Küche",
    		deposit: 35,
    		parts: "21",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Karton",
    		added: 1539561600000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/kuechenmaschine-3/",
    		wc_id: "2830",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614988800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c48d5158311b6-f776-5081-b33d-786eab2aafc8",
    		id: 905,
    		name: "Stichsäge",
    		brand: "Metabo",
    		itype: "St EP 560",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "2",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkoffer",
    		added: 1536192000000,
    		status: "onbackorder",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/stichsaege-2/",
    		wc_id: "310",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/905.jpg",
    		highlight: "rgb(131, 235, 52)",
    		synonyms: "Laubsäge, Laubsägemaschine, Wippsäge",
    		description: "div. Sägeblätter",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d5e7c049f5ce9-4d4b-567d-b17c-de91058b930e",
    		id: 5002,
    		name: "Schraubenschlüssel",
    		brand: "-",
    		itype: "-",
    		category: "Heimwerker",
    		deposit: 5,
    		parts: "-",
    		manual: "",
    		"package": "-",
    		added: 1537747200000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/1529/",
    		wc_id: "1529",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "auch: Gabel-Ringschlüssel, Gabelschlüssel\nverschiedene Größen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d612f0b803678-b9b5-52ee-bd60-916e2b36df13",
    		id: 5006,
    		name: "Wasserwaage, 100cm, Alu",
    		brand: "Bauhaus",
    		itype: "",
    		category: "Heimwerker",
    		deposit: "25",
    		parts: "",
    		manual: "",
    		"package": "",
    		added: 1614038400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/wasserwaage-100cm-alu/",
    		wc_id: "4684",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614902400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c793f2f9ee9c0-5d1a-5d98-867d-a263d9edcbf2",
    		id: 1232,
    		name: "Saftpresse",
    		brand: "-",
    		itype: "-",
    		category: "Küche",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1543622400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/saftpresse/",
    		wc_id: "2877",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1232.jpg",
    		highlight: "",
    		synonyms: "Entsafter, Fruchtpresse, Kelter, Moster, Mostpresse, Obstpresse",
    		description: "2x vorhanden",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615334400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d30881629f49e-c0e9-56ca-9e64-5ddf86af39f9",
    		id: 2909,
    		name: "Multi-Scanner",
    		brand: "Tevion",
    		itype: "SPENDENVerKAUF",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "8",
    		manual: "",
    		"package": "",
    		added: 1568160000000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615852800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cf6f28e9043f3-6bf1-5a69-b9c5-856e2bb43ff6",
    		id: 2407,
    		name: "Schreibmaschine",
    		brand: "Olympia",
    		itype: "",
    		category: "Freizeit",
    		deposit: 25,
    		parts: "1",
    		manual: "",
    		"package": "Originalkoffer",
    		added: 1553126400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/schreibmaschine/",
    		wc_id: "2236",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/2407.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Reiseschreibmaschine mit Tragekoffer",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616630400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8be26823bf3c9c-739e-5592-8b06-184e227bd14d",
    		id: 18,
    		name: "Filmvorführgerät",
    		brand: "ELMO",
    		itype: "SP-F",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "",
    		added: 1581292800000,
    		status: "onbackorder",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/diaprojektor-5/",
    		wc_id: "3427",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/18.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c05c319f9bca6-702d-5f2f-b12c-96c015bc62c5",
    		id: 321,
    		name: "Bunsenbrenner",
    		brand: "campingaz",
    		itype: "soudagaz 20C",
    		category: "Heimwerker",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1542931200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/loetlampe/",
    		wc_id: "1984",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/321.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "mit Gas-Stechkartusche, zum Einsetzen der Kartusche sind 2 Personen benötigt",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616284800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c687db0a71517-1f10-5d8c-8c62-3ba099c3c255",
    		id: 1202,
    		name: "Fleischwolf",
    		brand: "alfa",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "7",
    		manual: "",
    		"package": "Originalkarton",
    		added: 1536278400000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/fleischwolf/",
    		wc_id: "2864",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1202.jpg",
    		highlight: "",
    		synonyms: "Faschiermaschine, Fleischmaschine",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616284800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cd0ff0954f9d0-0219-545a-8ba0-db157f2acb7e",
    		id: 1807,
    		name: "Speiseeismaschine",
    		brand: "studio",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "5",
    		manual: "",
    		"package": "Originalkarton",
    		added: 1542931200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/speiseeismaschine/",
    		wc_id: "497",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1807.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Kühlflüssigkeit über Nacht kühlstellen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615075200000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cd5cfad7904d8-1709-5699-8bc1-4a16878e8f92",
    		id: 1903,
    		name: "Reithelm",
    		brand: "Penta",
    		itype: "Champion",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1539907200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/reithelm-2/",
    		wc_id: "2194",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1903.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Größe XS/01 50-54 cm",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616544000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d6e8084fdfcc5-88a2-5024-8d1f-ba5ed3e93657",
    		id: 5035,
    		name: "Gartenkralle",
    		brand: "Garden Claw",
    		itype: "-",
    		category: "Garten",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1530403200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/garten/gartenkralle/",
    		wc_id: "2836",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/814.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614816000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c99aaac601362-b4de-5b3b-a054-221f80f95259",
    		id: 1501,
    		name: "Rollator",
    		brand: "Invacare",
    		itype: "KA",
    		category: "Haushalt",
    		deposit: 25,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1501.pdf",
    		"package": "-",
    		added: 1530403200000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615852800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c2957915ab7cb-cc89-50ec-9fe3-c551b5b1b830",
    		id: 614,
    		name: "Autokindersitz",
    		brand: "Nania",
    		itype: "KASCHKA",
    		category: "Kinder",
    		deposit: 5,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "-",
    		added: 1539043200000,
    		status: "deleted",
    		wc_url: "",
    		wc_id: "",
    		image: "",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616457600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d6a829da8cc78-8c9e-5622-aabc-1a041729199f",
    		id: 5025,
    		name: "Campingsessel",
    		brand: "-",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 5,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1551052800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/campingsessel/",
    		wc_id: "2276",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5025.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "rund, klappbar",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c36b0df8470ad-f021-558d-ad23-f5cc14041148",
    		id: 715,
    		name: "Multi-Elektrosäge",
    		brand: "KingCraft",
    		itype: "KMS 550 E",
    		category: "Heimwerker",
    		deposit: 25,
    		parts: "1",
    		manual: "",
    		"package": "OriginalKarton",
    		added: 1550448000000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/multi-elektrosaege/",
    		wc_id: "2037",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "incl. Sägeblätter\nauch: Säbel – Sägemaschine, elektischer Fuchsschwanz",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8bf416f86b3f42-cf0c-55ad-93ae-8e4d0ea6f2e1",
    		id: 122,
    		name: "Digital-Multimeter",
    		brand: "POWERFIX",
    		itype: "Profi +",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "3",
    		manual: "in Schriftform vorhanden",
    		"package": "original karton",
    		added: 1605744000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/digital-multimeter/",
    		wc_id: "4295",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/0122.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Bedienungsanleitung in Schriftform vorhanden",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615334400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d2d3b81f866b2-0a10-5d75-a1d1-cf1889ba0350",
    		id: 2901,
    		name: "Schwingschleifer",
    		brand: "Bosch",
    		itype: "PSS 23 AE",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "-",
    		added: 1564963200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/schwingschleifer-2/",
    		wc_id: "3838",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/06/2901.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "mit div. Schleifpapier",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616025600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c188c9840b8dd-8242-5480-b2da-dd53cf5554a6",
    		id: 502,
    		name: "Camping Gaskocher",
    		brand: "Week End",
    		itype: "-",
    		category: "Freizeit",
    		deposit: 15,
    		parts: "1",
    		manual: "",
    		"package": "Originalkarton",
    		added: 1536105600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/freizeit/camping-gaskocher/",
    		wc_id: "2812",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/502.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Gasanschluss möglich für Butan/Propan, 2 Kochstellen\nman benötigt eine große Gasflasche & einen Gas-Schlauch-Regler",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616112000000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cf302ec817395-2bd4-5e1f-a3af-12ce3ac7a0ca",
    		id: 2318,
    		name: "Autokindersitz",
    		brand: "Cybex",
    		itype: "ECE R44/ 04",
    		category: "Kinder",
    		deposit: 15,
    		parts: "1",
    		manual: "in Schriftform vorhanden",
    		"package": "",
    		added: 1579219200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kinder/autokindersitz-12/",
    		wc_id: "3298",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/2800.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "Bedienungsanleitung in Schriftform vorhanden\nca. 3-12 Jahre (15-36kg) <150cm",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615420800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c9eb1f2eec798-d18c-51ba-b0d6-6263536d593f",
    		id: 1511,
    		name: "Multifunktionswerkzeug",
    		brand: "Dremel",
    		itype: "300",
    		category: "Heimwerker",
    		deposit: 15,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1511.pdf",
    		"package": "Originalkoffer",
    		added: 1540512000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/multifunktionswerkzeug/",
    		wc_id: "441",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1511.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "div. Aufsatzteile",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615852800000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c1c79b96efea8-6322-5438-a549-3984cc39b42f",
    		id: 512,
    		name: "Kontaktgrill",
    		brand: "privileg",
    		itype: "-",
    		category: "Küche",
    		deposit: 15,
    		parts: "1",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1539561600000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/kontaktgrill/",
    		wc_id: "2816",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/512.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615766400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cdd01d9429dd3-42d3-504d-ba27-82dd5a3bcd13",
    		id: 1919,
    		name: "Dörr-Automat",
    		brand: "ABC Elektrogeräte",
    		itype: "600.1/601.1",
    		category: "Küche",
    		deposit: 15,
    		parts: "1",
    		manual: "in Schriftform vorhanden",
    		"package": "OriginalKarton",
    		added: 1587686400000,
    		status: "outofstock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/doerr-automat/",
    		wc_id: "3654",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		highlight: "rgb(250, 45, 30)",
    		synonyms: "",
    		description: "Bedienungsanleitung in Schriftform vorhanden",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615593600000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8d6e16635cc65e-d86d-508e-864e-5edbf07c9a0b",
    		id: 5034,
    		name: "Kabeltrommel",
    		brand: "",
    		itype: "",
    		category: "Heimwerker",
    		deposit: "25",
    		parts: "1",
    		manual: "",
    		"package": "",
    		added: 1579824000000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/verlaengerungskabel/",
    		wc_id: "3353",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/01/5034.jpg",
    		highlight: "rgb(45, 144, 224)",
    		synonyms: "",
    		description: "mit 3 Steckdosen, 45m",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1616198400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8c0289af238f26-08bf-5a76-97b5-e55f6336ffa1",
    		id: 311,
    		name: "Getreidemühle",
    		brand: "Alnatura",
    		itype: "-",
    		category: "Küche",
    		deposit: 25,
    		parts: "8",
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "Originalkarton",
    		added: 1536019200000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/kueche/getreidemuehle/",
    		wc_id: "199",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/311.jpg",
    		highlight: "",
    		synonyms: "",
    		description: "2 Gummifüße fehlen",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1615766400000
    	},
    	{
    		_id: "6e8e3f8877ed77c2fc8efa41a8cd3b58fb328cd-33ea-5dc7-bc01-3391f1bf04b3",
    		id: 1900,
    		name: "Dekupiersäge",
    		brand: "Güde",
    		itype: "GDS 16 Elektronik",
    		category: "Heimwerker",
    		deposit: 55,
    		parts: 2,
    		manual: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/gedruckte-Bedienungsanleitung.pdf",
    		"package": "OriginalKarton",
    		added: 1558828800000,
    		status: "instock",
    		wc_url: "https://www.buergerstiftung-karlsruhe.de/leihlokal/sortiment/heimwerker/dekupiersaege-2/",
    		wc_id: "3002",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/05/2708.jpg",
    		highlight: "rgb(247, 239, 10)",
    		synonyms: "",
    		description: "",
    		exists_more_than_once: 0,
    		type: "item",
    		last_update: 1614988800000
    	},
    	{
    		_id: "8cc2f9de-7fb6-5bf1-b6e8-c4d79a334e37",
    		rented_on: 1616716800000,
    		to_return_on: 1617321600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 4,
    		customer_name: "Luetkemeyers",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1614988800000,
    		remark: ""
    	},
    	{
    		_id: "acd86855-ae59-5523-8979-cad97d6ae77e",
    		rented_on: 1615420800000,
    		to_return_on: 1617235200000,
    		returned_on: 1616630400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1506.jpg",
    		item_id: 1506,
    		item_name: "el. Kettensäge",
    		customer_id: 5,
    		customer_name: "Ogelsby",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616284800000,
    		remark: ""
    	},
    	{
    		_id: "8dfa0546-d7b2-5c8a-ab7a-403e3a371bf0",
    		rented_on: 1614643200000,
    		to_return_on: 1615248000000,
    		returned_on: 1615248000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 58,
    		customer_name: "Langstone",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616803200000,
    		remark: ""
    	},
    	{
    		_id: "4a83c8c6-6eeb-5f82-823b-67a8c4af3463",
    		rented_on: 1615075200000,
    		to_return_on: 1616889600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 56,
    		customer_name: "Face",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1616025600000,
    		remark: ""
    	},
    	{
    		_id: "558d0834-3671-5c59-b719-66fbd24933d3",
    		rented_on: 1616371200000,
    		to_return_on: 1618185600000,
    		returned_on: 1617580800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 51,
    		customer_name: "Crockett",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1616630400000,
    		remark: ""
    	},
    	{
    		_id: "85ef9170-d7e0-5622-808c-5df1d01d5fe4",
    		rented_on: 1616371200000,
    		to_return_on: 1618185600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1506.jpg",
    		item_id: 1506,
    		item_name: "el. Kettensäge",
    		customer_id: 40,
    		customer_name: "Barbrick",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1616457600000,
    		remark: ""
    	},
    	{
    		_id: "1c52c90a-80f1-57b3-b4bb-2744f3fcc1be",
    		rented_on: 1616371200000,
    		to_return_on: 1617580800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 84,
    		customer_name: "Taunton.",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 5,
    		deposit_returned: 0,
    		last_update: 1616198400000,
    		remark: ""
    	},
    	{
    		_id: "08dfaf7c-36cf-521b-89dd-b07fc62951c3",
    		rented_on: 1614729600000,
    		to_return_on: 1615939200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 58,
    		customer_name: "Langstone",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 5,
    		deposit_returned: 0,
    		last_update: 1616803200000,
    		remark: ""
    	},
    	{
    		_id: "83083740-445f-551b-ab07-22a8ba9791d7",
    		rented_on: 1615680000000,
    		to_return_on: 1616284800000,
    		returned_on: 1615680000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 59,
    		customer_name: "Orrice",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1615939200000,
    		remark: ""
    	},
    	{
    		_id: "14889f37b-3ce0-5655-87de-350439b31de0",
    		rented_on: 1616457600000,
    		to_return_on: 1617667200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 64,
    		customer_name: "Smyth",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1615334400000,
    		remark: ""
    	},
    	{
    		_id: "117b1b981-5d0f-5237-883c-03826beb6b59",
    		rented_on: 1614902400000,
    		to_return_on: 1616112000000,
    		returned_on: 1616716800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 85,
    		customer_name: "McCoish",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1616112000000,
    		remark: ""
    	},
    	{
    		_id: "13f38eb14-4c73-5093-8a10-ac6f17f86d38",
    		rented_on: 1616630400000,
    		to_return_on: 1618444800000,
    		returned_on: 1617840000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 66,
    		customer_name: "Clunan",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1616112000000,
    		remark: ""
    	},
    	{
    		_id: "13dfb4908-cdbb-52cc-8f1f-8da5bdf568a2",
    		rented_on: 1616198400000,
    		to_return_on: 1616803200000,
    		returned_on: 1616803200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 27,
    		customer_name: "Jaqueme",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1614643200000,
    		remark: ""
    	},
    	{
    		_id: "1a0fbb3dd-2bc5-5bc1-a0d7-c4b52c647f51",
    		rented_on: 1616112000000,
    		to_return_on: 1616716800000,
    		returned_on: 1616716800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 12,
    		customer_name: "Marushak",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1614556800000,
    		remark: ""
    	},
    	{
    		_id: "186be0416-7072-5a85-9dfe-0130104e6a69",
    		rented_on: 1614902400000,
    		to_return_on: 1616112000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 30,
    		customer_name: "Costanza",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1615161600000,
    		remark: ""
    	},
    	{
    		_id: "1ae2f84f5-b6da-53fa-9d93-a87df897f288",
    		rented_on: 1615680000000,
    		to_return_on: 1617494400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 83,
    		customer_name: "Bendare",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1614556800000,
    		remark: ""
    	},
    	{
    		_id: "1e46579a9-e38f-5b61-96b1-56bb8be5245e",
    		rented_on: 1616198400000,
    		to_return_on: 1617408000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 70,
    		customer_name: "Maltby",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 15,
    		deposit_returned: 0,
    		last_update: 1614643200000,
    		remark: ""
    	},
    	{
    		_id: "139276c9e-4e43-5cdb-8d59-53bdc7693d4b",
    		rented_on: 1615939200000,
    		to_return_on: 1617148800000,
    		returned_on: 1616544000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 40,
    		customer_name: "Barbrick",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1615420800000,
    		remark: ""
    	},
    	{
    		_id: "130d1a185-69a7-50c9-a569-9c1011c01601",
    		rented_on: 1614729600000,
    		to_return_on: 1616544000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 30,
    		customer_name: "Costanza",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 15,
    		deposit_returned: 0,
    		last_update: 1616889600000,
    		remark: ""
    	},
    	{
    		_id: "2c50348ec-7f21-5f8b-bd12-2e7ca54c880d",
    		rented_on: 1615680000000,
    		to_return_on: 1617494400000,
    		returned_on: 1616889600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 25,
    		customer_name: "Kindred",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1616371200000,
    		remark: ""
    	},
    	{
    		_id: "20212d2c5-ece2-5e7b-9af9-5cc0a0e69251",
    		rented_on: 1616544000000,
    		to_return_on: 1617148800000,
    		returned_on: 1616544000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 29,
    		customer_name: "Clapperton",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1616803200000,
    		remark: ""
    	},
    	{
    		_id: "26c485a05-6497-5e8b-9f8a-6f2ae9ee6ca4",
    		rented_on: 1615593600000,
    		to_return_on: 1616803200000,
    		returned_on: 1616198400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 100,
    		customer_name: "Palluschek",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615420800000,
    		remark: ""
    	},
    	{
    		_id: "263371cbe-c60d-51f9-9b33-0e106d885067",
    		rented_on: 1616889600000,
    		to_return_on: 1618099200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 60,
    		customer_name: "Cruft",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "2061dfff1-c3f8-5939-8daa-8bad465c7910",
    		rented_on: 1616198400000,
    		to_return_on: 1618012800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 16,
    		customer_name: "Lainge",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1615766400000,
    		remark: ""
    	},
    	{
    		_id: "28db74051-3815-578a-9fdb-0b5a219ce617",
    		rented_on: 1616284800000,
    		to_return_on: 1617494400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 35,
    		customer_name: "Slym",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1614902400000,
    		remark: ""
    	},
    	{
    		_id: "2f30623d8-9e70-54cc-a7f0-07d85a367ca3",
    		rented_on: 1615507200000,
    		to_return_on: 1616112000000,
    		returned_on: 1616112000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 14,
    		customer_name: "Daville",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1616371200000,
    		remark: ""
    	},
    	{
    		_id: "21daa364b-01d2-51a1-9511-3d364f427cb5",
    		rented_on: 1616284800000,
    		to_return_on: 1616889600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 73,
    		customer_name: "Kaley",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1615248000000,
    		remark: ""
    	},
    	{
    		_id: "2079442f1-49ff-5b79-939a-b4fdeccdf2c8",
    		rented_on: 1616457600000,
    		to_return_on: 1618272000000,
    		returned_on: 1617667200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 63,
    		customer_name: "Franz",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615593600000,
    		remark: ""
    	},
    	{
    		_id: "251ba7d92-7ff9-5dfe-96aa-7bb1affaa612",
    		rented_on: 1615939200000,
    		to_return_on: 1617148800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 40,
    		customer_name: "Barbrick",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1615680000000,
    		remark: ""
    	},
    	{
    		_id: "3d812c023-3e6d-573d-acf6-fe78d7e43be9",
    		rented_on: 1614556800000,
    		to_return_on: 1616371200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 24,
    		customer_name: "Thomkins",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "3063cdcd0-cdbb-57c9-9b4e-e1a6e69c071f",
    		rented_on: 1614988800000,
    		to_return_on: 1616198400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 4,
    		customer_name: "Luetkemeyers",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1615248000000,
    		remark: ""
    	},
    	{
    		_id: "3665fdcb4-c9bf-56c3-9973-9f3d95c37539",
    		rented_on: 1614816000000,
    		to_return_on: 1616630400000,
    		returned_on: 1616025600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 32,
    		customer_name: "Cornwell",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1614902400000,
    		remark: ""
    	},
    	{
    		_id: "304b8f25d-583b-5e1b-9f01-0d1816f64104",
    		rented_on: 1614902400000,
    		to_return_on: 1615507200000,
    		returned_on: 1616112000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 31,
    		customer_name: "Sunderland",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616025600000,
    		remark: ""
    	},
    	{
    		_id: "32c13ed1a-1685-50fe-8048-e843ff7660d9",
    		rented_on: 1616112000000,
    		to_return_on: 1617926400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		item_id: 711,
    		item_name: "Küchenmaschine",
    		customer_id: 2,
    		customer_name: "Heaviside",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1616457600000,
    		remark: ""
    	},
    	{
    		_id: "349f0e515-fcfc-51e6-ba2f-7c0be7c204f8",
    		rented_on: 1616457600000,
    		to_return_on: 1617667200000,
    		returned_on: 1617062400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 90,
    		customer_name: "Frantsev",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1616889600000,
    		remark: ""
    	},
    	{
    		_id: "38efef905-baa6-5225-bbe6-3b8fd373bae4",
    		rented_on: 1615766400000,
    		to_return_on: 1616976000000,
    		returned_on: 1616371200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 8,
    		customer_name: "Bursnell",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1615248000000,
    		remark: ""
    	},
    	{
    		_id: "38cbabea8-260c-5e22-a1d7-4610fce25000",
    		rented_on: 1615766400000,
    		to_return_on: 1617580800000,
    		returned_on: 1616976000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 73,
    		customer_name: "Kaley",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1614643200000,
    		remark: ""
    	},
    	{
    		_id: "3143c7af2-596b-52a5-a9d9-25bb1b362ded",
    		rented_on: 1615334400000,
    		to_return_on: 1617148800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 52,
    		customer_name: "Sames",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 15,
    		deposit_returned: 0,
    		last_update: 1616889600000,
    		remark: ""
    	},
    	{
    		_id: "390880a08-9472-5153-8eee-2f5f78e17dbb",
    		rented_on: 1614816000000,
    		to_return_on: 1616025600000,
    		returned_on: 1615420800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1506.jpg",
    		item_id: 1506,
    		item_name: "el. Kettensäge",
    		customer_id: 86,
    		customer_name: "McAnalley",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615075200000,
    		remark: ""
    	},
    	{
    		_id: "4760a2462-feb1-5d67-ac74-8371ab5f7335",
    		rented_on: 1615680000000,
    		to_return_on: 1616889600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 14,
    		customer_name: "Daville",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1615680000000,
    		remark: ""
    	},
    	{
    		_id: "4f736ec44-a48e-5d11-b50a-5efb116dc92d",
    		rented_on: 1614643200000,
    		to_return_on: 1616457600000,
    		returned_on: 1615852800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 96,
    		customer_name: "Tilston",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1615939200000,
    		remark: ""
    	},
    	{
    		_id: "4ae073cb1-c6bb-50ec-8020-d27f8f1f8d81",
    		rented_on: 1615334400000,
    		to_return_on: 1616544000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 24,
    		customer_name: "Thomkins",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "429fa87f9-0998-53ef-a8d0-794fa13f6b04",
    		rented_on: 1615939200000,
    		to_return_on: 1616544000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 44,
    		customer_name: "Glanester",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1616544000000,
    		remark: ""
    	},
    	{
    		_id: "4cfe3e902-eef3-54cd-81b4-d0351af33277",
    		rented_on: 1616716800000,
    		to_return_on: 1617926400000,
    		returned_on: 1617321600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 87,
    		customer_name: "MacDermid",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1616889600000,
    		remark: ""
    	},
    	{
    		_id: "45d2b85c7-0ef6-5244-9fea-f4acf8c5f31a",
    		rented_on: 1615680000000,
    		to_return_on: 1616284800000,
    		returned_on: 1615680000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 71,
    		customer_name: "Kendle",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1615420800000,
    		remark: ""
    	},
    	{
    		_id: "49dd0d6cb-57a8-5bea-b9fe-106b4bdb5063",
    		rented_on: 1615852800000,
    		to_return_on: 1617667200000,
    		returned_on: 1617062400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 29,
    		customer_name: "Clapperton",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1616544000000,
    		remark: ""
    	},
    	{
    		_id: "4cb3881a6-f222-5991-9dbb-6d99898ecd8d",
    		rented_on: 1615939200000,
    		to_return_on: 1617753600000,
    		returned_on: 1617148800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 88,
    		customer_name: "Fumagall",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616025600000,
    		remark: ""
    	},
    	{
    		_id: "47fc3174b-156b-5024-82d2-e40b789e68d0",
    		rented_on: 1616457600000,
    		to_return_on: 1617062400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 98,
    		customer_name: "Costen",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1615334400000,
    		remark: ""
    	},
    	{
    		_id: "4c1116b7b-126c-5951-9575-87948e9b94a6",
    		rented_on: 1614729600000,
    		to_return_on: 1616544000000,
    		returned_on: 1615939200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 84,
    		customer_name: "Taunton.",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1614902400000,
    		remark: ""
    	},
    	{
    		_id: "5fb2ddea3-f9b6-5a8e-b1bf-19edb3f757fe",
    		rented_on: 1614988800000,
    		to_return_on: 1616198400000,
    		returned_on: 1615593600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 81,
    		customer_name: "Feeham",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1614988800000,
    		remark: ""
    	},
    	{
    		_id: "5b51c3d53-70a1-5589-a643-b443ae7a9f5e",
    		rented_on: 1615334400000,
    		to_return_on: 1616544000000,
    		returned_on: 1615939200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 2,
    		customer_name: "Heaviside",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1614816000000,
    		remark: ""
    	},
    	{
    		_id: "5c12e98a2-04f3-5bea-b557-9fe66d138576",
    		rented_on: 1615939200000,
    		to_return_on: 1616544000000,
    		returned_on: 1615939200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 39,
    		customer_name: "Broadbent",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1615161600000,
    		remark: ""
    	},
    	{
    		_id: "57248d749-bc1b-56e9-819f-9109aea6e170",
    		rented_on: 1615075200000,
    		to_return_on: 1616284800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 55,
    		customer_name: "Gabby",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1616198400000,
    		remark: ""
    	},
    	{
    		_id: "571427433-f108-5d53-ad02-8ddd02a960f8",
    		rented_on: 1616716800000,
    		to_return_on: 1617321600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 65,
    		customer_name: "Mitchener",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 5,
    		deposit_returned: 0,
    		last_update: 1615593600000,
    		remark: ""
    	},
    	{
    		_id: "58544e7d6-a578-5887-9729-2a72a9af07ea",
    		rented_on: 1616889600000,
    		to_return_on: 1617494400000,
    		returned_on: 1616889600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 88,
    		customer_name: "Fumagall",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616630400000,
    		remark: ""
    	},
    	{
    		_id: "5b7980e2e-963e-579e-9d17-bbc8e629218c",
    		rented_on: 1616457600000,
    		to_return_on: 1618272000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 38,
    		customer_name: "Tofful",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1615334400000,
    		remark: ""
    	},
    	{
    		_id: "59ec36db2-15bd-5675-aaa0-d24826f38df2",
    		rented_on: 1614729600000,
    		to_return_on: 1615939200000,
    		returned_on: 1615334400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 78,
    		customer_name: "Camillo",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1616803200000,
    		remark: ""
    	},
    	{
    		_id: "5f05dd97b-d738-5a5c-9aa6-8254e39ec0c4",
    		rented_on: 1615593600000,
    		to_return_on: 1616803200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		item_id: 711,
    		item_name: "Küchenmaschine",
    		customer_id: 70,
    		customer_name: "Maltby",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1616803200000,
    		remark: ""
    	},
    	{
    		_id: "5c03a11bd-b1d9-5fb3-8c45-44a941629b80",
    		rented_on: 1616630400000,
    		to_return_on: 1617235200000,
    		returned_on: 1616630400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		item_id: 711,
    		item_name: "Küchenmaschine",
    		customer_id: 60,
    		customer_name: "Cruft",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1615075200000,
    		remark: ""
    	},
    	{
    		_id: "6d9ec58a9-744c-5b8d-b676-3a00f8baa34e",
    		rented_on: 1616803200000,
    		to_return_on: 1617408000000,
    		returned_on: 1616803200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5004.jpg",
    		item_id: 5004,
    		item_name: "Hammer",
    		customer_id: 67,
    		customer_name: "Windridge",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615939200000,
    		remark: ""
    	},
    	{
    		_id: "6f6f2a299-ca57-50b2-a1c9-7c696ea1c770",
    		rented_on: 1615852800000,
    		to_return_on: 1617667200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 98,
    		customer_name: "Costen",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 15,
    		deposit_returned: 0,
    		last_update: 1614729600000,
    		remark: ""
    	},
    	{
    		_id: "66339e2ec-bfb8-5cd2-b6c8-468398410b3b",
    		rented_on: 1615593600000,
    		to_return_on: 1616803200000,
    		returned_on: 1616803200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		item_id: 711,
    		item_name: "Küchenmaschine",
    		customer_id: 51,
    		customer_name: "Crockett",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "6cc35223d-a21f-519d-8a9f-ea67d3df92a2",
    		rented_on: 1614816000000,
    		to_return_on: 1616025600000,
    		returned_on: 1615420800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 54,
    		customer_name: "Quesne",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "6f6aaa958-44d3-5372-87d0-cac9e5da290b",
    		rented_on: 1616630400000,
    		to_return_on: 1617235200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 60,
    		customer_name: "Cruft",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1614816000000,
    		remark: ""
    	},
    	{
    		_id: "64b14492c-c9d6-5a92-bf1c-5acce7baebb3",
    		rented_on: 1616112000000,
    		to_return_on: 1617926400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 10,
    		customer_name: "Maceur",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 5,
    		deposit_returned: 0,
    		last_update: 1615334400000,
    		remark: ""
    	},
    	{
    		_id: "6f932675f-35a2-5645-a126-f798294ef141",
    		rented_on: 1615852800000,
    		to_return_on: 1617062400000,
    		returned_on: 1616457600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 83,
    		customer_name: "Bendare",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1614816000000,
    		remark: ""
    	},
    	{
    		_id: "64a6bcd81-ef4b-53d0-8ccf-12867e8cca8d",
    		rented_on: 1615161600000,
    		to_return_on: 1616371200000,
    		returned_on: 1616371200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 84,
    		customer_name: "Taunton.",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1615939200000,
    		remark: ""
    	},
    	{
    		_id: "60a09315e-4e3f-5244-bbb6-beab7389ccd6",
    		rented_on: 1615680000000,
    		to_return_on: 1616284800000,
    		returned_on: 1616284800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 97,
    		customer_name: "Beddin",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1616284800000,
    		remark: ""
    	},
    	{
    		_id: "62d65ad9e-bd4d-5200-89db-e52576328a8b",
    		rented_on: 1616025600000,
    		to_return_on: 1617235200000,
    		returned_on: 1616630400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 42,
    		customer_name: "Fieldgate",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "72437df33-6aad-5110-9402-184d3fc86c7e",
    		rented_on: 1614816000000,
    		to_return_on: 1615420800000,
    		returned_on: 1614816000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		item_id: 711,
    		item_name: "Küchenmaschine",
    		customer_id: 75,
    		customer_name: "Curlis",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1615334400000,
    		remark: ""
    	},
    	{
    		_id: "766a2bb77-231c-5453-a4e6-8b35217e4d96",
    		rented_on: 1615507200000,
    		to_return_on: 1617321600000,
    		returned_on: 1616716800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5004.jpg",
    		item_id: 5004,
    		item_name: "Hammer",
    		customer_id: 42,
    		customer_name: "Fieldgate",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 15,
    		deposit_returned: 15,
    		last_update: 1616112000000,
    		remark: ""
    	},
    	{
    		_id: "7910c99f0-a5e4-543c-816d-b00475c2483b",
    		rented_on: 1616198400000,
    		to_return_on: 1617408000000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 60,
    		customer_name: "Cruft",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 10,
    		deposit_returned: 0,
    		last_update: 1615766400000,
    		remark: ""
    	},
    	{
    		_id: "759f2f761-f87e-5124-9a0e-21bc38fefd5c",
    		rented_on: 1614729600000,
    		to_return_on: 1615334400000,
    		returned_on: 1614729600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 82,
    		customer_name: "Aliman",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1615507200000,
    		remark: ""
    	},
    	{
    		_id: "7ac326c89-6a24-58ae-85b1-d2fde7308f18",
    		rented_on: 1614643200000,
    		to_return_on: 1616457600000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1506.jpg",
    		item_id: 1506,
    		item_name: "el. Kettensäge",
    		customer_id: 11,
    		customer_name: "Kubicek",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 5,
    		deposit_returned: 0,
    		last_update: 1615766400000,
    		remark: ""
    	},
    	{
    		_id: "7875feb32-aec8-5ed4-ab7d-7ae2a44b146f",
    		rented_on: 1615507200000,
    		to_return_on: 1616716800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5004.jpg",
    		item_id: 5004,
    		item_name: "Hammer",
    		customer_id: 23,
    		customer_name: "Jiggins",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1616198400000,
    		remark: ""
    	},
    	{
    		_id: "7c8594d62-c8f1-52eb-8a3c-0cd12a7c46f5",
    		rented_on: 1614729600000,
    		to_return_on: 1616544000000,
    		returned_on: 1615939200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 50,
    		customer_name: "Markussen",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1616889600000,
    		remark: ""
    	},
    	{
    		_id: "7e8bbb0c4-2e1b-59e0-8c22-4b15eabbf232",
    		rented_on: 1615334400000,
    		to_return_on: 1616544000000,
    		returned_on: 1615939200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/1506.jpg",
    		item_id: 1506,
    		item_name: "el. Kettensäge",
    		customer_id: 34,
    		customer_name: "Dalglish",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1615852800000,
    		remark: ""
    	},
    	{
    		_id: "7f33cb20c-e8b5-5b97-ade8-a9528efb7fe2",
    		rented_on: 1616630400000,
    		to_return_on: 1617235200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/711.jpg",
    		item_id: 711,
    		item_name: "Küchenmaschine",
    		customer_id: 93,
    		customer_name: "Grise",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 50,
    		deposit_returned: 0,
    		last_update: 1615939200000,
    		remark: ""
    	},
    	{
    		_id: "7085b2bed-980a-5b54-8368-48dc735afd79",
    		rented_on: 1616889600000,
    		to_return_on: 1618704000000,
    		returned_on: 1618099200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 32,
    		customer_name: "Cornwell",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1614556800000,
    		remark: ""
    	},
    	{
    		_id: "85caddd2f-76e2-52cc-bae3-4a5081037b81",
    		rented_on: 1615420800000,
    		to_return_on: 1616630400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 78,
    		customer_name: "Camillo",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1616284800000,
    		remark: ""
    	},
    	{
    		_id: "84b2db8e8-09cd-5c46-9f78-19b9d85f4097",
    		rented_on: 1615420800000,
    		to_return_on: 1617235200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/04/6114.jpg",
    		item_id: 1919,
    		item_name: "Dörr-Automat",
    		customer_id: 33,
    		customer_name: "Phifer",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 5,
    		deposit_returned: 0,
    		last_update: 1615334400000,
    		remark: ""
    	},
    	{
    		_id: "88949f181-e8a8-5b11-b2a1-aa7234106e71",
    		rented_on: 1614816000000,
    		to_return_on: 1616025600000,
    		returned_on: 1616630400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 67,
    		customer_name: "Windridge",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1616889600000,
    		remark: ""
    	},
    	{
    		_id: "83714553a-e203-55ff-90d3-41d6f478bcee",
    		rented_on: 1614988800000,
    		to_return_on: 1615593600000,
    		returned_on: 1615593600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 2,
    		customer_name: "Heaviside",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1616284800000,
    		remark: ""
    	},
    	{
    		_id: "89c97bb5a-eeef-52a0-a45d-25a669e7369c",
    		rented_on: 1614816000000,
    		to_return_on: 1615420800000,
    		returned_on: 1616025600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 51,
    		customer_name: "Crockett",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1616630400000,
    		remark: ""
    	},
    	{
    		_id: "8b3469f5c-b07f-5823-bf74-25c62020ec50",
    		rented_on: 1616457600000,
    		to_return_on: 1617667200000,
    		returned_on: 1617062400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 85,
    		customer_name: "McCoish",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1615075200000,
    		remark: ""
    	},
    	{
    		_id: "849dd59fc-b72d-501b-b162-e4b4289539b7",
    		rented_on: 1614729600000,
    		to_return_on: 1615334400000,
    		returned_on: 1615334400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/02/15.jpg",
    		item_id: 15,
    		item_name: "Stichsäge",
    		customer_id: 84,
    		customer_name: "Taunton.",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1614556800000,
    		remark: ""
    	},
    	{
    		_id: "8b676f1ce-5e6d-5c43-bcf5-ff9e344f746b",
    		rented_on: 1615507200000,
    		to_return_on: 1616112000000,
    		returned_on: 1615507200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 55,
    		customer_name: "Gabby",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1616198400000,
    		remark: ""
    	},
    	{
    		_id: "83bfa8f4d-5654-5a72-b1a9-b2fc5ca0d26c",
    		rented_on: 1616371200000,
    		to_return_on: 1618185600000,
    		returned_on: 1617580800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 61,
    		customer_name: "Attyeo",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1615852800000,
    		remark: ""
    	},
    	{
    		_id: "8742dafcc-9ad1-50f8-b644-454a551574c0",
    		rented_on: 1615766400000,
    		to_return_on: 1617580800000,
    		returned_on: 1616976000000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 6,
    		customer_name: "Sheilds",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1614902400000,
    		remark: ""
    	},
    	{
    		_id: "97aea42e4-0d90-545b-be80-684ca1d96501",
    		rented_on: 1616198400000,
    		to_return_on: 1616803200000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 99,
    		customer_name: "Fallis",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 15,
    		deposit_returned: 0,
    		last_update: 1614729600000,
    		remark: ""
    	},
    	{
    		_id: "9229dcb25-1481-52e9-889f-6e7f1af2ff6d",
    		rented_on: 1615420800000,
    		to_return_on: 1617235200000,
    		returned_on: 1616630400000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 10,
    		customer_name: "Maceur",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1614902400000,
    		remark: ""
    	},
    	{
    		_id: "993e1c6a4-e049-5682-ac08-f839ee5eaeee",
    		rented_on: 1615766400000,
    		to_return_on: 1616371200000,
    		returned_on: 1616371200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/11/5059.jpg",
    		item_id: 5059,
    		item_name: "Kabeltrommel",
    		customer_id: 23,
    		customer_name: "Jiggins",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616544000000,
    		remark: ""
    	},
    	{
    		_id: "9a86f6124-9667-5f68-94c0-93b82d4cac18",
    		rented_on: 1616544000000,
    		to_return_on: 1618358400000,
    		returned_on: 1617753600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 32,
    		customer_name: "Cornwell",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1615248000000,
    		remark: ""
    	},
    	{
    		_id: "989020351-67c5-5a3e-84e4-86d4b6de4255",
    		rented_on: 1616889600000,
    		to_return_on: 1617494400000,
    		returned_on: 1616889600000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/10/2906.jpg",
    		item_id: 2906,
    		item_name: "Bohrmaschine",
    		customer_id: 95,
    		customer_name: "Govan",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1615766400000,
    		remark: ""
    	},
    	{
    		_id: "9d43739ce-6644-5e5b-bedf-d81225a4d2aa",
    		rented_on: 1616803200000,
    		to_return_on: 1617408000000,
    		returned_on: 1616803200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 40,
    		customer_name: "Barbrick",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 200,
    		deposit_returned: 200,
    		last_update: 1614729600000,
    		remark: ""
    	},
    	{
    		_id: "9245b89ca-a593-5b1a-a865-7d3b9101e934",
    		rented_on: 1616371200000,
    		to_return_on: 1618185600000,
    		returned_on: 1617580800000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 86,
    		customer_name: "McAnalley",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 5,
    		deposit_returned: 5,
    		last_update: 1616457600000,
    		remark: ""
    	},
    	{
    		_id: "97c59fc88-a15e-5f75-ac5e-faac5f93052e",
    		rented_on: 1615161600000,
    		to_return_on: 1616976000000,
    		returned_on: 1616371200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/03/715.jpg",
    		item_id: 715,
    		item_name: "Multi-Elektrosäge",
    		customer_id: 95,
    		customer_name: "Govan",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 10,
    		deposit_returned: 10,
    		last_update: 1616544000000,
    		remark: ""
    	},
    	{
    		_id: "9b8da7a1b-4d1a-5f39-ad30-c1fe61fd0396",
    		rented_on: 1615161600000,
    		to_return_on: 1615766400000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5002.jpg",
    		item_id: 5002,
    		item_name: "Schraubenschlüssel",
    		customer_id: 90,
    		customer_name: "Frantsev",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1616716800000,
    		remark: ""
    	},
    	{
    		_id: "9c946e17a-baee-5dd0-bdf7-caedd6f86bc4",
    		rented_on: 1615334400000,
    		to_return_on: 1617148800000,
    		returned_on: 0,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2020/05/814.jpg",
    		item_id: 830,
    		item_name: "Silikonspritze",
    		customer_id: 100,
    		customer_name: "Palluschek",
    		passing_out_employee: "ABC",
    		receiving_employee: "",
    		deposit: 200,
    		deposit_returned: 0,
    		last_update: 1614556800000,
    		remark: ""
    	},
    	{
    		_id: "1053f48fbb-5c1f-505b-8a02-be7463d9edb2",
    		rented_on: 1616803200000,
    		to_return_on: 1617408000000,
    		returned_on: 1616803200000,
    		extended_on: 0,
    		type: "rental",
    		image: "https://www.buergerstiftung-karlsruhe.de/wp-content/uploads/2019/04/5004.jpg",
    		item_id: 5004,
    		item_name: "Hammer",
    		customer_id: 77,
    		customer_name: "Spare",
    		passing_out_employee: "ABC",
    		receiving_employee: "ABC",
    		deposit: 50,
    		deposit_returned: 50,
    		last_update: 1615766400000,
    		remark: ""
    	}
    ];
    var testdata = {
    	docs: docs
    };

    var COLORS = Object.freeze({
      HIGHLIGHT_RED: "rgb(250, 45, 30)",
      HIGHLIGHT_GREEN: "rgb(131, 235, 52)",
      HIGHLIGHT_BLUE: "rgb(45, 144, 224)",
      HIGHLIGHT_YELLOW: "rgb(247, 239, 10)",

      RENTAL_RETURNED_TODAY_GREEN: "rgb(214, 252, 208)",
      RENTAL_LATE_RED: "rgb(240, 200, 200)",
      RENTAL_TO_RETURN_TODAY_BLUE: "rgb(160, 200, 250)",

      DEFAULT_ROW_BACKGROUND_ODD: "rgb(255, 255, 255)",
      DEFAULT_ROW_BACKGROUND_EVEN: "rgb(242, 242, 242)",
    });

    function saveParseTimestampToString(millis) {
      const date = new Date(millis);
      if (isNaN(date) || date.getTime() === 0) return "";
      else
        return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
      2,
      0
    )}.${date.getFullYear()}`;
    }

    function saveParseTimestampToHumanReadableString(millis) {
      const date = new Date(millis);
      let dayDiff = daysBetween(millis, millisAtStartOfToday());

      if (isNaN(date) || date.getTime() === 0) return "";
      else if (dayDiff >= -2 && dayDiff <= 2) {
        switch (dayDiff) {
          case -2:
            return "Vorgestern";
          case -1:
            return "Gestern";
          case 0:
            return "Heute";
          case 1:
            return "Morgen";
          case 2:
            return "Übermorgen";
        }
      } else if (dayDiff >= -7 && dayDiff < 0) {
        return `Vor ${Math.abs(dayDiff)} Tagen`;
      } else if (dayDiff <= 7 && dayDiff > 0) {
        return `In ${dayDiff} Tagen`;
      } else
        return `${String(date.getDate()).padStart(2, 0)}.${String(date.getMonth() + 1).padStart(
      2,
      0
    )}.${date.getFullYear()}`;
    }

    function saveParseStringToBoolean(maybeBoolean) {
      return ["true", "ja"].includes(String(maybeBoolean).toLowerCase());
    }

    function millisAtStartOfDay$1(millis) {
      var msPerDay = 86400 * 1000;
      return millis - (millis % msPerDay);
    }

    function millisAtStartOfToday() {
      return millisAtStartOfDay$1(new Date().getTime());
    }

    function daysBetween(date1, date2) {
      // The number of milliseconds in one day
      const ONE_DAY = 1000 * 60 * 60 * 24;
      // Calculate the difference in milliseconds
      const differenceMs = date1 - date2;
      // Convert back to days and return
      return Math.round(differenceMs / ONE_DAY);
    }

    var rentalColumns = [
      {
        title: "Bild",
        key: "image",
        search: "exclude",
        isImageUrl: true,
        disableSort: true,
      },
      {
        title: "Gegenstand Nr",
        key: "item_id",
        numeric: true,
        search: "from_beginning",
        display: async (value) => String(value).padStart(4, "0"),
      },
      {
        title: "Gegenstand Name",
        key: "item_name",
      },
      {
        title: "Ausgegeben",
        key: "rented_on",
        search: "exclude",
        display: async (value) => saveParseTimestampToHumanReadableString(value),
      },
      {
        title: "Verlängert",
        key: "extended_on",
        search: "exclude",
        display: async (value) => saveParseTimestampToHumanReadableString(value),
      },
      {
        title: "Zurückerwartet",
        key: "to_return_on",
        search: "exclude",
        display: async (value) => saveParseTimestampToHumanReadableString(value),
        sort: ["returned_on", "to_return_on", "customer_name"],
        initialSort: "asc",
      },
      {
        title: "Mitarbeiter",
        search: "exclude",
        key: "passing_out_employee",
      },
      {
        title: "Kunde Nr",
        key: "customer_id",
        numeric: true,
        search: "from_beginning",
      },
      {
        title: "Kunde Name",
        key: "customer_name",
      },
      {
        title: "Pfand",
        key: "deposit",
        search: "exclude",
      },
      {
        title: "Pfand zurück",
        key: "deposit_returned",
        search: "exclude",
      },
      {
        title: "Zurückgegeben",
        key: "returned_on",
        search: "exclude",
        display: async (value) => saveParseTimestampToHumanReadableString(value),
      },
      {
        title: "Mitarbeiter",
        key: "receiving_employee",
        search: "exclude",
      },
      {
        title: "Bemerkung",
        key: "remark",
        search: "exclude",
        disableSort: true,
      },
    ];

    const customerIdStartsWithSelector = (searchValue) =>
      Database.selectorBuilder()
        .withField("id")
        .numericFieldStartsWith(searchValue)
        .withDocType("customer")
        .build();

    const itemIdStartsWithAndNotDeletedSelector = (searchValue) =>
      Database.selectorBuilder()
        .withField("id")
        .numericFieldStartsWith(searchValue)
        .withDocType("item")
        .withField("status")
        .isNotEqualTo("deleted")
        .build();

    const customerAttributeStartsWithIgnoreCaseSelector = (field, searchValue) =>
      Database.selectorBuilder()
        .withField(field)
        .startsWithIgnoreCase(searchValue)
        .withDocType("customer")
        .build();

    const itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector = (field, searchValue) =>
      Database.selectorBuilder()
        .withField(field)
        .startsWithIgnoreCase(searchValue)
        .withField("status")
        .isNotEqualTo("deleted")
        .withDocType("item")
        .build();

    const activeRentalsForCustomerSelector = (customerId) =>
      Database.selectorBuilder()
        .withDocType("rental")
        .withField("customer_id")
        .equals(customerId)
        .withField("returned_on")
        .equals(0)
        .build();

    var customerColumns = [
      {
        title: "Id",
        key: "id",
        numeric: true,
        search: "from_beginning",
      },
      {
        title: "Nachname",
        key: "lastname",
      },
      {
        title: "Vorname",
        key: "firstname",
      },
      {
        title: "Straße",
        key: "street",
        search: "exclude",
      },
      {
        title: "Hausnummer",
        key: "house_number",
        search: "exclude",
        disableSort: true,
      },
      {
        title: "Postleitzahl",
        key: "postal_code",
        search: "exclude",
      },
      {
        title: "Stadt",
        key: "city",
        search: "exclude",
      },
      {
        title: "Beitritt",
        key: "registration_date",
        display: async (value) => saveParseTimestampToString(value),
        search: "exclude",
      },
      {
        title: "Verlängert am",
        key: "renewed_on",
        display: async (value) => saveParseTimestampToString(value),
        search: "exclude",
      },
      {
        title: "Bemerkung",
        key: "remark",
        search: "exclude",
        disableSort: true,
      },
      {
        title: "E-Mail",
        key: "email",
        search: "exclude",
        disableSort: true,
      },
      {
        title: "Telefonnummer",
        key: "telephone_number",
        search: "exclude",
        disableSort: true,
      },
      {
        title: "Newsletter",
        key: "subscribed_to_newsletter",
        display: async (value) => (saveParseStringToBoolean(value) ? "Ja" : "Nein"),
        search: "exclude",
      },
      {
        title: "Aufmerksam geworden",
        key: "heard",
        search: "exclude",
      },
      {
        title: "Aktive Ausleihen",
        key: "id",
        search: "exclude",
        disableSort: true,
        display: async (customer_id) => {
          let activeRentalIds = await Database.fetchAllDocsBySelector(
            activeRentalsForCustomerSelector(customer_id),
            ["_id"]
          );
          return activeRentalIds.length;
        },
      },
    ];

    var itemColumns = [
      {
        title: "Id",
        key: "id",
        numeric: true,
        display: async (value) => String(value).padStart(4, "0"),
        search: "from_beginning",
      },
      {
        title: "Bild",
        key: "image",
        isImageUrl: true,
        search: "exclude",
        disableSort: true,
      },
      {
        title: "Gegenstand",
        key: "name",
      },
      {
        title: "Marke",
        key: "brand",
      },
      {
        title: "Typbezeichnung",
        key: "itype",
      },
      {
        title: "Kategorie",
        key: "category",
        search: "exclude",
      },
      {
        title: "Pfand",
        key: "deposit",
        search: "exclude",
      },
      {
        title: "Anzahl Teile",
        key: "parts",
        search: "exclude",
      },
      {
        title: "Erfasst am",
        key: "added",
        display: async (value) => saveParseTimestampToString(value),
        search: "exclude",
      },
      {
        title: "Beschreibung",
        key: "description",
        search: "exclude",
        disableSort: true,
      },
      {
        title: "Synonyme",
        key: "synonyms",
        disableSort: true,
      },
      {
        title: "Status",
        key: "status",
        search: "exclude",
        display: async (value) => {
          if (value === "deleted") return "gelöscht";
          if (value === "instock") return "verfügbar";
          if (value === "outofstock") return "verliehen";
          if (value === "reserved") return "reserviert";
          if (value === "onbackorder") return "nicht verleihbar";
        },
      },
    ];

    class SelectorBuilder {
      constructor() {
        this.selectors = [];
        this.currentFieldName = "";
      }

      regexIgnoreCase(content) {
        return "(?i)" + content;
      }

      withField(fieldName) {
        this.currentFieldName = fieldName;
        return this;
      }

      withDocType(docType) {
        this.selectors.push({
          type: {
            $eq: docType,
          },
        });
        return this;
      }

      containsIgnoreCase(value) {
        this.selectors.push({
          [this.currentFieldName]: {
            $regex: this.regexIgnoreCase(value),
          },
        });
        return this;
      }

      startsWithIgnoreCase(value) {
        this.selectors.push({
          [this.currentFieldName]: {
            $regex: this.regexIgnoreCase("^" + value),
          },
        });
        return this;
      }

      startsWithIgnoreCaseAndLeadingZeros(value) {
        this.selectors.push({
          [this.currentFieldName]: {
            $regex: this.regexIgnoreCase("^(0+)?" + value),
          },
        });
        return this;
      }

      numericFieldStartsWith(value) {
        value = parseInt(value);
        if (value === 0) return this;

        // e.g. 12 => 120 - 129, 1200 - 1299
        const selectorsForNumbersStartingWith = (factor = 10, selectors = []) => {
          selectors.push({
            $and: [
              {
                [this.currentFieldName]: {
                  $gte: value * factor,
                },
              },
              {
                [this.currentFieldName]: {
                  $lt: value * factor + factor,
                },
              },
            ],
          });
          if (value * factor * 10 > 10000) {
            return selectors;
          } else {
            return selectorsForNumbersStartingWith(factor * 10, selectors);
          }
        };
        this.selectors.push({
          $or: [
            {
              [this.currentFieldName]: {
                $eq: value,
              },
            },
            ...selectorsForNumbersStartingWith(),
          ],
        });
        return this;
      }

      equals(value) {
        this.selectors.push({
          [this.currentFieldName]: {
            $eq: value,
          },
        });
        return this;
      }

      isNotEqualTo(value) {
        this.selectors.push({
          [this.currentFieldName]: {
            $ne: value,
          },
        });
        return this;
      }

      searchTerm(searchTerm, columns) {
        const formattedSearchTerm = searchTerm.toLowerCase();
        const searchTermWords = formattedSearchTerm
          .split(" ")
          .map((searchTerm) => searchTerm.trim())
          .filter((searchTerm) => searchTerm !== "");

        // e.g. 12 => 120 - 129, 1200 - 1299
        const selectorsForNumbersStartingWith = (searchWord, column, factor = 10, selectors = []) => {
          const number = Math.abs(parseInt(searchWord, 10));
          if (number === 0) {
            // 000 -> 0001 - 0009
            // 00 -> 0010 - 0099
            // 0 -> 0001 - 0009
            return [
              {
                $and: [
                  {
                    [column.key]: {
                      $gte: 1000 / Math.pow(10, searchWord.length),
                    },
                  },
                  {
                    [column.key]: {
                      $lt: 1000 / Math.pow(10, searchWord.length - 1),
                    },
                  },
                ],
              },
            ];
          } else {
            selectors.push({
              $and: [
                {
                  [column.key]: {
                    $gte: number * factor,
                  },
                },
                {
                  [column.key]: {
                    $lt: number * factor + factor,
                  },
                },
              ],
            });
          }
          if (number * factor * 10 > 10000) {
            return selectors;
          } else {
            return selectorsForNumbersStartingWith(searchWord, column, factor * 10, selectors);
          }
        };

        const selectorsForSearchWord = (searchWord) => {
          if (!isNaN(searchWord)) {
            // is number
            let selectors = [];
            columnsToSearch(true).forEach((column) => {
              selectors.push({
                [column.key]: {
                  $eq: parseInt(searchWord, 10),
                },
              });
              selectors = [...selectors, ...selectorsForNumbersStartingWith(searchWord, column)];
            });
            return selectors;
          } else {
            // is not a number
            return columnsToSearch(false).map((column) => ({
              [column.key]: {
                $regex: "(?i)" + (column?.search === "from_beginning" ? "^(0+?)?" : "") + searchWord,
              },
            }));
          }
        };

        const columnsToSearch = (numericSearchTerm = false) =>
          columns
            .filter(
              (column) =>
                (!numericSearchTerm && !column.numeric) || (numericSearchTerm && column.numeric)
            )
            .filter((column) => !column.search || column.search !== "exclude");

        this.selectors = [
          {
            $and: searchTermWords.map((searchTermWord) => ({
              $or: selectorsForSearchWord(searchTermWord),
            })),
          },
        ];
        return this;
      }

      build() {
        if (this.selectors.length == 1) {
          return this.selectors[0];
        } else {
          return {
            $and: this.selectors,
          };
        }
      }
    }

    const COLUMNS = {
      customer: customerColumns,
      item: itemColumns,
      rental: rentalColumns,
    };

    class MockDatabase {
      constructor() {
        {
          this.data = testdata.docs;
        }
        this.writeData(this.data);
      }

      async connect() {}

      matchesSelector(doc, selector) {
        for (const [selectorKey, selectorObj] of Object.entries(selector)) {
          if (!selector.hasOwnProperty(selectorKey)) {
            continue;
          }
          if (selectorKey === "$or") {
            return selectorObj.some((innerSelector) => this.matchesSelector(doc, innerSelector));
          } else if (selectorKey === "$and") {
            return selectorObj.every((innerSelector) => this.matchesSelector(doc, innerSelector));
          } else {
            let comparator = Object.keys(selectorObj)[0];
            let value = doc[selectorKey];
            let compareToValue = selectorObj[comparator];

            if (comparator === "$eq") {
              return value === compareToValue;
            } else if (comparator === "$ne") {
              return value !== compareToValue;
            } else if (comparator === "$gte") {
              return value >= compareToValue;
            } else if (comparator === "$gt") {
              return value > compareToValue;
            } else if (comparator === "$lte") {
              return value <= compareToValue;
            } else if (comparator === "$lt") {
              return value < compareToValue;
            } else if (comparator === "$exists") {
              return (typeof value !== "undefined") === compareToValue;
            } else if (comparator === "$regex") {
              if (compareToValue.startsWith("(?i)")) {
                compareToValue = new RegExp(compareToValue.replaceAll("(?i)", ""), "i");
              }
              return value && value.match(compareToValue);
            } else {
              console.warn("unknown comparator: " + comparator);
              return false;
            }
          }
        }
      }

      async fetchItemById(id) {
        let docs = this.getData().filter((doc) => doc.type === "item" && doc.id === id);
        return docs.length > 0 ? docs[0] : {};
      }

      async itemWithIdExists(id) {
        let docs = this.getData().filter((doc) => doc.type === "item" && doc.id === id);
        return docs.length > 0;
      }

      async fetchCustomerById(id) {
        let docs = this.getData().filter((doc) => doc.type === "customer" && doc.id === id);
        return docs.length > 0 ? docs[0] : {};
      }

      async fetchRentalByItemAndCustomerIds(itemId, customerId) {
        let docs = this.getData().filter(
          (doc) => doc.type === "rental" && doc.item_id === itemId && doc.customer_id === customerId
        );
        return docs.length > 0 ? docs[0] : {};
      }

      async query(options) {
        let { filters, sortBy, sortReverse, rowsPerPage, currentPage, searchTerm, docType } = options;

        let columns = COLUMNS[docType];

        let selectors = filters.flatMap((filter) => filter.selectors);
        selectors.push({
          type: {
            $eq: docType,
          },
        });

        // filter
        let dataMatchingFilter = this.getData().filter((doc) =>
          this.matchesSelector(doc, { $and: selectors })
        );
        searchTerm = searchTerm.trim().toLowerCase();
        if (searchTerm.length > 0) {
          dataMatchingFilter = dataMatchingFilter.filter((doc) =>
            searchTerm.split(" ").every((searchWord) =>
              Object.entries(doc)
                .filter(([key, value]) => columns.find((col) => col.key === key))
                .filter(([key, value]) => columns.find((col) => col.key === key).search !== "exclude")
                .filter(
                  ([key, value]) =>
                    (columns.find((col) => col.key === key).numeric && !isNaN(searchWord)) ||
                    (!columns.find((col) => col.key === key).numeric && isNaN(searchWord))
                )
                .some(([key, value]) => String(doc[key]).toLowerCase().includes(searchWord))
            )
          );
        }

        // sort
        let sortedData = dataMatchingFilter.sort(function (a, b) {
          let i = 0;
          let result = 0;
          while (i < sortBy.length && result === 0) {
            result = a[sortBy[i]] < b[sortBy[i]] ? -1 : a[sortBy[i]] > b[sortBy[i]] ? 1 : 0;
            i++;
          }
          if (sortReverse) {
            result *= -1;
          }
          return result;
        });

        // paginate
        let paginatedData = sortedData.slice(
          rowsPerPage * currentPage,
          rowsPerPage * currentPage + rowsPerPage
        );

        return { docs: paginatedData, count: Promise.resolve(dataMatchingFilter.length) };
      }

      async updateDoc(updatedDoc) {
        await this.removeDoc(updatedDoc);
        await this.createDoc(updatedDoc);
      }

      async removeDoc(docToRemove) {
        this.writeData(this.getData().filter((doc) => doc._id !== docToRemove._id));
      }

      async createDoc(doc) {
        const makeId = () => {
          var result = "";
          var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
          var charactersLength = characters.length;
          for (var i = 0; i < 10; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
          }
          return result;
        };

        if (!doc.hasOwnProperty("_id")) {
          doc["_id"] = makeId();
        }
        this.writeData([...this.getData(), doc]);
      }

      async nextUnusedId(docType) {
        let usedIds = this.getData()
          .filter((doc) => doc.type === docType)
          .map((doc) => doc.id);
        return Math.max(...usedIds) + 1;
      }

      async fetchDocsBySelector(selector, fields) {
        return this.getData()
          .filter((doc) => this.matchesSelector(doc, selector))
          .map((doc) => {
            let docWithFields = {};
            fields.forEach((field) => (docWithFields[field] = doc[field]));
            return docWithFields;
          });
      }

      async fetchUniqueCustomerFieldValues(field, startsWith, isNumeric = false) {
        let customers = this.getData().filter(
          (doc) =>
            doc.type === "customer" && doc[field] && String(doc[field]).startsWith(String(startsWith))
        );
        const uniqueValues = new Set();
        customers.forEach((customer) => {
          uniqueValues.add(customer[field]);
        });
        return Array.from(uniqueValues).map((uniqueValue) => ({ [field]: uniqueValue }));
      }

      fetchAllDocsBySelector(selector, fields) {
        return this.fetchDocsBySelector(selector, fields);
      }

      getData() {
        if (localStorage.hasOwnProperty("data")) {
          return JSON.parse(localStorage.getItem("data"));
        } else {
          return [];
        }
      }

      writeData(data) {
        localStorage.setItem("data", JSON.stringify(data));
      }

      selectorBuilder() {
        return new SelectorBuilder();
      }
    }

    var Database = new MockDatabase();

    /* src/components/TableEditors/TableToCSVExporter.svelte generated by Svelte v3.38.2 */
    const delimiter = ";";

    function instance$H($$self, $$props, $$invalidate) {
    	let itemType;
    	let $location;
    	component_subscribe($$self, location$1, $$value => $$invalidate(1, $location = $$value));

    	const columns = {
    		rental: rentalColumns,
    		item: itemColumns,
    		customer: customerColumns
    	};

    	const filenames = {
    		rental: "Leihvorgaenge",
    		item: "Gegenstaende",
    		customer: "Kunden"
    	};

    	function fetchItems() {
    		return Database.fetchAllDocsBySelector(Database.selectorBuilder().withDocType(itemType).build());
    	}

    	function convertToCSV(items) {
    		const validKeys = columns[itemType].map(col => col.key);
    		const colByKey = key => columns[itemType].find(col => col.key === key);
    		let csvString = columns[itemType].map(col => col.title).join(delimiter) + "\r\n";

    		items.forEach(item => {
    			let csvValues = [];

    			for (const validKey of validKeys) {
    				let value = item.hasOwnProperty(validKey) ? item[validKey] : "";

    				// format value for display
    				if (colByKey(validKey).display) {
    					value = colByKey(validKey).display(value);
    				}

    				// remove csv delimiters and line breaks from data
    				value = String(value).replaceAll(delimiter, "");

    				value = String(value).replaceAll("\r", " ");
    				value = String(value).replaceAll("\n", " ");
    				value = String(value).replaceAll("  ", " ");
    				csvValues.push(value);
    			}

    			csvString += csvValues.join(delimiter) + "\r\n";
    		});

    		return csvString;
    	}

    	const exportCSVFile = async () => {
    		const items = await fetchItems();
    		var csv = convertToCSV(items);
    		var exportedFilenmae = `${filenames[itemType]}.csv`;
    		var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    		var link = document.createElement("a");

    		if (link.download !== undefined) {
    			// feature detection
    			// Browsers that support HTML5 download attribute
    			var url = URL.createObjectURL(blob);

    			link.setAttribute("href", url);
    			link.setAttribute("download", exportedFilenmae);
    			link.style.visibility = "hidden";
    			document.body.appendChild(link);
    			link.click();
    			document.body.removeChild(link);
    		} else {
    			alert("Die Export-Funktion wird von diesem Browser nicht untersützt :(");
    		}
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$location*/ 2) {
    			// rental, item or customer
    			itemType = $location.split("/")[1].slice(0, -1);
    		}
    	};

    	return [exportCSVFile, $location];
    }

    class TableToCSVExporter extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$H, null, safe_not_equal, { exportCSVFile: 0 });
    	}

    	get exportCSVFile() {
    		return this.$$.ctx[0];
    	}
    }

    /** Dispatch event on click outside of node */
    function clickOutside(node) {
      const handleClick = (event) => {
        if (node && !node.contains(event.target) && !event.defaultPrevented) {
          node.dispatchEvent(new CustomEvent("click_outside", node));
        }
      };

      document.addEventListener("click", handleClick, true);

      return {
        destroy() {
          document.removeEventListener("click", handleClick, true);
        },
      };
    }

    /* src/components/Layout/DropDownMenu.svelte generated by Svelte v3.38.2 */

    function get_each_context$g(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (23:6) {#each menuItems as menuItem}
    function create_each_block$g(ctx) {
    	let li;
    	let t0_value = /*menuItem*/ ctx[6].title + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[4](/*menuItem*/ ctx[6]);
    	}

    	return {
    		c() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(li, "class", "svelte-6wx36t");
    		},
    		m(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);

    			if (!mounted) {
    				dispose = listen(li, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*menuItems*/ 1 && t0_value !== (t0_value = /*menuItem*/ ctx[6].title + "")) set_data(t0, t0_value);
    		},
    		d(detaching) {
    			if (detaching) detach(li);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$H(ctx) {
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let ul;
    	let mounted;
    	let dispose;
    	let each_value = /*menuItems*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$g(get_each_context$g(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="svelte-6wx36t"><path fill="currentColor" d="M12 18c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3zm0-9c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z"></path></svg>`;
    			t = space();
    			div1 = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div0, "class", "dropbtn svelte-6wx36t");
    			attr(ul, "class", "svelte-6wx36t");
    			set_style(div1, "--max-height", /*show*/ ctx[1] ? `${/*maxHeightPx*/ ctx[2]}px` : "0");
    			attr(div1, "class", "dropdown-content svelte-6wx36t");
    			attr(div2, "class", "dropdown svelte-6wx36t");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div0);
    			append(div2, t);
    			append(div2, div1);
    			append(div1, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", /*click_handler*/ ctx[3]),
    					action_destroyer(clickOutside.call(null, div2)),
    					listen(div2, "click_outside", /*click_outside_handler*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*show, menuItems*/ 3) {
    				each_value = /*menuItems*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$g(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$g(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*show*/ 2) {
    				set_style(div1, "--max-height", /*show*/ ctx[1] ? `${/*maxHeightPx*/ ctx[2]}px` : "0");
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$G($$self, $$props, $$invalidate) {
    	let { menuItems = [] } = $$props;
    	let show = false;

    	// animation does not work with auto height
    	let maxHeightPx = menuItems.length * 45;

    	const click_handler = () => $$invalidate(1, show = !show);

    	const click_handler_1 = menuItem => {
    		$$invalidate(1, show = false);
    		menuItem.onClick();
    	};

    	const click_outside_handler = () => $$invalidate(1, show = false);

    	$$self.$$set = $$props => {
    		if ("menuItems" in $$props) $$invalidate(0, menuItems = $$props.menuItems);
    	};

    	return [
    		menuItems,
    		show,
    		maxHeightPx,
    		click_handler,
    		click_handler_1,
    		click_outside_handler
    	];
    }

    class DropDownMenu extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$G, create_fragment$H, safe_not_equal, { menuItems: 0 });
    	}
    }

    /* src/components/Layout/Navbar.svelte generated by Svelte v3.38.2 */

    function create_fragment$G(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t1;
    	let li1;
    	let a1;
    	let t3;
    	let li2;
    	let a2;
    	let t5;
    	let li3;
    	let tabletocsvexporter;
    	let t6;
    	let dropdownmenu;
    	let current;
    	let mounted;
    	let dispose;
    	let tabletocsvexporter_props = {};
    	tabletocsvexporter = new TableToCSVExporter({ props: tabletocsvexporter_props });
    	/*tabletocsvexporter_binding*/ ctx[1](tabletocsvexporter);

    	dropdownmenu = new DropDownMenu({
    			props: {
    				menuItems: [
    					{
    						title: "Tabelle -> CSV",
    						onClick: /*func*/ ctx[2]
    					},
    					{
    						title: "Logs",
    						onClick: /*func_1*/ ctx[3]
    					},
    					{
    						title: "Einstellungen",
    						onClick: /*func_2*/ ctx[4]
    					}
    				]
    			}
    		});

    	return {
    		c() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Kunden";
    			t1 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Gegenstände";
    			t3 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Leihvorgänge";
    			t5 = space();
    			li3 = element("li");
    			create_component(tabletocsvexporter.$$.fragment);
    			t6 = space();
    			create_component(dropdownmenu.$$.fragment);
    			attr(a0, "href", "/customers");
    			attr(a0, "class", "svelte-1vkq20m");
    			attr(li0, "class", "left svelte-1vkq20m");
    			attr(a1, "href", "/items");
    			attr(a1, "class", "svelte-1vkq20m");
    			attr(li1, "class", "left svelte-1vkq20m");
    			attr(a2, "href", "/rentals");
    			attr(a2, "class", "svelte-1vkq20m");
    			attr(li2, "class", "left svelte-1vkq20m");
    			attr(li3, "class", "right svelte-1vkq20m");
    			attr(ul, "class", "svelte-1vkq20m");
    			attr(nav, "class", "svelte-1vkq20m");
    		},
    		m(target, anchor) {
    			insert(target, nav, anchor);
    			append(nav, ul);
    			append(ul, li0);
    			append(li0, a0);
    			append(ul, t1);
    			append(ul, li1);
    			append(li1, a1);
    			append(ul, t3);
    			append(ul, li2);
    			append(li2, a2);
    			append(ul, t5);
    			append(ul, li3);
    			mount_component(tabletocsvexporter, li3, null);
    			append(li3, t6);
    			mount_component(dropdownmenu, li3, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(active.call(null, a0, "/customers")),
    					action_destroyer(link.call(null, a0)),
    					action_destroyer(active.call(null, a1, "/items")),
    					action_destroyer(link.call(null, a1)),
    					action_destroyer(active.call(null, a2, "/rentals")),
    					action_destroyer(link.call(null, a2))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			const tabletocsvexporter_changes = {};
    			tabletocsvexporter.$set(tabletocsvexporter_changes);
    			const dropdownmenu_changes = {};

    			if (dirty & /*tableToCSVExporterRef*/ 1) dropdownmenu_changes.menuItems = [
    				{
    					title: "Tabelle -> CSV",
    					onClick: /*func*/ ctx[2]
    				},
    				{
    					title: "Logs",
    					onClick: /*func_1*/ ctx[3]
    				},
    				{
    					title: "Einstellungen",
    					onClick: /*func_2*/ ctx[4]
    				}
    			];

    			dropdownmenu.$set(dropdownmenu_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(tabletocsvexporter.$$.fragment, local);
    			transition_in(dropdownmenu.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(tabletocsvexporter.$$.fragment, local);
    			transition_out(dropdownmenu.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(nav);
    			/*tabletocsvexporter_binding*/ ctx[1](null);
    			destroy_component(tabletocsvexporter);
    			destroy_component(dropdownmenu);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$F($$self, $$props, $$invalidate) {
    	let tableToCSVExporterRef;

    	function tabletocsvexporter_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			tableToCSVExporterRef = $$value;
    			$$invalidate(0, tableToCSVExporterRef);
    		});
    	}

    	const func = () => tableToCSVExporterRef.exportCSVFile();
    	const func_1 = () => replace("/logs");
    	const func_2 = () => replace("/settings");
    	return [tableToCSVExporterRef, tabletocsvexporter_binding, func, func_1, func_2];
    }

    class Navbar extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$F, create_fragment$G, safe_not_equal, {});
    	}
    }

    /* src/components/Input/AddNewItemButton.svelte generated by Svelte v3.38.2 */

    function create_fragment$F(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			button.textContent = "+";
    			attr(button, "class", "svelte-77khtx");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler*/ ctx[0]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$E($$self) {
    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	return [click_handler];
    }

    class AddNewItemButton extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$E, create_fragment$F, safe_not_equal, {});
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function sineInOut(t) {
        return -0.5 * (Math.cos(Math.PI * t) - 1);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    const durationUnitRegex = /[a-zA-Z]/;
    const range = (size, startAt = 0) => [...Array(size).keys()].map(i => i + startAt);
    // export const characterRange = (startChar, endChar) =>
    //   String.fromCharCode(
    //     ...range(
    //       endChar.charCodeAt(0) - startChar.charCodeAt(0),
    //       startChar.charCodeAt(0)
    //     )
    //   );
    // export const zip = (arr, ...arrs) =>
    //   arr.map((val, i) => arrs.reduce((list, curr) => [...list, curr[i]], [val]));

    /* node_modules/svelte-loading-spinners/dist/Pulse.svelte generated by Svelte v3.38.2 */

    function get_each_context$f(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (45:2) {#each range(3, 0) as version}
    function create_each_block$f(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "cube svelte-446r86");
    			set_style(div, "animation-delay", /*version*/ ctx[6] * (+/*durationNum*/ ctx[5] / 10) + /*durationUnit*/ ctx[4]);
    			set_style(div, "left", /*version*/ ctx[6] * (+/*size*/ ctx[3] / 3 + +/*size*/ ctx[3] / 15) + /*unit*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "left", /*version*/ ctx[6] * (+/*size*/ ctx[3] / 3 + +/*size*/ ctx[3] / 15) + /*unit*/ ctx[1]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$E(ctx) {
    	let div;
    	let each_value = range(3, 0);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$f(get_each_context$f(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "wrapper svelte-446r86");
    			set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(div, "--color", /*color*/ ctx[0]);
    			set_style(div, "--duration", /*duration*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*range, durationNum, durationUnit, size, unit*/ 58) {
    				each_value = range(3, 0);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$f(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$f(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*size, unit*/ 10) {
    				set_style(div, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(div, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(div, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$D($$self, $$props, $$invalidate) {
    	
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.5s" } = $$props;
    	let { size = "60" } = $$props;
    	let durationUnit = duration.match(durationUnitRegex)[0];
    	let durationNum = duration.replace(durationUnitRegex, "");

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    	};

    	return [color, unit, duration, size, durationUnit, durationNum];
    }

    class Pulse extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$D, create_fragment$E, safe_not_equal, { color: 0, unit: 1, duration: 2, size: 3 });
    	}
    }

    /* node_modules/svelte-loading-spinners/dist/Diamonds.svelte generated by Svelte v3.38.2 */

    function create_fragment$D(ctx) {
    	let span;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;

    	return {
    		c() {
    			span = element("span");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			attr(div0, "class", "svelte-1f3hinu");
    			attr(div1, "class", "svelte-1f3hinu");
    			attr(div2, "class", "svelte-1f3hinu");
    			set_style(span, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			set_style(span, "--color", /*color*/ ctx[0]);
    			set_style(span, "--duration", /*duration*/ ctx[2]);
    			attr(span, "class", "svelte-1f3hinu");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, div0);
    			append(span, t0);
    			append(span, div1);
    			append(span, t1);
    			append(span, div2);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*size, unit*/ 10) {
    				set_style(span, "--size", /*size*/ ctx[3] + /*unit*/ ctx[1]);
    			}

    			if (dirty & /*color*/ 1) {
    				set_style(span, "--color", /*color*/ ctx[0]);
    			}

    			if (dirty & /*duration*/ 4) {
    				set_style(span, "--duration", /*duration*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function instance$C($$self, $$props, $$invalidate) {
    	
    	let { color = "#FF3E00" } = $$props;
    	let { unit = "px" } = $$props;
    	let { duration = "1.5s" } = $$props;
    	let { size = "60" } = $$props;

    	$$self.$$set = $$props => {
    		if ("color" in $$props) $$invalidate(0, color = $$props.color);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("duration" in $$props) $$invalidate(2, duration = $$props.duration);
    		if ("size" in $$props) $$invalidate(3, size = $$props.size);
    	};

    	return [color, unit, duration, size];
    }

    class Diamonds extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$C, create_fragment$D, safe_not_equal, { color: 0, unit: 1, duration: 2, size: 3 });
    	}
    }

    /* src/components/LoadingAnimation.svelte generated by Svelte v3.38.2 */

    function create_fragment$C(ctx) {
    	let div;
    	let pulse;
    	let div_intro;
    	let current;

    	pulse = new Pulse({
    			props: {
    				size: "120",
    				color: "#fc03a9",
    				unit: "px"
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			create_component(pulse.$$.fragment);
    			attr(div, "class", "svelte-17er37p");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(pulse, div, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(pulse.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, { duration: 800 });
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o(local) {
    			transition_out(pulse.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(pulse);
    		}
    	};
    }

    class LoadingAnimation extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$C, safe_not_equal, {});
    	}
    }

    /* node_modules/svelte-select/src/Item.svelte generated by Svelte v3.38.2 */

    function create_fragment$B(ctx) {
    	let div;
    	let raw_value = /*getOptionLabel*/ ctx[0](/*item*/ ctx[1], /*filterText*/ ctx[2]) + "";
    	let div_class_value;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", div_class_value = "item " + /*itemClasses*/ ctx[3] + " svelte-bdnybl");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*getOptionLabel, item, filterText*/ 7 && raw_value !== (raw_value = /*getOptionLabel*/ ctx[0](/*item*/ ctx[1], /*filterText*/ ctx[2]) + "")) div.innerHTML = raw_value;
    			if (dirty & /*itemClasses*/ 8 && div_class_value !== (div_class_value = "item " + /*itemClasses*/ ctx[3] + " svelte-bdnybl")) {
    				attr(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$B($$self, $$props, $$invalidate) {
    	let { isActive = false } = $$props;
    	let { isFirst = false } = $$props;
    	let { isHover = false } = $$props;
    	let { getOptionLabel = undefined } = $$props;
    	let { item = undefined } = $$props;
    	let { filterText = "" } = $$props;
    	let itemClasses = "";

    	$$self.$$set = $$props => {
    		if ("isActive" in $$props) $$invalidate(4, isActive = $$props.isActive);
    		if ("isFirst" in $$props) $$invalidate(5, isFirst = $$props.isFirst);
    		if ("isHover" in $$props) $$invalidate(6, isHover = $$props.isHover);
    		if ("getOptionLabel" in $$props) $$invalidate(0, getOptionLabel = $$props.getOptionLabel);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("filterText" in $$props) $$invalidate(2, filterText = $$props.filterText);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*isActive, isFirst, isHover, item*/ 114) {
    			{
    				const classes = [];

    				if (isActive) {
    					classes.push("active");
    				}

    				if (isFirst) {
    					classes.push("first");
    				}

    				if (isHover) {
    					classes.push("hover");
    				}

    				if (item.isGroupHeader) {
    					classes.push("groupHeader");
    				}

    				if (item.isGroupItem) {
    					classes.push("groupItem");
    				}

    				$$invalidate(3, itemClasses = classes.join(" "));
    			}
    		}
    	};

    	return [getOptionLabel, item, filterText, itemClasses, isActive, isFirst, isHover];
    }

    class Item extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$B, create_fragment$B, safe_not_equal, {
    			isActive: 4,
    			isFirst: 5,
    			isHover: 6,
    			getOptionLabel: 0,
    			item: 1,
    			filterText: 2
    		});
    	}
    }

    /* node_modules/svelte-select/src/VirtualList.svelte generated by Svelte v3.38.2 */

    function get_each_context$e(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	return child_ctx;
    }

    const get_default_slot_changes$1 = dirty => ({
    	item: dirty & /*visible*/ 32,
    	i: dirty & /*visible*/ 32,
    	hoverItemIndex: dirty & /*hoverItemIndex*/ 2
    });

    const get_default_slot_context$1 = ctx => ({
    	item: /*row*/ ctx[23].data,
    	i: /*row*/ ctx[23].index,
    	hoverItemIndex: /*hoverItemIndex*/ ctx[1]
    });

    // (160:57) Missing template
    function fallback_block$2(ctx) {
    	let t;

    	return {
    		c() {
    			t = text("Missing template");
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (158:2) {#each visible as row (row.index)}
    function create_each_block$e(key_1, ctx) {
    	let svelte_virtual_list_row;
    	let t;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], get_default_slot_context$1);
    	const default_slot_or_fallback = default_slot || fallback_block$2();

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			svelte_virtual_list_row = element("svelte-virtual-list-row");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			t = space();
    			set_custom_element_data(svelte_virtual_list_row, "class", "svelte-p6ehlv");
    			this.first = svelte_virtual_list_row;
    		},
    		m(target, anchor) {
    			insert(target, svelte_virtual_list_row, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(svelte_virtual_list_row, null);
    			}

    			append(svelte_virtual_list_row, t);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, visible, hoverItemIndex*/ 16418)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, get_default_slot_changes$1, get_default_slot_context$1);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(svelte_virtual_list_row);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};
    }

    function create_fragment$A(ctx) {
    	let svelte_virtual_list_viewport;
    	let svelte_virtual_list_contents;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let svelte_virtual_list_viewport_resize_listener;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*visible*/ ctx[5];
    	const get_key = ctx => /*row*/ ctx[23].index;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$e(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$e(key, child_ctx));
    	}

    	return {
    		c() {
    			svelte_virtual_list_viewport = element("svelte-virtual-list-viewport");
    			svelte_virtual_list_contents = element("svelte-virtual-list-contents");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(svelte_virtual_list_contents, "padding-top", /*top*/ ctx[6] + "px");
    			set_style(svelte_virtual_list_contents, "padding-bottom", /*bottom*/ ctx[7] + "px");
    			set_custom_element_data(svelte_virtual_list_contents, "class", "svelte-p6ehlv");
    			set_style(svelte_virtual_list_viewport, "height", /*height*/ ctx[0]);
    			set_custom_element_data(svelte_virtual_list_viewport, "class", "svelte-p6ehlv");
    			add_render_callback(() => /*svelte_virtual_list_viewport_elementresize_handler*/ ctx[18].call(svelte_virtual_list_viewport));
    		},
    		m(target, anchor) {
    			insert(target, svelte_virtual_list_viewport, anchor);
    			append(svelte_virtual_list_viewport, svelte_virtual_list_contents);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(svelte_virtual_list_contents, null);
    			}

    			/*svelte_virtual_list_contents_binding*/ ctx[16](svelte_virtual_list_contents);
    			/*svelte_virtual_list_viewport_binding*/ ctx[17](svelte_virtual_list_viewport);
    			svelte_virtual_list_viewport_resize_listener = add_resize_listener(svelte_virtual_list_viewport, /*svelte_virtual_list_viewport_elementresize_handler*/ ctx[18].bind(svelte_virtual_list_viewport));
    			current = true;

    			if (!mounted) {
    				dispose = listen(svelte_virtual_list_viewport, "scroll", /*handle_scroll*/ ctx[8]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$$scope, visible, hoverItemIndex*/ 16418) {
    				each_value = /*visible*/ ctx[5];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, svelte_virtual_list_contents, outro_and_destroy_block, create_each_block$e, null, get_each_context$e);
    				check_outros();
    			}

    			if (!current || dirty & /*top*/ 64) {
    				set_style(svelte_virtual_list_contents, "padding-top", /*top*/ ctx[6] + "px");
    			}

    			if (!current || dirty & /*bottom*/ 128) {
    				set_style(svelte_virtual_list_contents, "padding-bottom", /*bottom*/ ctx[7] + "px");
    			}

    			if (!current || dirty & /*height*/ 1) {
    				set_style(svelte_virtual_list_viewport, "height", /*height*/ ctx[0]);
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(svelte_virtual_list_viewport);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			/*svelte_virtual_list_contents_binding*/ ctx[16](null);
    			/*svelte_virtual_list_viewport_binding*/ ctx[17](null);
    			svelte_virtual_list_viewport_resize_listener();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$A($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { items = undefined } = $$props;
    	let { height = "100%" } = $$props;
    	let { itemHeight = 40 } = $$props;
    	let { hoverItemIndex = 0 } = $$props;
    	let { start = 0 } = $$props;
    	let { end = 0 } = $$props;

    	// local state
    	let height_map = [];

    	let rows;
    	let viewport;
    	let contents;
    	let viewport_height = 0;
    	let visible;
    	let mounted;
    	let top = 0;
    	let bottom = 0;
    	let average_height;

    	async function refresh(items, viewport_height, itemHeight) {
    		const { scrollTop } = viewport;
    		await tick(); // wait until the DOM is up to date
    		let content_height = top - scrollTop;
    		let i = start;

    		while (content_height < viewport_height && i < items.length) {
    			let row = rows[i - start];

    			if (!row) {
    				$$invalidate(10, end = i + 1);
    				await tick(); // render the newly visible row
    				row = rows[i - start];
    			}

    			const row_height = height_map[i] = itemHeight || row.offsetHeight;
    			content_height += row_height;
    			i += 1;
    		}

    		$$invalidate(10, end = i);
    		const remaining = items.length - end;
    		average_height = (top + content_height) / end;
    		$$invalidate(7, bottom = remaining * average_height);
    		height_map.length = items.length;
    		$$invalidate(3, viewport.scrollTop = 0, viewport);
    	}

    	async function handle_scroll() {
    		const { scrollTop } = viewport;
    		const old_start = start;

    		for (let v = 0; v < rows.length; v += 1) {
    			height_map[start + v] = itemHeight || rows[v].offsetHeight;
    		}

    		let i = 0;
    		let y = 0;

    		while (i < items.length) {
    			const row_height = height_map[i] || average_height;

    			if (y + row_height > scrollTop) {
    				$$invalidate(9, start = i);
    				$$invalidate(6, top = y);
    				break;
    			}

    			y += row_height;
    			i += 1;
    		}

    		while (i < items.length) {
    			y += height_map[i] || average_height;
    			i += 1;
    			if (y > scrollTop + viewport_height) break;
    		}

    		$$invalidate(10, end = i);
    		const remaining = items.length - end;
    		average_height = y / end;
    		while (i < items.length) height_map[i++] = average_height;
    		$$invalidate(7, bottom = remaining * average_height);

    		// prevent jumping if we scrolled up into unknown territory
    		if (start < old_start) {
    			await tick();
    			let expected_height = 0;
    			let actual_height = 0;

    			for (let i = start; i < old_start; i += 1) {
    				if (rows[i - start]) {
    					expected_height += height_map[i];
    					actual_height += itemHeight || rows[i - start].offsetHeight;
    				}
    			}

    			const d = actual_height - expected_height;
    			viewport.scrollTo(0, scrollTop + d);
    		}
    	} // TODO if we overestimated the space these
    	// rows would occupy we may need to add some

    	// more. maybe we can just call handle_scroll again?
    	// trigger initial refresh
    	onMount(() => {
    		rows = contents.getElementsByTagName("svelte-virtual-list-row");
    		$$invalidate(13, mounted = true);
    	});

    	function svelte_virtual_list_contents_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contents = $$value;
    			$$invalidate(4, contents);
    		});
    	}

    	function svelte_virtual_list_viewport_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			viewport = $$value;
    			$$invalidate(3, viewport);
    		});
    	}

    	function svelte_virtual_list_viewport_elementresize_handler() {
    		viewport_height = this.offsetHeight;
    		$$invalidate(2, viewport_height);
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(11, items = $$props.items);
    		if ("height" in $$props) $$invalidate(0, height = $$props.height);
    		if ("itemHeight" in $$props) $$invalidate(12, itemHeight = $$props.itemHeight);
    		if ("hoverItemIndex" in $$props) $$invalidate(1, hoverItemIndex = $$props.hoverItemIndex);
    		if ("start" in $$props) $$invalidate(9, start = $$props.start);
    		if ("end" in $$props) $$invalidate(10, end = $$props.end);
    		if ("$$scope" in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*items, start, end*/ 3584) {
    			$$invalidate(5, visible = items.slice(start, end).map((data, i) => {
    				return { index: i + start, data };
    			}));
    		}

    		if ($$self.$$.dirty & /*mounted, items, viewport_height, itemHeight*/ 14340) {
    			// whenever `items` changes, invalidate the current heightmap
    			if (mounted) refresh(items, viewport_height, itemHeight);
    		}
    	};

    	return [
    		height,
    		hoverItemIndex,
    		viewport_height,
    		viewport,
    		contents,
    		visible,
    		top,
    		bottom,
    		handle_scroll,
    		start,
    		end,
    		items,
    		itemHeight,
    		mounted,
    		$$scope,
    		slots,
    		svelte_virtual_list_contents_binding,
    		svelte_virtual_list_viewport_binding,
    		svelte_virtual_list_viewport_elementresize_handler
    	];
    }

    class VirtualList extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$A, create_fragment$A, safe_not_equal, {
    			items: 11,
    			height: 0,
    			itemHeight: 12,
    			hoverItemIndex: 1,
    			start: 9,
    			end: 10
    		});
    	}
    }

    /* node_modules/svelte-select/src/List.svelte generated by Svelte v3.38.2 */

    function get_each_context$d(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[34] = list[i];
    	child_ctx[36] = i;
    	return child_ctx;
    }

    // (210:0) {#if isVirtualList}
    function create_if_block_3$3(ctx) {
    	let div;
    	let virtuallist;
    	let current;

    	virtuallist = new VirtualList({
    			props: {
    				items: /*items*/ ctx[4],
    				itemHeight: /*itemHeight*/ ctx[7],
    				$$slots: {
    					default: [
    						create_default_slot$4,
    						({ item, i }) => ({ 34: item, 36: i }),
    						({ item, i }) => [0, (item ? 8 : 0) | (i ? 32 : 0)]
    					]
    				},
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			div = element("div");
    			create_component(virtuallist.$$.fragment);
    			attr(div, "class", "listContainer virtualList svelte-ux0sbr");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(virtuallist, div, null);
    			/*div_binding*/ ctx[20](div);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const virtuallist_changes = {};
    			if (dirty[0] & /*items*/ 16) virtuallist_changes.items = /*items*/ ctx[4];
    			if (dirty[0] & /*itemHeight*/ 128) virtuallist_changes.itemHeight = /*itemHeight*/ ctx[7];

    			if (dirty[0] & /*Item, filterText, getOptionLabel, selectedValue, optionIdentifier, hoverItemIndex, items*/ 4918 | dirty[1] & /*$$scope, item, i*/ 104) {
    				virtuallist_changes.$$scope = { dirty, ctx };
    			}

    			virtuallist.$set(virtuallist_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(virtuallist.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(virtuallist.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(virtuallist);
    			/*div_binding*/ ctx[20](null);
    		}
    	};
    }

    // (213:2) <VirtualList {items} {itemHeight} let:item let:i>
    function create_default_slot$4(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*Item*/ ctx[2];

    	function switch_props(ctx) {
    		return {
    			props: {
    				item: /*item*/ ctx[34],
    				filterText: /*filterText*/ ctx[12],
    				getOptionLabel: /*getOptionLabel*/ ctx[5],
    				isFirst: isItemFirst(/*i*/ ctx[36]),
    				isActive: isItemActive(/*item*/ ctx[34], /*selectedValue*/ ctx[8], /*optionIdentifier*/ ctx[9]),
    				isHover: isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[34], /*i*/ ctx[36], /*items*/ ctx[4])
    			}
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[18](/*i*/ ctx[36]);
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[19](/*item*/ ctx[34], /*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr(div, "class", "listItem");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div, "mouseover", mouseover_handler),
    					listen(div, "click", click_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const switch_instance_changes = {};
    			if (dirty[1] & /*item*/ 8) switch_instance_changes.item = /*item*/ ctx[34];
    			if (dirty[0] & /*filterText*/ 4096) switch_instance_changes.filterText = /*filterText*/ ctx[12];
    			if (dirty[0] & /*getOptionLabel*/ 32) switch_instance_changes.getOptionLabel = /*getOptionLabel*/ ctx[5];
    			if (dirty[1] & /*i*/ 32) switch_instance_changes.isFirst = isItemFirst(/*i*/ ctx[36]);
    			if (dirty[0] & /*selectedValue, optionIdentifier*/ 768 | dirty[1] & /*item*/ 8) switch_instance_changes.isActive = isItemActive(/*item*/ ctx[34], /*selectedValue*/ ctx[8], /*optionIdentifier*/ ctx[9]);
    			if (dirty[0] & /*hoverItemIndex, items*/ 18 | dirty[1] & /*item, i*/ 40) switch_instance_changes.isHover = isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[34], /*i*/ ctx[36], /*items*/ ctx[4]);

    			if (switch_value !== (switch_value = /*Item*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (232:0) {#if !isVirtualList}
    function create_if_block$d(ctx) {
    	let div;
    	let current;
    	let each_value = /*items*/ ctx[4];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$d(get_each_context$d(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block_1$1(ctx);
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			attr(div, "class", "listContainer svelte-ux0sbr");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(div, null);
    			}

    			/*div_binding_1*/ ctx[23](div);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*getGroupHeaderLabel, items, handleHover, handleClick, Item, filterText, getOptionLabel, selectedValue, optionIdentifier, hoverItemIndex, noOptionsMessage, hideEmptyState*/ 32630) {
    				each_value = /*items*/ ctx[4];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$d(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$d(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block_1$1(ctx);
    					each_1_else.c();
    					each_1_else.m(div, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    			/*div_binding_1*/ ctx[23](null);
    		}
    	};
    }

    // (254:2) {:else}
    function create_else_block_1$1(ctx) {
    	let if_block_anchor;
    	let if_block = !/*hideEmptyState*/ ctx[10] && create_if_block_2$4(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (!/*hideEmptyState*/ ctx[10]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$4(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (255:4) {#if !hideEmptyState}
    function create_if_block_2$4(ctx) {
    	let div;
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(/*noOptionsMessage*/ ctx[11]);
    			attr(div, "class", "empty svelte-ux0sbr");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*noOptionsMessage*/ 2048) set_data(t, /*noOptionsMessage*/ ctx[11]);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (237:4) { :else }
    function create_else_block$9(ctx) {
    	let div;
    	let switch_instance;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*Item*/ ctx[2];

    	function switch_props(ctx) {
    		return {
    			props: {
    				item: /*item*/ ctx[34],
    				filterText: /*filterText*/ ctx[12],
    				getOptionLabel: /*getOptionLabel*/ ctx[5],
    				isFirst: isItemFirst(/*i*/ ctx[36]),
    				isActive: isItemActive(/*item*/ ctx[34], /*selectedValue*/ ctx[8], /*optionIdentifier*/ ctx[9]),
    				isHover: isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[34], /*i*/ ctx[36], /*items*/ ctx[4])
    			}
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	function mouseover_handler_1() {
    		return /*mouseover_handler_1*/ ctx[21](/*i*/ ctx[36]);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[22](/*item*/ ctx[34], /*i*/ ctx[36], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t = space();
    			attr(div, "class", "listItem");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			append(div, t);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div, "mouseover", mouseover_handler_1),
    					listen(div, "click", click_handler_1)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const switch_instance_changes = {};
    			if (dirty[0] & /*items*/ 16) switch_instance_changes.item = /*item*/ ctx[34];
    			if (dirty[0] & /*filterText*/ 4096) switch_instance_changes.filterText = /*filterText*/ ctx[12];
    			if (dirty[0] & /*getOptionLabel*/ 32) switch_instance_changes.getOptionLabel = /*getOptionLabel*/ ctx[5];
    			if (dirty[0] & /*items, selectedValue, optionIdentifier*/ 784) switch_instance_changes.isActive = isItemActive(/*item*/ ctx[34], /*selectedValue*/ ctx[8], /*optionIdentifier*/ ctx[9]);
    			if (dirty[0] & /*hoverItemIndex, items*/ 18) switch_instance_changes.isHover = isItemHover(/*hoverItemIndex*/ ctx[1], /*item*/ ctx[34], /*i*/ ctx[36], /*items*/ ctx[4]);

    			if (switch_value !== (switch_value = /*Item*/ ctx[2])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, t);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (235:4) {#if item.isGroupHeader && !item.isSelectable}
    function create_if_block_1$6(ctx) {
    	let div;
    	let t_value = /*getGroupHeaderLabel*/ ctx[6](/*item*/ ctx[34]) + "";
    	let t;

    	return {
    		c() {
    			div = element("div");
    			t = text(t_value);
    			attr(div, "class", "listGroupTitle svelte-ux0sbr");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*getGroupHeaderLabel, items*/ 80 && t_value !== (t_value = /*getGroupHeaderLabel*/ ctx[6](/*item*/ ctx[34]) + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (234:2) {#each items as item, i}
    function create_each_block$d(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$6, create_else_block$9];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*item*/ ctx[34].isGroupHeader && !/*item*/ ctx[34].isSelectable) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function create_fragment$z(ctx) {
    	let t;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*isVirtualList*/ ctx[3] && create_if_block_3$3(ctx);
    	let if_block1 = !/*isVirtualList*/ ctx[3] && create_if_block$d(ctx);

    	return {
    		c() {
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert(target, t, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(window, "keydown", /*handleKeyDown*/ ctx[15]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (/*isVirtualList*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*isVirtualList*/ 8) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_3$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t.parentNode, t);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!/*isVirtualList*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*isVirtualList*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$d(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach(t);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function isItemActive(item, selectedValue, optionIdentifier) {
    	return selectedValue && selectedValue[optionIdentifier] === item[optionIdentifier];
    }

    function isItemFirst(itemIndex) {
    	return itemIndex === 0;
    }

    function isItemHover(hoverItemIndex, item, itemIndex, items) {
    	return hoverItemIndex === itemIndex || items.length === 1;
    }

    function instance$z($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { container = undefined } = $$props;
    	let { Item: Item$1 = Item } = $$props;
    	let { isVirtualList = false } = $$props;
    	let { items = [] } = $$props;

    	let { getOptionLabel = (option, filterText) => {
    		if (option) return option.isCreator
    		? `Create \"${filterText}\"`
    		: option.label;
    	} } = $$props;

    	let { getGroupHeaderLabel = option => {
    		return option.label;
    	} } = $$props;

    	let { itemHeight = 40 } = $$props;
    	let { hoverItemIndex = 0 } = $$props;
    	let { selectedValue = undefined } = $$props;
    	let { optionIdentifier = "value" } = $$props;
    	let { hideEmptyState = false } = $$props;
    	let { noOptionsMessage = "No options" } = $$props;
    	let { isMulti = false } = $$props;
    	let { activeItemIndex = 0 } = $$props;
    	let { filterText = "" } = $$props;
    	let isScrollingTimer = 0;
    	let isScrolling = false;
    	let prev_items;

    	onMount(() => {
    		if (items.length > 0 && !isMulti && selectedValue) {
    			const _hoverItemIndex = items.findIndex(item => item[optionIdentifier] === selectedValue[optionIdentifier]);

    			if (_hoverItemIndex) {
    				$$invalidate(1, hoverItemIndex = _hoverItemIndex);
    			}
    		}

    		scrollToActiveItem("active");

    		container.addEventListener(
    			"scroll",
    			() => {
    				clearTimeout(isScrollingTimer);

    				isScrollingTimer = setTimeout(
    					() => {
    						isScrolling = false;
    					},
    					100
    				);
    			},
    			false
    		);
    	});

    	onDestroy(() => {
    		
    	}); // clearTimeout(isScrollingTimer);

    	beforeUpdate(() => {
    		if (items !== prev_items && items.length > 0) {
    			$$invalidate(1, hoverItemIndex = 0);
    		}

    		// if (prev_activeItemIndex && activeItemIndex > -1) {
    		//   hoverItemIndex = activeItemIndex;
    		//   scrollToActiveItem('active');
    		// }
    		// if (prev_selectedValue && selectedValue) {
    		//   scrollToActiveItem('active');
    		//   if (items && !isMulti) {
    		//     const hoverItemIndex = items.findIndex((item) => item[optionIdentifier] === selectedValue[optionIdentifier]);
    		//     if (hoverItemIndex) {
    		//       hoverItemIndex = hoverItemIndex;
    		//     }
    		//   }
    		// }
    		prev_items = items;
    	});

    	function handleSelect(item) {
    		if (item.isCreator) return;
    		dispatch("itemSelected", item);
    	}

    	function handleHover(i) {
    		if (isScrolling) return;
    		$$invalidate(1, hoverItemIndex = i);
    	}

    	function handleClick(args) {
    		const { item, i, event } = args;
    		event.stopPropagation();
    		if (selectedValue && !isMulti && selectedValue[optionIdentifier] === item[optionIdentifier]) return closeList();

    		if (item.isCreator) {
    			dispatch("itemCreated", filterText);
    		} else {
    			$$invalidate(16, activeItemIndex = i);
    			$$invalidate(1, hoverItemIndex = i);
    			handleSelect(item);
    		}
    	}

    	function closeList() {
    		dispatch("closeList");
    	}

    	async function updateHoverItem(increment) {
    		if (isVirtualList) return;
    		let isNonSelectableItem = true;

    		while (isNonSelectableItem) {
    			if (increment > 0 && hoverItemIndex === items.length - 1) {
    				$$invalidate(1, hoverItemIndex = 0);
    			} else if (increment < 0 && hoverItemIndex === 0) {
    				$$invalidate(1, hoverItemIndex = items.length - 1);
    			} else {
    				$$invalidate(1, hoverItemIndex = hoverItemIndex + increment);
    			}

    			isNonSelectableItem = items[hoverItemIndex].isGroupHeader && !items[hoverItemIndex].isSelectable;
    		}

    		await tick();
    		scrollToActiveItem("hover");
    	}

    	function handleKeyDown(e) {
    		switch (e.key) {
    			case "ArrowDown":
    				e.preventDefault();
    				items.length && updateHoverItem(1);
    				break;
    			case "ArrowUp":
    				e.preventDefault();
    				items.length && updateHoverItem(-1);
    				break;
    			case "Enter":
    				e.preventDefault();
    				if (items.length === 0) break;
    				const hoverItem = items[hoverItemIndex];
    				if (selectedValue && !isMulti && selectedValue[optionIdentifier] === hoverItem[optionIdentifier]) {
    					closeList();
    					break;
    				}
    				if (hoverItem.isCreator) {
    					dispatch("itemCreated", filterText);
    				} else {
    					$$invalidate(16, activeItemIndex = hoverItemIndex);
    					handleSelect(items[hoverItemIndex]);
    				}
    				break;
    			case "Tab":
    				e.preventDefault();
    				if (items.length === 0) break;
    				if (selectedValue && selectedValue[optionIdentifier] === items[hoverItemIndex][optionIdentifier]) return closeList();
    				$$invalidate(16, activeItemIndex = hoverItemIndex);
    				handleSelect(items[hoverItemIndex]);
    				break;
    		}
    	}

    	function scrollToActiveItem(className) {
    		if (isVirtualList || !container) return;
    		let offsetBounding;
    		const focusedElemBounding = container.querySelector(`.listItem .${className}`);

    		if (focusedElemBounding) {
    			offsetBounding = container.getBoundingClientRect().bottom - focusedElemBounding.getBoundingClientRect().bottom;
    		}

    		$$invalidate(0, container.scrollTop -= offsetBounding, container);
    	}

    	
    	
    	const mouseover_handler = i => handleHover(i);
    	const click_handler = (item, i, event) => handleClick({ item, i, event });

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	const mouseover_handler_1 = i => handleHover(i);
    	const click_handler_1 = (item, i, event) => handleClick({ item, i, event });

    	function div_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("Item" in $$props) $$invalidate(2, Item$1 = $$props.Item);
    		if ("isVirtualList" in $$props) $$invalidate(3, isVirtualList = $$props.isVirtualList);
    		if ("items" in $$props) $$invalidate(4, items = $$props.items);
    		if ("getOptionLabel" in $$props) $$invalidate(5, getOptionLabel = $$props.getOptionLabel);
    		if ("getGroupHeaderLabel" in $$props) $$invalidate(6, getGroupHeaderLabel = $$props.getGroupHeaderLabel);
    		if ("itemHeight" in $$props) $$invalidate(7, itemHeight = $$props.itemHeight);
    		if ("hoverItemIndex" in $$props) $$invalidate(1, hoverItemIndex = $$props.hoverItemIndex);
    		if ("selectedValue" in $$props) $$invalidate(8, selectedValue = $$props.selectedValue);
    		if ("optionIdentifier" in $$props) $$invalidate(9, optionIdentifier = $$props.optionIdentifier);
    		if ("hideEmptyState" in $$props) $$invalidate(10, hideEmptyState = $$props.hideEmptyState);
    		if ("noOptionsMessage" in $$props) $$invalidate(11, noOptionsMessage = $$props.noOptionsMessage);
    		if ("isMulti" in $$props) $$invalidate(17, isMulti = $$props.isMulti);
    		if ("activeItemIndex" in $$props) $$invalidate(16, activeItemIndex = $$props.activeItemIndex);
    		if ("filterText" in $$props) $$invalidate(12, filterText = $$props.filterText);
    	};

    	return [
    		container,
    		hoverItemIndex,
    		Item$1,
    		isVirtualList,
    		items,
    		getOptionLabel,
    		getGroupHeaderLabel,
    		itemHeight,
    		selectedValue,
    		optionIdentifier,
    		hideEmptyState,
    		noOptionsMessage,
    		filterText,
    		handleHover,
    		handleClick,
    		handleKeyDown,
    		activeItemIndex,
    		isMulti,
    		mouseover_handler,
    		click_handler,
    		div_binding,
    		mouseover_handler_1,
    		click_handler_1,
    		div_binding_1
    	];
    }

    class List extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$z,
    			create_fragment$z,
    			safe_not_equal,
    			{
    				container: 0,
    				Item: 2,
    				isVirtualList: 3,
    				items: 4,
    				getOptionLabel: 5,
    				getGroupHeaderLabel: 6,
    				itemHeight: 7,
    				hoverItemIndex: 1,
    				selectedValue: 8,
    				optionIdentifier: 9,
    				hideEmptyState: 10,
    				noOptionsMessage: 11,
    				isMulti: 17,
    				activeItemIndex: 16,
    				filterText: 12
    			},
    			[-1, -1]
    		);
    	}
    }

    /* node_modules/svelte-select/src/Selection.svelte generated by Svelte v3.38.2 */

    function create_fragment$y(ctx) {
    	let div;
    	let raw_value = /*getSelectionLabel*/ ctx[0](/*item*/ ctx[1]) + "";

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "selection svelte-ch6bh7");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			div.innerHTML = raw_value;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*getSelectionLabel, item*/ 3 && raw_value !== (raw_value = /*getSelectionLabel*/ ctx[0](/*item*/ ctx[1]) + "")) div.innerHTML = raw_value;		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function instance$y($$self, $$props, $$invalidate) {
    	let { getSelectionLabel = undefined } = $$props;
    	let { item = undefined } = $$props;

    	$$self.$$set = $$props => {
    		if ("getSelectionLabel" in $$props) $$invalidate(0, getSelectionLabel = $$props.getSelectionLabel);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    	};

    	return [getSelectionLabel, item];
    }

    class Selection extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$y, create_fragment$y, safe_not_equal, { getSelectionLabel: 0, item: 1 });
    	}
    }

    /* node_modules/svelte-select/src/MultiSelection.svelte generated by Svelte v3.38.2 */

    function get_each_context$c(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (23:2) {#if !isDisabled && !multiFullItemClearable}
    function create_if_block$c(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*i*/ ctx[11], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg width="100%" height="100%" viewBox="-2 -2 50 50" focusable="false" role="presentation" class="svelte-14r1jr2"><path d="M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124 l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z"></path></svg>`;
    			attr(div, "class", "multiSelectItem_clear svelte-14r1jr2");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (!mounted) {
    				dispose = listen(div, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (18:0) {#each selectedValue as value, i}
    function create_each_block$c(ctx) {
    	let div1;
    	let div0;
    	let raw_value = /*getSelectionLabel*/ ctx[4](/*value*/ ctx[9]) + "";
    	let t0;
    	let t1;
    	let div1_class_value;
    	let mounted;
    	let dispose;
    	let if_block = !/*isDisabled*/ ctx[2] && !/*multiFullItemClearable*/ ctx[3] && create_if_block$c(ctx);

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[7](/*i*/ ctx[11], ...args);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			attr(div0, "class", "multiSelectItem_label svelte-14r1jr2");

    			attr(div1, "class", div1_class_value = "multiSelectItem " + (/*activeSelectedValue*/ ctx[1] === /*i*/ ctx[11]
    			? "active"
    			: "") + " " + (/*isDisabled*/ ctx[2] ? "disabled" : "") + " svelte-14r1jr2");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			div0.innerHTML = raw_value;
    			append(div1, t0);
    			if (if_block) if_block.m(div1, null);
    			append(div1, t1);

    			if (!mounted) {
    				dispose = listen(div1, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*getSelectionLabel, selectedValue*/ 17 && raw_value !== (raw_value = /*getSelectionLabel*/ ctx[4](/*value*/ ctx[9]) + "")) div0.innerHTML = raw_value;
    			if (!/*isDisabled*/ ctx[2] && !/*multiFullItemClearable*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$c(ctx);
    					if_block.c();
    					if_block.m(div1, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*activeSelectedValue, isDisabled*/ 6 && div1_class_value !== (div1_class_value = "multiSelectItem " + (/*activeSelectedValue*/ ctx[1] === /*i*/ ctx[11]
    			? "active"
    			: "") + " " + (/*isDisabled*/ ctx[2] ? "disabled" : "") + " svelte-14r1jr2")) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$x(ctx) {
    	let each_1_anchor;
    	let each_value = /*selectedValue*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$c(get_each_context$c(ctx, each_value, i));
    	}

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*activeSelectedValue, isDisabled, multiFullItemClearable, handleClear, getSelectionLabel, selectedValue*/ 63) {
    				each_value = /*selectedValue*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$c(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$c(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    function instance$x($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { selectedValue = [] } = $$props;
    	let { activeSelectedValue = undefined } = $$props;
    	let { isDisabled = false } = $$props;
    	let { multiFullItemClearable = false } = $$props;
    	let { getSelectionLabel = undefined } = $$props;

    	function handleClear(i, event) {
    		event.stopPropagation();
    		dispatch("multiItemClear", { i });
    	}

    	const click_handler = (i, event) => handleClear(i, event);
    	const click_handler_1 = (i, event) => multiFullItemClearable ? handleClear(i, event) : {};

    	$$self.$$set = $$props => {
    		if ("selectedValue" in $$props) $$invalidate(0, selectedValue = $$props.selectedValue);
    		if ("activeSelectedValue" in $$props) $$invalidate(1, activeSelectedValue = $$props.activeSelectedValue);
    		if ("isDisabled" in $$props) $$invalidate(2, isDisabled = $$props.isDisabled);
    		if ("multiFullItemClearable" in $$props) $$invalidate(3, multiFullItemClearable = $$props.multiFullItemClearable);
    		if ("getSelectionLabel" in $$props) $$invalidate(4, getSelectionLabel = $$props.getSelectionLabel);
    	};

    	return [
    		selectedValue,
    		activeSelectedValue,
    		isDisabled,
    		multiFullItemClearable,
    		getSelectionLabel,
    		handleClear,
    		click_handler,
    		click_handler_1
    	];
    }

    class MultiSelection extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$x, create_fragment$x, safe_not_equal, {
    			selectedValue: 0,
    			activeSelectedValue: 1,
    			isDisabled: 2,
    			multiFullItemClearable: 3,
    			getSelectionLabel: 4
    		});
    	}
    }

    function isOutOfViewport(elem) {
      const bounding = elem.getBoundingClientRect();
      const out = {};

      out.top = bounding.top < 0;
      out.left = bounding.left < 0;
      out.bottom = bounding.bottom > (window.innerHeight || document.documentElement.clientHeight);
      out.right = bounding.right > (window.innerWidth || document.documentElement.clientWidth);
      out.any = out.top || out.left || out.bottom || out.right;

      return out;
    }

    function debounce(func, wait, immediate) {
      let timeout;

      return function executedFunction() {
        let context = this;
        let args = arguments;

        let later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        let callNow = immediate && !timeout;

        clearTimeout(timeout);

        timeout = setTimeout(later, wait);

        if (callNow) func.apply(context, args);
      };
    }

    /* node_modules/svelte-select/src/ClearIcon.svelte generated by Svelte v3.38.2 */

    function create_fragment$w(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "fill", "currentColor");
    			attr(path, "d", "M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124\n    l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z");
    			attr(svg, "width", "100%");
    			attr(svg, "height", "100%");
    			attr(svg, "viewBox", "-2 -2 50 50");
    			attr(svg, "focusable", "false");
    			attr(svg, "role", "presentation");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    class ClearIcon extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, null, create_fragment$w, safe_not_equal, {});
    	}
    }

    /* node_modules/svelte-select/src/Select.svelte generated by Svelte v3.38.2 */

    function create_if_block_7$1(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	const switch_instance_spread_levels = [/*iconProps*/ ctx[18]];
    	var switch_value = /*Icon*/ ctx[17];

    	function switch_props(ctx) {
    		let switch_instance_props = {};

    		for (let i = 0; i < switch_instance_spread_levels.length; i += 1) {
    			switch_instance_props = assign(switch_instance_props, switch_instance_spread_levels[i]);
    		}

    		return { props: switch_instance_props };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = (dirty[0] & /*iconProps*/ 262144)
    			? get_spread_update(switch_instance_spread_levels, [get_spread_object(/*iconProps*/ ctx[18])])
    			: {};

    			if (switch_value !== (switch_value = /*Icon*/ ctx[17])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    // (831:2) {#if isMulti && selectedValue && selectedValue.length > 0}
    function create_if_block_6$2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*MultiSelection*/ ctx[7];

    	function switch_props(ctx) {
    		return {
    			props: {
    				selectedValue: /*selectedValue*/ ctx[0],
    				getSelectionLabel: /*getSelectionLabel*/ ctx[13],
    				activeSelectedValue: /*activeSelectedValue*/ ctx[25],
    				isDisabled: /*isDisabled*/ ctx[10],
    				multiFullItemClearable: /*multiFullItemClearable*/ ctx[9]
    			}
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    		switch_instance.$on("multiItemClear", /*handleMultiItemClear*/ ctx[29]);
    		switch_instance.$on("focus", /*handleFocus*/ ctx[32]);
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*selectedValue*/ 1) switch_instance_changes.selectedValue = /*selectedValue*/ ctx[0];
    			if (dirty[0] & /*getSelectionLabel*/ 8192) switch_instance_changes.getSelectionLabel = /*getSelectionLabel*/ ctx[13];
    			if (dirty[0] & /*activeSelectedValue*/ 33554432) switch_instance_changes.activeSelectedValue = /*activeSelectedValue*/ ctx[25];
    			if (dirty[0] & /*isDisabled*/ 1024) switch_instance_changes.isDisabled = /*isDisabled*/ ctx[10];
    			if (dirty[0] & /*multiFullItemClearable*/ 512) switch_instance_changes.multiFullItemClearable = /*multiFullItemClearable*/ ctx[9];

    			if (switch_value !== (switch_value = /*MultiSelection*/ ctx[7])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					switch_instance.$on("multiItemClear", /*handleMultiItemClear*/ ctx[29]);
    					switch_instance.$on("focus", /*handleFocus*/ ctx[32]);
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    // (852:2) {:else}
    function create_else_block_1(ctx) {
    	let input_1;
    	let mounted;
    	let dispose;

    	let input_1_levels = [
    		/*_inputAttributes*/ ctx[26],
    		{ placeholder: /*placeholderText*/ ctx[28] },
    		{ style: /*inputStyles*/ ctx[15] }
    	];

    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	return {
    		c() {
    			input_1 = element("input");
    			set_attributes(input_1, input_1_data);
    			toggle_class(input_1, "svelte-17qb5ew", true);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			/*input_1_binding_1*/ ctx[63](input_1);
    			set_input_value(input_1, /*filterText*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "focus", /*handleFocus*/ ctx[32]),
    					listen(input_1, "input", /*input_1_input_handler_1*/ ctx[64])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
    				dirty[0] & /*_inputAttributes*/ 67108864 && /*_inputAttributes*/ ctx[26],
    				dirty[0] & /*placeholderText*/ 268435456 && { placeholder: /*placeholderText*/ ctx[28] },
    				dirty[0] & /*inputStyles*/ 32768 && { style: /*inputStyles*/ ctx[15] }
    			]));

    			if (dirty[0] & /*filterText*/ 2 && input_1.value !== /*filterText*/ ctx[1]) {
    				set_input_value(input_1, /*filterText*/ ctx[1]);
    			}

    			toggle_class(input_1, "svelte-17qb5ew", true);
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding_1*/ ctx[63](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (843:2) {#if isDisabled}
    function create_if_block_5$2(ctx) {
    	let input_1;
    	let mounted;
    	let dispose;

    	let input_1_levels = [
    		/*_inputAttributes*/ ctx[26],
    		{ placeholder: /*placeholderText*/ ctx[28] },
    		{ style: /*inputStyles*/ ctx[15] },
    		{ disabled: true }
    	];

    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	return {
    		c() {
    			input_1 = element("input");
    			set_attributes(input_1, input_1_data);
    			toggle_class(input_1, "svelte-17qb5ew", true);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			/*input_1_binding*/ ctx[61](input_1);
    			set_input_value(input_1, /*filterText*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "focus", /*handleFocus*/ ctx[32]),
    					listen(input_1, "input", /*input_1_input_handler*/ ctx[62])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
    				dirty[0] & /*_inputAttributes*/ 67108864 && /*_inputAttributes*/ ctx[26],
    				dirty[0] & /*placeholderText*/ 268435456 && { placeholder: /*placeholderText*/ ctx[28] },
    				dirty[0] & /*inputStyles*/ 32768 && { style: /*inputStyles*/ ctx[15] },
    				{ disabled: true }
    			]));

    			if (dirty[0] & /*filterText*/ 2 && input_1.value !== /*filterText*/ ctx[1]) {
    				set_input_value(input_1, /*filterText*/ ctx[1]);
    			}

    			toggle_class(input_1, "svelte-17qb5ew", true);
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding*/ ctx[61](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (862:2) {#if !isMulti && showSelectedItem}
    function create_if_block_4$2(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*Selection*/ ctx[6];

    	function switch_props(ctx) {
    		return {
    			props: {
    				item: /*selectedValue*/ ctx[0],
    				getSelectionLabel: /*getSelectionLabel*/ ctx[13]
    			}
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr(div, "class", "selectedItem svelte-17qb5ew");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(div, "focus", /*handleFocus*/ ctx[32]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty[0] & /*selectedValue*/ 1) switch_instance_changes.item = /*selectedValue*/ ctx[0];
    			if (dirty[0] & /*getSelectionLabel*/ 8192) switch_instance_changes.getSelectionLabel = /*getSelectionLabel*/ ctx[13];

    			if (switch_value !== (switch_value = /*Selection*/ ctx[6])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (871:2) {#if showSelectedItem && isClearable && !isDisabled && !isWaiting}
    function create_if_block_3$2(ctx) {
    	let div;
    	let switch_instance;
    	let current;
    	let mounted;
    	let dispose;
    	var switch_value = /*ClearIcon*/ ctx[23];

    	function switch_props(ctx) {
    		return {};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			div = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr(div, "class", "clearSelect svelte-17qb5ew");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(div, "click", prevent_default(/*handleClear*/ ctx[24]));
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (switch_value !== (switch_value = /*ClearIcon*/ ctx[23])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (switch_instance) destroy_component(switch_instance);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (877:2) {#if showIndicator || (showChevron && !selectedValue || (!isSearchable && !isDisabled && !isWaiting && ((showSelectedItem && !isClearable) || !showSelectedItem)))}
    function create_if_block_1$5(ctx) {
    	let div;

    	function select_block_type_1(ctx, dirty) {
    		if (/*indicatorSvg*/ ctx[22]) return create_if_block_2$3;
    		return create_else_block$8;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "indicator svelte-17qb5ew");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block.d();
    		}
    	};
    }

    // (881:6) {:else}
    function create_else_block$8(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747\n            3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0\n            1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502\n            0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0\n            0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z");
    			attr(svg, "width", "100%");
    			attr(svg, "height", "100%");
    			attr(svg, "viewBox", "0 0 20 20");
    			attr(svg, "focusable", "false");
    			attr(svg, "class", "svelte-17qb5ew");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (879:6) {#if indicatorSvg}
    function create_if_block_2$3(ctx) {
    	let html_tag;
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(/*indicatorSvg*/ ctx[22], target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*indicatorSvg*/ 4194304) html_tag.p(/*indicatorSvg*/ ctx[22]);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    // (898:2) {#if isWaiting}
    function create_if_block$b(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			div.innerHTML = `<svg class="spinner_icon svelte-17qb5ew" viewBox="25 25 50 50"><circle class="spinner_path svelte-17qb5ew" cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-miterlimit="10"></circle></svg>`;
    			attr(div, "class", "spinner svelte-17qb5ew");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$v(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let t5;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*Icon*/ ctx[17] && create_if_block_7$1(ctx);
    	let if_block1 = /*isMulti*/ ctx[8] && /*selectedValue*/ ctx[0] && /*selectedValue*/ ctx[0].length > 0 && create_if_block_6$2(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isDisabled*/ ctx[10]) return create_if_block_5$2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block2 = current_block_type(ctx);
    	let if_block3 = !/*isMulti*/ ctx[8] && /*showSelectedItem*/ ctx[27] && create_if_block_4$2(ctx);
    	let if_block4 = /*showSelectedItem*/ ctx[27] && /*isClearable*/ ctx[16] && !/*isDisabled*/ ctx[10] && !/*isWaiting*/ ctx[5] && create_if_block_3$2(ctx);
    	let if_block5 = (/*showIndicator*/ ctx[20] || (/*showChevron*/ ctx[19] && !/*selectedValue*/ ctx[0] || !/*isSearchable*/ ctx[14] && !/*isDisabled*/ ctx[10] && !/*isWaiting*/ ctx[5] && (/*showSelectedItem*/ ctx[27] && !/*isClearable*/ ctx[16] || !/*showSelectedItem*/ ctx[27]))) && create_if_block_1$5(ctx);
    	let if_block6 = /*isWaiting*/ ctx[5] && create_if_block$b();

    	return {
    		c() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			t3 = space();
    			if (if_block4) if_block4.c();
    			t4 = space();
    			if (if_block5) if_block5.c();
    			t5 = space();
    			if (if_block6) if_block6.c();
    			attr(div, "class", div_class_value = "selectContainer " + /*containerClasses*/ ctx[21] + " svelte-17qb5ew");
    			attr(div, "style", /*containerStyles*/ ctx[12]);
    			toggle_class(div, "hasError", /*hasError*/ ctx[11]);
    			toggle_class(div, "multiSelect", /*isMulti*/ ctx[8]);
    			toggle_class(div, "disabled", /*isDisabled*/ ctx[10]);
    			toggle_class(div, "focused", /*isFocused*/ ctx[4]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append(div, t1);
    			if_block2.m(div, null);
    			append(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			append(div, t3);
    			if (if_block4) if_block4.m(div, null);
    			append(div, t4);
    			if (if_block5) if_block5.m(div, null);
    			append(div, t5);
    			if (if_block6) if_block6.m(div, null);
    			/*div_binding*/ ctx[65](div);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "click", /*handleWindowClick*/ ctx[33]),
    					listen(window, "keydown", /*handleKeyDown*/ ctx[31]),
    					listen(window, "resize", /*getPosition*/ ctx[30]),
    					listen(div, "click", /*handleClick*/ ctx[34])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (/*Icon*/ ctx[17]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty[0] & /*Icon*/ 131072) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_7$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*isMulti*/ ctx[8] && /*selectedValue*/ ctx[0] && /*selectedValue*/ ctx[0].length > 0) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*isMulti, selectedValue*/ 257) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_6$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div, t2);
    				}
    			}

    			if (!/*isMulti*/ ctx[8] && /*showSelectedItem*/ ctx[27]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);

    					if (dirty[0] & /*isMulti, showSelectedItem*/ 134217984) {
    						transition_in(if_block3, 1);
    					}
    				} else {
    					if_block3 = create_if_block_4$2(ctx);
    					if_block3.c();
    					transition_in(if_block3, 1);
    					if_block3.m(div, t3);
    				}
    			} else if (if_block3) {
    				group_outros();

    				transition_out(if_block3, 1, 1, () => {
    					if_block3 = null;
    				});

    				check_outros();
    			}

    			if (/*showSelectedItem*/ ctx[27] && /*isClearable*/ ctx[16] && !/*isDisabled*/ ctx[10] && !/*isWaiting*/ ctx[5]) {
    				if (if_block4) {
    					if_block4.p(ctx, dirty);

    					if (dirty[0] & /*showSelectedItem, isClearable, isDisabled, isWaiting*/ 134284320) {
    						transition_in(if_block4, 1);
    					}
    				} else {
    					if_block4 = create_if_block_3$2(ctx);
    					if_block4.c();
    					transition_in(if_block4, 1);
    					if_block4.m(div, t4);
    				}
    			} else if (if_block4) {
    				group_outros();

    				transition_out(if_block4, 1, 1, () => {
    					if_block4 = null;
    				});

    				check_outros();
    			}

    			if (/*showIndicator*/ ctx[20] || (/*showChevron*/ ctx[19] && !/*selectedValue*/ ctx[0] || !/*isSearchable*/ ctx[14] && !/*isDisabled*/ ctx[10] && !/*isWaiting*/ ctx[5] && (/*showSelectedItem*/ ctx[27] && !/*isClearable*/ ctx[16] || !/*showSelectedItem*/ ctx[27]))) {
    				if (if_block5) {
    					if_block5.p(ctx, dirty);
    				} else {
    					if_block5 = create_if_block_1$5(ctx);
    					if_block5.c();
    					if_block5.m(div, t5);
    				}
    			} else if (if_block5) {
    				if_block5.d(1);
    				if_block5 = null;
    			}

    			if (/*isWaiting*/ ctx[5]) {
    				if (if_block6) ; else {
    					if_block6 = create_if_block$b();
    					if_block6.c();
    					if_block6.m(div, null);
    				}
    			} else if (if_block6) {
    				if_block6.d(1);
    				if_block6 = null;
    			}

    			if (!current || dirty[0] & /*containerClasses*/ 2097152 && div_class_value !== (div_class_value = "selectContainer " + /*containerClasses*/ ctx[21] + " svelte-17qb5ew")) {
    				attr(div, "class", div_class_value);
    			}

    			if (!current || dirty[0] & /*containerStyles*/ 4096) {
    				attr(div, "style", /*containerStyles*/ ctx[12]);
    			}

    			if (dirty[0] & /*containerClasses, hasError*/ 2099200) {
    				toggle_class(div, "hasError", /*hasError*/ ctx[11]);
    			}

    			if (dirty[0] & /*containerClasses, isMulti*/ 2097408) {
    				toggle_class(div, "multiSelect", /*isMulti*/ ctx[8]);
    			}

    			if (dirty[0] & /*containerClasses, isDisabled*/ 2098176) {
    				toggle_class(div, "disabled", /*isDisabled*/ ctx[10]);
    			}

    			if (dirty[0] & /*containerClasses, isFocused*/ 2097168) {
    				toggle_class(div, "focused", /*isFocused*/ ctx[4]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block3);
    			transition_in(if_block4);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block3);
    			transition_out(if_block4);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    			if (if_block6) if_block6.d();
    			/*div_binding*/ ctx[65](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$w($$self, $$props, $$invalidate) {
    	let showSelectedItem;
    	let placeholderText;
    	const dispatch = createEventDispatcher();
    	let { container = undefined } = $$props;
    	let { input = undefined } = $$props;
    	let { Item: Item$1 = Item } = $$props;
    	let { Selection: Selection$1 = Selection } = $$props;
    	let { MultiSelection: MultiSelection$1 = MultiSelection } = $$props;
    	let { isMulti = false } = $$props;
    	let { multiFullItemClearable = false } = $$props;
    	let { isDisabled = false } = $$props;
    	let { isCreatable = false } = $$props;
    	let { isFocused = false } = $$props;
    	let { selectedValue = undefined } = $$props;
    	let { filterText = "" } = $$props;
    	let { placeholder = "Select..." } = $$props;
    	let { items = [] } = $$props;
    	let { itemFilter = (label, filterText, option) => label.toLowerCase().includes(filterText.toLowerCase()) } = $$props;
    	let { groupBy = undefined } = $$props;
    	let { groupFilter = groups => groups } = $$props;
    	let { isGroupHeaderSelectable = false } = $$props;

    	let { getGroupHeaderLabel = option => {
    		return option.label;
    	} } = $$props;

    	let { getOptionLabel = (option, filterText) => {
    		return option.isCreator
    		? `Create \"${filterText}\"`
    		: option.label;
    	} } = $$props;

    	let { optionIdentifier = "value" } = $$props;
    	let { loadOptions = undefined } = $$props;
    	let { hasError = false } = $$props;
    	let { containerStyles = "" } = $$props;

    	let { getSelectionLabel = option => {
    		if (option) return option.label;
    	} } = $$props;

    	let { createGroupHeaderItem = groupValue => {
    		return { value: groupValue, label: groupValue };
    	} } = $$props;

    	let { createItem = filterText => {
    		return { value: filterText, label: filterText };
    	} } = $$props;

    	let { isSearchable = true } = $$props;
    	let { inputStyles = "" } = $$props;
    	let { isClearable = true } = $$props;
    	let { isWaiting = false } = $$props;
    	let { listPlacement = "auto" } = $$props;
    	let { listOpen = false } = $$props;
    	let { list = undefined } = $$props;
    	let { isVirtualList = false } = $$props;
    	let { loadOptionsInterval = 300 } = $$props;
    	let { noOptionsMessage = "No options" } = $$props;
    	let { hideEmptyState = false } = $$props;
    	let { filteredItems = [] } = $$props;
    	let { inputAttributes = {} } = $$props;
    	let { listAutoWidth = true } = $$props;
    	let { itemHeight = 40 } = $$props;
    	let { Icon = undefined } = $$props;
    	let { iconProps = {} } = $$props;
    	let { showChevron = false } = $$props;
    	let { showIndicator = false } = $$props;
    	let { containerClasses = "" } = $$props;
    	let { indicatorSvg = undefined } = $$props;
    	let { ClearIcon: ClearIcon$1 = ClearIcon } = $$props;
    	let target;
    	let activeSelectedValue;
    	let originalItemsClone;
    	let prev_selectedValue;
    	let prev_listOpen;
    	let prev_filterText;
    	let prev_isFocused;
    	let prev_filteredItems;

    	async function resetFilter() {
    		await tick();
    		$$invalidate(1, filterText = "");
    	}

    	let getItemsHasInvoked = false;

    	const getItems = debounce(
    		async () => {
    			getItemsHasInvoked = true;
    			$$invalidate(5, isWaiting = true);

    			let res = await loadOptions(filterText).catch(err => {
    				console.warn("svelte-select loadOptions error :>> ", err);
    				dispatch("error", { type: "loadOptions", details: err });
    			});

    			if (res && !res.cancelled) {
    				if (res) {
    					$$invalidate(35, items = [...res]);
    					dispatch("loaded", { items });
    				} else {
    					$$invalidate(35, items = []);
    				}

    				$$invalidate(5, isWaiting = false);
    				$$invalidate(4, isFocused = true);
    				$$invalidate(37, listOpen = true);
    			}
    		},
    		loadOptionsInterval
    	);

    	let _inputAttributes = {};

    	beforeUpdate(() => {
    		if (isMulti && selectedValue && selectedValue.length > 1) {
    			checkSelectedValueForDuplicates();
    		}

    		if (!isMulti && selectedValue && prev_selectedValue !== selectedValue) {
    			if (!prev_selectedValue || JSON.stringify(selectedValue[optionIdentifier]) !== JSON.stringify(prev_selectedValue[optionIdentifier])) {
    				dispatch("select", selectedValue);
    			}
    		}

    		if (isMulti && JSON.stringify(selectedValue) !== JSON.stringify(prev_selectedValue)) {
    			if (checkSelectedValueForDuplicates()) {
    				dispatch("select", selectedValue);
    			}
    		}

    		if (container && listOpen !== prev_listOpen) {
    			if (listOpen) {
    				loadList();
    			} else {
    				removeList();
    			}
    		}

    		if (filterText !== prev_filterText) {
    			if (filterText.length > 0) {
    				$$invalidate(4, isFocused = true);
    				$$invalidate(37, listOpen = true);

    				if (loadOptions) {
    					getItems();
    				} else {
    					loadList();
    					$$invalidate(37, listOpen = true);

    					if (isMulti) {
    						$$invalidate(25, activeSelectedValue = undefined);
    					}
    				}
    			} else {
    				setList([]);
    			}

    			if (list) {
    				list.$set({ filterText });
    			}
    		}

    		if (isFocused !== prev_isFocused) {
    			if (isFocused || listOpen) {
    				handleFocus();
    			} else {
    				resetFilter();
    				if (input) input.blur();
    			}
    		}

    		if (prev_filteredItems !== filteredItems) {
    			let _filteredItems = [...filteredItems];

    			if (isCreatable && filterText) {
    				const itemToCreate = createItem(filterText);
    				itemToCreate.isCreator = true;

    				const existingItemWithFilterValue = _filteredItems.find(item => {
    					return item[optionIdentifier] === itemToCreate[optionIdentifier];
    				});

    				let existingSelectionWithFilterValue;

    				if (selectedValue) {
    					if (isMulti) {
    						existingSelectionWithFilterValue = selectedValue.find(selection => {
    							return selection[optionIdentifier] === itemToCreate[optionIdentifier];
    						});
    					} else if (selectedValue[optionIdentifier] === itemToCreate[optionIdentifier]) {
    						existingSelectionWithFilterValue = selectedValue;
    					}
    				}

    				if (!existingItemWithFilterValue && !existingSelectionWithFilterValue) {
    					_filteredItems = [..._filteredItems, itemToCreate];
    				}
    			}

    			setList(_filteredItems);
    		}

    		prev_selectedValue = selectedValue;
    		prev_listOpen = listOpen;
    		prev_filterText = filterText;
    		prev_isFocused = isFocused;
    		prev_filteredItems = filteredItems;
    	});

    	function checkSelectedValueForDuplicates() {
    		let noDuplicates = true;

    		if (selectedValue) {
    			const ids = [];
    			const uniqueValues = [];

    			selectedValue.forEach(val => {
    				if (!ids.includes(val[optionIdentifier])) {
    					ids.push(val[optionIdentifier]);
    					uniqueValues.push(val);
    				} else {
    					noDuplicates = false;
    				}
    			});

    			if (!noDuplicates) $$invalidate(0, selectedValue = uniqueValues);
    		}

    		return noDuplicates;
    	}

    	function findItem(selection) {
    		let matchTo = selection
    		? selection[optionIdentifier]
    		: selectedValue[optionIdentifier];

    		return items.find(item => item[optionIdentifier] === matchTo);
    	}

    	function updateSelectedValueDisplay(items) {
    		if (!items || items.length === 0 || items.some(item => typeof item !== "object")) return;

    		if (!selectedValue || (isMulti
    		? selectedValue.some(selection => !selection || !selection[optionIdentifier])
    		: !selectedValue[optionIdentifier])) return;

    		if (Array.isArray(selectedValue)) {
    			$$invalidate(0, selectedValue = selectedValue.map(selection => findItem(selection) || selection));
    		} else {
    			$$invalidate(0, selectedValue = findItem() || selectedValue);
    		}
    	}

    	async function setList(items) {
    		await tick();
    		if (!listOpen) return;
    		if (list) return list.$set({ items });
    		if (loadOptions && getItemsHasInvoked && items.length > 0) loadList();
    	}

    	function handleMultiItemClear(event) {
    		const { detail } = event;
    		const itemToRemove = selectedValue[detail ? detail.i : selectedValue.length - 1];

    		if (selectedValue.length === 1) {
    			$$invalidate(0, selectedValue = undefined);
    		} else {
    			$$invalidate(0, selectedValue = selectedValue.filter(item => {
    				return item !== itemToRemove;
    			}));
    		}

    		dispatch("clear", itemToRemove);
    		getPosition();
    	}

    	async function getPosition() {
    		await tick();
    		if (!target || !container) return;
    		const { top, height, width } = container.getBoundingClientRect();
    		target.style["min-width"] = `${width}px`;
    		target.style.width = `${listAutoWidth ? "auto" : "100%"}`;
    		target.style.left = "0";

    		if (listPlacement === "top") {
    			target.style.bottom = `${height + 5}px`;
    		} else {
    			target.style.top = `${height + 5}px`;
    		}

    		target = target;

    		if (listPlacement === "auto" && isOutOfViewport(target).bottom) {
    			target.style.top = ``;
    			target.style.bottom = `${height + 5}px`;
    		}

    		target.style.visibility = "";
    	}

    	function handleKeyDown(e) {
    		if (!isFocused) return;

    		switch (e.key) {
    			case "ArrowDown":
    				e.preventDefault();
    				$$invalidate(37, listOpen = true);
    				$$invalidate(25, activeSelectedValue = undefined);
    				break;
    			case "ArrowUp":
    				e.preventDefault();
    				$$invalidate(37, listOpen = true);
    				$$invalidate(25, activeSelectedValue = undefined);
    				break;
    			case "Tab":
    				if (!listOpen) $$invalidate(4, isFocused = false);
    				break;
    			case "Backspace":
    				if (!isMulti || filterText.length > 0) return;
    				if (isMulti && selectedValue && selectedValue.length > 0) {
    					handleMultiItemClear(activeSelectedValue !== undefined
    					? activeSelectedValue
    					: selectedValue.length - 1);

    					if (activeSelectedValue === 0 || activeSelectedValue === undefined) break;

    					$$invalidate(25, activeSelectedValue = selectedValue.length > activeSelectedValue
    					? activeSelectedValue - 1
    					: undefined);
    				}
    				break;
    			case "ArrowLeft":
    				if (list) list.$set({ hoverItemIndex: -1 });
    				if (!isMulti || filterText.length > 0) return;
    				if (activeSelectedValue === undefined) {
    					$$invalidate(25, activeSelectedValue = selectedValue.length - 1);
    				} else if (selectedValue.length > activeSelectedValue && activeSelectedValue !== 0) {
    					$$invalidate(25, activeSelectedValue -= 1);
    				}
    				break;
    			case "ArrowRight":
    				if (list) list.$set({ hoverItemIndex: -1 });
    				if (!isMulti || filterText.length > 0 || activeSelectedValue === undefined) return;
    				if (activeSelectedValue === selectedValue.length - 1) {
    					$$invalidate(25, activeSelectedValue = undefined);
    				} else if (activeSelectedValue < selectedValue.length - 1) {
    					$$invalidate(25, activeSelectedValue += 1);
    				}
    				break;
    		}
    	}

    	function handleFocus() {
    		$$invalidate(4, isFocused = true);
    		if (input) input.focus();
    	}

    	function removeList() {
    		resetFilter();
    		$$invalidate(25, activeSelectedValue = undefined);
    		if (!list) return;
    		list.$destroy();
    		$$invalidate(36, list = undefined);
    		if (!target) return;
    		if (target.parentNode) target.parentNode.removeChild(target);
    		target = undefined;
    		$$invalidate(36, list);
    		target = target;
    	}

    	function handleWindowClick(event) {
    		if (!container) return;

    		const eventTarget = event.path && event.path.length > 0
    		? event.path[0]
    		: event.target;

    		if (container.contains(eventTarget)) return;
    		$$invalidate(4, isFocused = false);
    		$$invalidate(37, listOpen = false);
    		$$invalidate(25, activeSelectedValue = undefined);
    		if (input) input.blur();
    	}

    	function handleClick() {
    		if (isDisabled) return;
    		$$invalidate(4, isFocused = true);
    		$$invalidate(37, listOpen = !listOpen);
    	}

    	function handleClear() {
    		$$invalidate(0, selectedValue = undefined);
    		$$invalidate(37, listOpen = false);
    		dispatch("clear", selectedValue);
    		handleFocus();
    	}

    	async function loadList() {
    		await tick();
    		if (target && list) return;

    		const data = {
    			Item: Item$1,
    			filterText,
    			optionIdentifier,
    			noOptionsMessage,
    			hideEmptyState,
    			isVirtualList,
    			selectedValue,
    			isMulti,
    			getGroupHeaderLabel,
    			items: filteredItems,
    			itemHeight
    		};

    		if (getOptionLabel) {
    			data.getOptionLabel = getOptionLabel;
    		}

    		target = document.createElement("div");

    		Object.assign(target.style, {
    			position: "absolute",
    			"z-index": 2,
    			visibility: "hidden"
    		});

    		$$invalidate(36, list);
    		target = target;
    		if (container) container.appendChild(target);
    		$$invalidate(36, list = new List({ target, props: data }));

    		list.$on("itemSelected", event => {
    			const { detail } = event;

    			if (detail) {
    				const item = Object.assign({}, detail);

    				if (!item.isGroupHeader || item.isSelectable) {
    					if (isMulti) {
    						$$invalidate(0, selectedValue = selectedValue ? selectedValue.concat([item]) : [item]);
    					} else {
    						$$invalidate(0, selectedValue = item);
    					}

    					resetFilter();
    					(($$invalidate(0, selectedValue), $$invalidate(48, optionIdentifier)), $$invalidate(8, isMulti));

    					setTimeout(() => {
    						$$invalidate(37, listOpen = false);
    						$$invalidate(25, activeSelectedValue = undefined);
    					});
    				}
    			}
    		});

    		list.$on("itemCreated", event => {
    			const { detail } = event;

    			if (isMulti) {
    				$$invalidate(0, selectedValue = selectedValue || []);
    				$$invalidate(0, selectedValue = [...selectedValue, createItem(detail)]);
    			} else {
    				$$invalidate(0, selectedValue = createItem(detail));
    			}

    			dispatch("itemCreated", detail);
    			$$invalidate(1, filterText = "");
    			$$invalidate(37, listOpen = false);
    			$$invalidate(25, activeSelectedValue = undefined);
    			resetFilter();
    		});

    		list.$on("closeList", () => {
    			$$invalidate(37, listOpen = false);
    		});

    		($$invalidate(36, list), target = target);
    		getPosition();
    	}

    	onMount(() => {
    		if (isFocused) input.focus();
    		if (listOpen) loadList();

    		if (items && items.length > 0) {
    			$$invalidate(60, originalItemsClone = JSON.stringify(items));
    		}
    	});

    	onDestroy(() => {
    		removeList();
    	});

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	function input_1_input_handler() {
    		filterText = this.value;
    		$$invalidate(1, filterText);
    	}

    	function input_1_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	function input_1_input_handler_1() {
    		filterText = this.value;
    		$$invalidate(1, filterText);
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(2, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("container" in $$props) $$invalidate(2, container = $$props.container);
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    		if ("Item" in $$props) $$invalidate(39, Item$1 = $$props.Item);
    		if ("Selection" in $$props) $$invalidate(6, Selection$1 = $$props.Selection);
    		if ("MultiSelection" in $$props) $$invalidate(7, MultiSelection$1 = $$props.MultiSelection);
    		if ("isMulti" in $$props) $$invalidate(8, isMulti = $$props.isMulti);
    		if ("multiFullItemClearable" in $$props) $$invalidate(9, multiFullItemClearable = $$props.multiFullItemClearable);
    		if ("isDisabled" in $$props) $$invalidate(10, isDisabled = $$props.isDisabled);
    		if ("isCreatable" in $$props) $$invalidate(40, isCreatable = $$props.isCreatable);
    		if ("isFocused" in $$props) $$invalidate(4, isFocused = $$props.isFocused);
    		if ("selectedValue" in $$props) $$invalidate(0, selectedValue = $$props.selectedValue);
    		if ("filterText" in $$props) $$invalidate(1, filterText = $$props.filterText);
    		if ("placeholder" in $$props) $$invalidate(41, placeholder = $$props.placeholder);
    		if ("items" in $$props) $$invalidate(35, items = $$props.items);
    		if ("itemFilter" in $$props) $$invalidate(42, itemFilter = $$props.itemFilter);
    		if ("groupBy" in $$props) $$invalidate(43, groupBy = $$props.groupBy);
    		if ("groupFilter" in $$props) $$invalidate(44, groupFilter = $$props.groupFilter);
    		if ("isGroupHeaderSelectable" in $$props) $$invalidate(45, isGroupHeaderSelectable = $$props.isGroupHeaderSelectable);
    		if ("getGroupHeaderLabel" in $$props) $$invalidate(46, getGroupHeaderLabel = $$props.getGroupHeaderLabel);
    		if ("getOptionLabel" in $$props) $$invalidate(47, getOptionLabel = $$props.getOptionLabel);
    		if ("optionIdentifier" in $$props) $$invalidate(48, optionIdentifier = $$props.optionIdentifier);
    		if ("loadOptions" in $$props) $$invalidate(49, loadOptions = $$props.loadOptions);
    		if ("hasError" in $$props) $$invalidate(11, hasError = $$props.hasError);
    		if ("containerStyles" in $$props) $$invalidate(12, containerStyles = $$props.containerStyles);
    		if ("getSelectionLabel" in $$props) $$invalidate(13, getSelectionLabel = $$props.getSelectionLabel);
    		if ("createGroupHeaderItem" in $$props) $$invalidate(50, createGroupHeaderItem = $$props.createGroupHeaderItem);
    		if ("createItem" in $$props) $$invalidate(51, createItem = $$props.createItem);
    		if ("isSearchable" in $$props) $$invalidate(14, isSearchable = $$props.isSearchable);
    		if ("inputStyles" in $$props) $$invalidate(15, inputStyles = $$props.inputStyles);
    		if ("isClearable" in $$props) $$invalidate(16, isClearable = $$props.isClearable);
    		if ("isWaiting" in $$props) $$invalidate(5, isWaiting = $$props.isWaiting);
    		if ("listPlacement" in $$props) $$invalidate(52, listPlacement = $$props.listPlacement);
    		if ("listOpen" in $$props) $$invalidate(37, listOpen = $$props.listOpen);
    		if ("list" in $$props) $$invalidate(36, list = $$props.list);
    		if ("isVirtualList" in $$props) $$invalidate(53, isVirtualList = $$props.isVirtualList);
    		if ("loadOptionsInterval" in $$props) $$invalidate(54, loadOptionsInterval = $$props.loadOptionsInterval);
    		if ("noOptionsMessage" in $$props) $$invalidate(55, noOptionsMessage = $$props.noOptionsMessage);
    		if ("hideEmptyState" in $$props) $$invalidate(56, hideEmptyState = $$props.hideEmptyState);
    		if ("filteredItems" in $$props) $$invalidate(38, filteredItems = $$props.filteredItems);
    		if ("inputAttributes" in $$props) $$invalidate(57, inputAttributes = $$props.inputAttributes);
    		if ("listAutoWidth" in $$props) $$invalidate(58, listAutoWidth = $$props.listAutoWidth);
    		if ("itemHeight" in $$props) $$invalidate(59, itemHeight = $$props.itemHeight);
    		if ("Icon" in $$props) $$invalidate(17, Icon = $$props.Icon);
    		if ("iconProps" in $$props) $$invalidate(18, iconProps = $$props.iconProps);
    		if ("showChevron" in $$props) $$invalidate(19, showChevron = $$props.showChevron);
    		if ("showIndicator" in $$props) $$invalidate(20, showIndicator = $$props.showIndicator);
    		if ("containerClasses" in $$props) $$invalidate(21, containerClasses = $$props.containerClasses);
    		if ("indicatorSvg" in $$props) $$invalidate(22, indicatorSvg = $$props.indicatorSvg);
    		if ("ClearIcon" in $$props) $$invalidate(23, ClearIcon$1 = $$props.ClearIcon);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*isDisabled*/ 1024) ;

    		if ($$self.$$.dirty[1] & /*items*/ 16) {
    			updateSelectedValueDisplay(items);
    		}

    		if ($$self.$$.dirty[0] & /*selectedValue, isMulti*/ 257 | $$self.$$.dirty[1] & /*optionIdentifier*/ 131072) {
    			{
    				if (typeof selectedValue === "string") {
    					$$invalidate(0, selectedValue = {
    						[optionIdentifier]: selectedValue,
    						label: selectedValue
    					});
    				} else if (isMulti && Array.isArray(selectedValue) && selectedValue.length > 0) {
    					$$invalidate(0, selectedValue = selectedValue.map(item => typeof item === "string"
    					? { value: item, label: item }
    					: item));
    				}
    			}
    		}

    		if ($$self.$$.dirty[1] & /*noOptionsMessage, list*/ 16777248) {
    			{
    				if (noOptionsMessage && list) list.$set({ noOptionsMessage });
    			}
    		}

    		if ($$self.$$.dirty[0] & /*selectedValue, filterText*/ 3) {
    			$$invalidate(27, showSelectedItem = selectedValue && filterText.length === 0);
    		}

    		if ($$self.$$.dirty[0] & /*selectedValue*/ 1 | $$self.$$.dirty[1] & /*placeholder*/ 1024) {
    			$$invalidate(28, placeholderText = selectedValue ? "" : placeholder);
    		}

    		if ($$self.$$.dirty[0] & /*isSearchable*/ 16384 | $$self.$$.dirty[1] & /*inputAttributes*/ 67108864) {
    			{
    				$$invalidate(26, _inputAttributes = Object.assign(
    					{
    						autocomplete: "off",
    						autocorrect: "off",
    						spellcheck: false
    					},
    					inputAttributes
    				));

    				if (!isSearchable) {
    					$$invalidate(26, _inputAttributes.readonly = true, _inputAttributes);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*filterText, isMulti, selectedValue*/ 259 | $$self.$$.dirty[1] & /*items, loadOptions, originalItemsClone, optionIdentifier, itemFilter, getOptionLabel, groupBy, createGroupHeaderItem, isGroupHeaderSelectable, groupFilter*/ 537884688) {
    			{
    				let _filteredItems;
    				let _items = items;

    				if (items && items.length > 0 && typeof items[0] !== "object") {
    					_items = items.map((item, index) => {
    						return { index, value: item, label: item };
    					});
    				}

    				if (loadOptions && filterText.length === 0 && originalItemsClone) {
    					_filteredItems = JSON.parse(originalItemsClone);
    					_items = JSON.parse(originalItemsClone);
    				} else {
    					_filteredItems = loadOptions
    					? filterText.length === 0 ? [] : _items
    					: _items.filter(item => {
    							let keepItem = true;

    							if (isMulti && selectedValue) {
    								keepItem = !selectedValue.some(value => {
    									return value[optionIdentifier] === item[optionIdentifier];
    								});
    							}

    							if (!keepItem) return false;
    							if (filterText.length < 1) return true;
    							return itemFilter(getOptionLabel(item, filterText), filterText, item);
    						});
    				}

    				if (groupBy) {
    					const groupValues = [];
    					const groups = {};

    					_filteredItems.forEach(item => {
    						const groupValue = groupBy(item);

    						if (!groupValues.includes(groupValue)) {
    							groupValues.push(groupValue);
    							groups[groupValue] = [];

    							if (groupValue) {
    								groups[groupValue].push(Object.assign(createGroupHeaderItem(groupValue, item), {
    									id: groupValue,
    									isGroupHeader: true,
    									isSelectable: isGroupHeaderSelectable
    								}));
    							}
    						}

    						groups[groupValue].push(Object.assign({ isGroupItem: !!groupValue }, item));
    					});

    					const sortedGroupedItems = [];

    					groupFilter(groupValues).forEach(groupValue => {
    						sortedGroupedItems.push(...groups[groupValue]);
    					});

    					$$invalidate(38, filteredItems = sortedGroupedItems);
    				} else {
    					$$invalidate(38, filteredItems = _filteredItems);
    				}
    			}
    		}
    	};

    	return [
    		selectedValue,
    		filterText,
    		container,
    		input,
    		isFocused,
    		isWaiting,
    		Selection$1,
    		MultiSelection$1,
    		isMulti,
    		multiFullItemClearable,
    		isDisabled,
    		hasError,
    		containerStyles,
    		getSelectionLabel,
    		isSearchable,
    		inputStyles,
    		isClearable,
    		Icon,
    		iconProps,
    		showChevron,
    		showIndicator,
    		containerClasses,
    		indicatorSvg,
    		ClearIcon$1,
    		handleClear,
    		activeSelectedValue,
    		_inputAttributes,
    		showSelectedItem,
    		placeholderText,
    		handleMultiItemClear,
    		getPosition,
    		handleKeyDown,
    		handleFocus,
    		handleWindowClick,
    		handleClick,
    		items,
    		list,
    		listOpen,
    		filteredItems,
    		Item$1,
    		isCreatable,
    		placeholder,
    		itemFilter,
    		groupBy,
    		groupFilter,
    		isGroupHeaderSelectable,
    		getGroupHeaderLabel,
    		getOptionLabel,
    		optionIdentifier,
    		loadOptions,
    		createGroupHeaderItem,
    		createItem,
    		listPlacement,
    		isVirtualList,
    		loadOptionsInterval,
    		noOptionsMessage,
    		hideEmptyState,
    		inputAttributes,
    		listAutoWidth,
    		itemHeight,
    		originalItemsClone,
    		input_1_binding,
    		input_1_input_handler,
    		input_1_binding_1,
    		input_1_input_handler_1,
    		div_binding
    	];
    }

    class Select extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$w,
    			create_fragment$v,
    			safe_not_equal,
    			{
    				container: 2,
    				input: 3,
    				Item: 39,
    				Selection: 6,
    				MultiSelection: 7,
    				isMulti: 8,
    				multiFullItemClearable: 9,
    				isDisabled: 10,
    				isCreatable: 40,
    				isFocused: 4,
    				selectedValue: 0,
    				filterText: 1,
    				placeholder: 41,
    				items: 35,
    				itemFilter: 42,
    				groupBy: 43,
    				groupFilter: 44,
    				isGroupHeaderSelectable: 45,
    				getGroupHeaderLabel: 46,
    				getOptionLabel: 47,
    				optionIdentifier: 48,
    				loadOptions: 49,
    				hasError: 11,
    				containerStyles: 12,
    				getSelectionLabel: 13,
    				createGroupHeaderItem: 50,
    				createItem: 51,
    				isSearchable: 14,
    				inputStyles: 15,
    				isClearable: 16,
    				isWaiting: 5,
    				listPlacement: 52,
    				listOpen: 37,
    				list: 36,
    				isVirtualList: 53,
    				loadOptionsInterval: 54,
    				noOptionsMessage: 55,
    				hideEmptyState: 56,
    				filteredItems: 38,
    				inputAttributes: 57,
    				listAutoWidth: 58,
    				itemHeight: 59,
    				Icon: 17,
    				iconProps: 18,
    				showChevron: 19,
    				showIndicator: 20,
    				containerClasses: 21,
    				indicatorSvg: 22,
    				ClearIcon: 23,
    				handleClear: 24
    			},
    			[-1, -1, -1]
    		);
    	}

    	get handleClear() {
    		return this.$$.ctx[24];
    	}
    }

    /* src/components/Input/SelectInput.svelte generated by Svelte v3.38.2 */

    function create_fragment$u(ctx) {
    	let select;
    	let current;

    	select = new Select({
    			props: {
    				items: /*selectionOptions*/ ctx[1],
    				inputStyles: /*inputStyles*/ ctx[6],
    				selectedValue: /*selectedValuesArray*/ ctx[8].length !== 0
    				? /*selectedValuesArray*/ ctx[8]
    				: undefined,
    				isDisabled: /*disabled*/ ctx[5],
    				isMulti: /*isMulti*/ ctx[2],
    				isCreatable: /*isCreatable*/ ctx[3],
    				isClearable: /*isClearable*/ ctx[4],
    				placeholder: /*placeholder*/ ctx[7]
    			}
    		});

    	select.$on("select", /*select_handler*/ ctx[9]);
    	select.$on("clear", /*clear_handler*/ ctx[10]);

    	return {
    		c() {
    			create_component(select.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(select, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const select_changes = {};
    			if (dirty & /*selectionOptions*/ 2) select_changes.items = /*selectionOptions*/ ctx[1];
    			if (dirty & /*inputStyles*/ 64) select_changes.inputStyles = /*inputStyles*/ ctx[6];

    			if (dirty & /*selectedValuesArray*/ 256) select_changes.selectedValue = /*selectedValuesArray*/ ctx[8].length !== 0
    			? /*selectedValuesArray*/ ctx[8]
    			: undefined;

    			if (dirty & /*disabled*/ 32) select_changes.isDisabled = /*disabled*/ ctx[5];
    			if (dirty & /*isMulti*/ 4) select_changes.isMulti = /*isMulti*/ ctx[2];
    			if (dirty & /*isCreatable*/ 8) select_changes.isCreatable = /*isCreatable*/ ctx[3];
    			if (dirty & /*isClearable*/ 16) select_changes.isClearable = /*isClearable*/ ctx[4];
    			if (dirty & /*placeholder*/ 128) select_changes.placeholder = /*placeholder*/ ctx[7];
    			select.$set(select_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(select.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(select.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(select, detaching);
    		}
    	};
    }

    function instance$v($$self, $$props, $$invalidate) {
    	let selectedValuesArray;
    	let { selectedValuesString = "" } = $$props;
    	let { selectionOptions = [] } = $$props;
    	let { isMulti = true } = $$props;
    	let { isCreatable = true } = $$props;
    	let { isClearable = true } = $$props;
    	let { disabled = false } = $$props;
    	let { inputStyles = "cursor: pointer;" } = $$props;
    	let { placeholder = "Auswählen..." } = $$props;

    	const valuesToOptions = values => {
    		return values.map(value => selectionOptions.find(item => item === value || item.value === value) ?? value);
    	};

    	const selectedValuesFromString = valueString => {
    		let selectedValues = [];

    		if (valueString !== "") {
    			selectedValues = valuesToOptions(isMulti ? valueString.split(", ") : [valueString]);
    		}

    		if (!isMulti) {
    			selectedValues = selectedValues.length === 0 ? "" : selectedValues[0];
    		}

    		return selectedValues;
    	};

    	const select_handler = event => {
    		let selection = event.detail;

    		if (selection) {
    			if (!Array.isArray(selection)) selection = [selection];
    			$$invalidate(0, selectedValuesString = selection.map(item => item.value).join(", "));
    		} else {
    			$$invalidate(0, selectedValuesString = "");
    		}
    	};

    	const clear_handler = event => $$invalidate(0, selectedValuesString = "");

    	$$self.$$set = $$props => {
    		if ("selectedValuesString" in $$props) $$invalidate(0, selectedValuesString = $$props.selectedValuesString);
    		if ("selectionOptions" in $$props) $$invalidate(1, selectionOptions = $$props.selectionOptions);
    		if ("isMulti" in $$props) $$invalidate(2, isMulti = $$props.isMulti);
    		if ("isCreatable" in $$props) $$invalidate(3, isCreatable = $$props.isCreatable);
    		if ("isClearable" in $$props) $$invalidate(4, isClearable = $$props.isClearable);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ("inputStyles" in $$props) $$invalidate(6, inputStyles = $$props.inputStyles);
    		if ("placeholder" in $$props) $$invalidate(7, placeholder = $$props.placeholder);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedValuesString*/ 1) {
    			$$invalidate(8, selectedValuesArray = selectedValuesFromString(selectedValuesString));
    		}
    	};

    	return [
    		selectedValuesString,
    		selectionOptions,
    		isMulti,
    		isCreatable,
    		isClearable,
    		disabled,
    		inputStyles,
    		placeholder,
    		selectedValuesArray,
    		select_handler,
    		clear_handler
    	];
    }

    class SelectInput extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$v, create_fragment$u, safe_not_equal, {
    			selectedValuesString: 0,
    			selectionOptions: 1,
    			isMulti: 2,
    			isCreatable: 3,
    			isClearable: 4,
    			disabled: 5,
    			inputStyles: 6,
    			placeholder: 7
    		});
    	}
    }

    /* src/components/Input/SearchFilterBar.svelte generated by Svelte v3.38.2 */

    function create_fragment$t(ctx) {
    	let div1;
    	let div0;
    	let input;
    	let t;
    	let selectinput;
    	let updating_selectedValuesString;
    	let current;
    	let mounted;
    	let dispose;

    	function selectinput_selectedValuesString_binding(value) {
    		/*selectinput_selectedValuesString_binding*/ ctx[11](value);
    	}

    	let selectinput_props = {
    		selectionOptions: /*filterOptions*/ ctx[1],
    		placeholder: "Filter",
    		isMulti: true,
    		inputStyles: "font-size: 16px; cursor: pointer;",
    		listAutoWidth: false,
    		isSearchable: false,
    		isCreatable: false
    	};

    	if (/*selectedValuesString*/ ctx[2] !== void 0) {
    		selectinput_props.selectedValuesString = /*selectedValuesString*/ ctx[2];
    	}

    	selectinput = new SelectInput({ props: selectinput_props });
    	binding_callbacks.push(() => bind$1(selectinput, "selectedValuesString", selectinput_selectedValuesString_binding));

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t = space();
    			create_component(selectinput.$$.fragment);
    			attr(input, "class", "searchInput svelte-13z3r12");
    			attr(input, "type", "text");
    			attr(input, "placeholder", "Suche");
    			attr(div0, "class", "searchFilterBar svelte-13z3r12");
    			attr(div1, "class", "container svelte-13z3r12");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, input);
    			/*input_binding*/ ctx[8](input);
    			set_input_value(input, /*undebouncedSearchTerm*/ ctx[4]);
    			append(div0, t);
    			mount_component(selectinput, div0, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input, "input", /*input_input_handler*/ ctx[9]),
    					listen(input, "input", /*input_handler*/ ctx[10]),
    					listen(div1, "keydown", keydown_handler$2)
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*undebouncedSearchTerm*/ 16 && input.value !== /*undebouncedSearchTerm*/ ctx[4]) {
    				set_input_value(input, /*undebouncedSearchTerm*/ ctx[4]);
    			}

    			const selectinput_changes = {};
    			if (dirty & /*filterOptions*/ 2) selectinput_changes.selectionOptions = /*filterOptions*/ ctx[1];

    			if (!updating_selectedValuesString && dirty & /*selectedValuesString*/ 4) {
    				updating_selectedValuesString = true;
    				selectinput_changes.selectedValuesString = /*selectedValuesString*/ ctx[2];
    				add_flush_callback(() => updating_selectedValuesString = false);
    			}

    			selectinput.$set(selectinput_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(selectinput.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(selectinput.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			/*input_binding*/ ctx[8](null);
    			destroy_component(selectinput);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const keydown_handler$2 = event => {
    	if (event.key == "ArrowLeft" || event.key == "ArrowRight") event.stopPropagation();
    };

    function instance$u($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { filterOptions = [] } = $$props;
    	let { activeFilters = [] } = $$props;
    	let { searchTerm = "" } = $$props;
    	const focusSearchInput = () => searchInputRef.focus();
    	let searchInputRef;
    	let undebouncedSearchTerm = "";
    	let selectedValuesString = "";
    	let timer;

    	const debounce = functionAfterDebounce => {
    		clearTimeout(timer);

    		timer = setTimeout(
    			() => {
    				functionAfterDebounce();
    			},
    			750
    		);
    	};

    	const selectedValuesStringFromActiveFilters = () => {
    		if (selectedValuesString !== activeFilters.join(", ")) {
    			$$invalidate(2, selectedValuesString = activeFilters.join(", "));
    		}
    	};

    	const activeFiltersFromSelectedValuesString = () => {
    		if (selectedValuesString !== activeFilters.join(", ")) {
    			$$invalidate(6, activeFilters = selectedValuesString.split(", ").filter(val => val !== ""));
    			dispatch("filtersChanged", activeFilters);
    		}
    	};

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			searchInputRef = $$value;
    			$$invalidate(3, searchInputRef);
    		});
    	}

    	function input_input_handler() {
    		undebouncedSearchTerm = this.value;
    		($$invalidate(4, undebouncedSearchTerm), $$invalidate(0, searchTerm));
    	}

    	const input_handler = event => debounce(() => $$invalidate(0, searchTerm = event.target.value));

    	function selectinput_selectedValuesString_binding(value) {
    		selectedValuesString = value;
    		$$invalidate(2, selectedValuesString);
    	}

    	$$self.$$set = $$props => {
    		if ("filterOptions" in $$props) $$invalidate(1, filterOptions = $$props.filterOptions);
    		if ("activeFilters" in $$props) $$invalidate(6, activeFilters = $$props.activeFilters);
    		if ("searchTerm" in $$props) $$invalidate(0, searchTerm = $$props.searchTerm);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*searchTerm*/ 1) {
    			$$invalidate(4, undebouncedSearchTerm = searchTerm);
    		}

    		if ($$self.$$.dirty & /*activeFilters*/ 64) {
    			(selectedValuesStringFromActiveFilters());
    		}

    		if ($$self.$$.dirty & /*selectedValuesString*/ 4) {
    			(activeFiltersFromSelectedValuesString());
    		}
    	};

    	return [
    		searchTerm,
    		filterOptions,
    		selectedValuesString,
    		searchInputRef,
    		undebouncedSearchTerm,
    		debounce,
    		activeFilters,
    		focusSearchInput,
    		input_binding,
    		input_input_handler,
    		input_handler,
    		selectinput_selectedValuesString_binding
    	];
    }

    class SearchFilterBar extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$u, create_fragment$t, safe_not_equal, {
    			filterOptions: 1,
    			activeFilters: 6,
    			searchTerm: 0,
    			focusSearchInput: 7
    		});
    	}

    	get focusSearchInput() {
    		return this.$$.ctx[7];
    	}
    }

    /* src/components/Table/Pagination.svelte generated by Svelte v3.38.2 */

    function get_each_context$b(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>   import { Diamonds }
    function create_catch_block$2(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (62:0) {:then numberOfPages}
    function create_then_block$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*numberOfPages*/ ctx[2] > 1 && create_if_block$a(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (/*numberOfPages*/ ctx[2] > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (63:2) {#if numberOfPages > 1}
    function create_if_block$a(ctx) {
    	let div1;
    	let div0;
    	let a0;
    	let t1;
    	let t2;
    	let a1;
    	let mounted;
    	let dispose;
    	let each_value = /*pageButtons*/ ctx[3];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$b(get_each_context$b(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "«";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			a1 = element("a");
    			a1.textContent = "»";
    			attr(a0, "href", "#/");
    			attr(a0, "class", "svelte-7a8yig");
    			attr(a1, "href", "#/");
    			attr(a1, "class", "svelte-7a8yig");
    			attr(div0, "class", "pagination svelte-7a8yig");
    			attr(div1, "class", "container svelte-7a8yig");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, a0);
    			append(div0, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append(div0, t2);
    			append(div0, a1);

    			if (!mounted) {
    				dispose = [
    					listen(a0, "click", prevent_default(/*click_handler_1*/ ctx[7])),
    					listen(a1, "click", prevent_default(/*click_handler_3*/ ctx[9]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*pageButtons, currentPage, setPage*/ 25) {
    				each_value = /*pageButtons*/ ctx[3];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$b(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$b(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (76:10) {:else}
    function create_else_block$7(ctx) {
    	let a;
    	let t_value = /*pageButton*/ ctx[11] + "";
    	let t;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			a = element("a");
    			t = text(t_value);
    			attr(a, "href", "#/");
    			attr(a, "class", "disabled svelte-7a8yig");
    		},
    		m(target, anchor) {
    			insert(target, a, anchor);
    			append(a, t);

    			if (!mounted) {
    				dispose = listen(a, "click", prevent_default(/*click_handler*/ ctx[5]));
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*pageButtons*/ 8 && t_value !== (t_value = /*pageButton*/ ctx[11] + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(a);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (68:10) {#if typeof pageButton === "number"}
    function create_if_block_1$4(ctx) {
    	let a;
    	let t_value = /*pageButton*/ ctx[11] + 1 + "";
    	let t;
    	let a_class_value;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[8](/*pageButton*/ ctx[11]);
    	}

    	return {
    		c() {
    			a = element("a");
    			t = text(t_value);
    			attr(a, "href", "#/");

    			attr(a, "class", a_class_value = "" + (null_to_empty(/*pageButton*/ ctx[11] === /*currentPage*/ ctx[0]
    			? "active"
    			: "") + " svelte-7a8yig"));
    		},
    		m(target, anchor) {
    			insert(target, a, anchor);
    			append(a, t);

    			if (!mounted) {
    				dispose = listen(a, "click", prevent_default(click_handler_2));
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*pageButtons*/ 8 && t_value !== (t_value = /*pageButton*/ ctx[11] + 1 + "")) set_data(t, t_value);

    			if (dirty & /*pageButtons, currentPage*/ 9 && a_class_value !== (a_class_value = "" + (null_to_empty(/*pageButton*/ ctx[11] === /*currentPage*/ ctx[0]
    			? "active"
    			: "") + " svelte-7a8yig"))) {
    				attr(a, "class", a_class_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(a);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (67:8) {#each pageButtons as pageButton}
    function create_each_block$b(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*pageButton*/ ctx[11] === "number") return create_if_block_1$4;
    		return create_else_block$7;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (56:29)    <div class="container">     <div class="pagination">       <Diamonds size="100" color="#fc03a9" unit="px" />     </div>   </div> {:then numberOfPages}
    function create_pending_block$2(ctx) {
    	let div1;
    	let div0;
    	let diamonds;
    	let current;

    	diamonds = new Diamonds({
    			props: {
    				size: "100",
    				color: "#fc03a9",
    				unit: "px"
    			}
    		});

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(diamonds.$$.fragment);
    			attr(div0, "class", "pagination svelte-7a8yig");
    			attr(div1, "class", "container svelte-7a8yig");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			mount_component(diamonds, div0, null);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(diamonds.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(diamonds.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_component(diamonds);
    		}
    	};
    }

    function create_fragment$s(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;
    	let mounted;
    	let dispose;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$2,
    		then: create_then_block$2,
    		catch: create_catch_block$2,
    		value: 2,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*numberOfPagesPromise*/ ctx[1], info);

    	return {
    		c() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m(target, anchor) {
    			insert(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;

    			if (!mounted) {
    				dispose = listen(window, "keydown", /*keydown_handler*/ ctx[6]);
    				mounted = true;
    			}
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*numberOfPagesPromise*/ 2 && promise !== (promise = /*numberOfPagesPromise*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let { numberOfPagesPromise } = $$props;
    	let { currentPage } = $$props;
    	let pageButtons = [];
    	let numberOfPages = 1;

    	function calculatePageButtons(numberOfPages) {
    		if (numberOfPages === 0) {
    			$$invalidate(3, pageButtons = [0]);
    		} else {
    			$$invalidate(3, pageButtons = [
    				currentPage - 2,
    				currentPage - 1,
    				currentPage,
    				currentPage + 1,
    				currentPage + 2
    			]);

    			if (pageButtons[0] >= 3) {
    				$$invalidate(3, pageButtons = [0, "...", ...pageButtons]);
    			} else {
    				while (pageButtons[0] > 0) pageButtons.unshift(pageButtons[0] - 1);
    			}

    			if (numberOfPages - 1 - pageButtons[pageButtons.length - 1] >= 3) {
    				$$invalidate(3, pageButtons = [...pageButtons, "...", numberOfPages - 1]);
    			} else {
    				while (pageButtons[pageButtons.length - 1] < numberOfPages - 1) pageButtons.push(pageButtons[pageButtons.length - 1] + 1);
    			}

    			$$invalidate(3, pageButtons = pageButtons.filter(button => button === "..." || button >= 0 && button < numberOfPages));
    		}
    	}

    	function setPage(page = currentPage) {
    		page = Math.min(page, numberOfPages - 1);
    		page = Math.max(page, 0);
    		$$invalidate(0, currentPage = page);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const keydown_handler = event => {
    		if (event.key == "ArrowLeft") {
    			setPage(currentPage - 1);
    		} else if (event.key == "ArrowRight") {
    			setPage(currentPage + 1);
    		}
    	};

    	const click_handler_1 = () => setPage(currentPage - 1);
    	const click_handler_2 = pageButton => setPage(pageButton);
    	const click_handler_3 = () => setPage(currentPage + 1);

    	$$self.$$set = $$props => {
    		if ("numberOfPagesPromise" in $$props) $$invalidate(1, numberOfPagesPromise = $$props.numberOfPagesPromise);
    		if ("currentPage" in $$props) $$invalidate(0, currentPage = $$props.currentPage);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*numberOfPagesPromise*/ 2) {
    			numberOfPagesPromise.then(n => $$invalidate(2, numberOfPages = n));
    		}

    		if ($$self.$$.dirty & /*currentPage, numberOfPages*/ 5) {
    			(calculatePageButtons(numberOfPages));
    		}
    	};

    	return [
    		currentPage,
    		numberOfPagesPromise,
    		numberOfPages,
    		pageButtons,
    		setPage,
    		click_handler,
    		keydown_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Pagination extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$t, create_fragment$s, safe_not_equal, { numberOfPagesPromise: 1, currentPage: 0 });
    	}
    }

    /* src/components/Table/Cell.svelte generated by Svelte v3.38.2 */

    function create_catch_block$1(ctx) {
    	return { c: noop, m: noop, p: noop, d: noop };
    }

    // (36:37)      {#if isImage}
    function create_then_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*isImage*/ ctx[1]) return create_if_block$9;
    		return create_else_block$6;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (41:4) {:else}
    function create_else_block$6(ctx) {
    	let div;
    	let t_value = /*value*/ ctx[5] + "";
    	let t;
    	let div_style_value;

    	return {
    		c() {
    			div = element("div");
    			t = text(t_value);
    			attr(div, "class", "cell svelte-y6ffx1");
    			attr(div, "style", div_style_value = `max-height: ${/*rowHeight*/ ctx[3]}px;`);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*valueFunction*/ 4 && t_value !== (t_value = /*value*/ ctx[5] + "")) set_data(t, t_value);

    			if (dirty & /*rowHeight*/ 8 && div_style_value !== (div_style_value = `max-height: ${/*rowHeight*/ ctx[3]}px;`)) {
    				attr(div, "style", div_style_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    // (37:4) {#if isImage}
    function create_if_block$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*value*/ ctx[5] && /*value*/ ctx[5] !== "" && create_if_block_1$3(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (/*value*/ ctx[5] && /*value*/ ctx[5] !== "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (38:6) {#if value && value !== ""}
    function create_if_block_1$3(ctx) {
    	let img;
    	let img_src_value;

    	return {
    		c() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*value*/ ctx[5])) attr(img, "src", img_src_value);
    			attr(img, "alt", "item");
    			attr(img, "class", "svelte-y6ffx1");
    		},
    		m(target, anchor) {
    			insert(target, img, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*valueFunction*/ 4 && img.src !== (img_src_value = /*value*/ ctx[5])) {
    				attr(img, "src", img_src_value);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(img);
    		}
    	};
    }

    // (1:0) <script>   export let backgroundColor = "white";   export let isImage = false;   export let valueFunction = async () => "";   export let rowHeight = 40;    let fontColor = "black";    function brightnessByColor(color) {     var color = "" + color,       isHEX = color.indexOf("#") == 0,       isRGB = color.indexOf("rgb") == 0;     if (isHEX) {       var m = color.substr(1).match(color.length == 7 ? /(\S{2}
    function create_pending_block$1(ctx) {
    	return { c: noop, m: noop, p: noop, d: noop };
    }

    function create_fragment$r(ctx) {
    	let td;
    	let promise;
    	let td_style_value;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1,
    		value: 5
    	};

    	handle_promise(promise = /*valueFunction*/ ctx[2](), info);

    	return {
    		c() {
    			td = element("td");
    			info.block.c();
    			attr(td, "style", td_style_value = `background-color: ${/*backgroundColor*/ ctx[0]}; color: ${/*fontColor*/ ctx[4]}; height: ${/*rowHeight*/ ctx[3]}px;`);
    			attr(td, "class", "svelte-y6ffx1");
    		},
    		m(target, anchor) {
    			insert(target, td, anchor);
    			info.block.m(td, info.anchor = null);
    			info.mount = () => td;
    			info.anchor = null;
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*valueFunction*/ 4 && promise !== (promise = /*valueFunction*/ ctx[2]()) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			if (dirty & /*backgroundColor, fontColor, rowHeight*/ 25 && td_style_value !== (td_style_value = `background-color: ${/*backgroundColor*/ ctx[0]}; color: ${/*fontColor*/ ctx[4]}; height: ${/*rowHeight*/ ctx[3]}px;`)) {
    				attr(td, "style", td_style_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(td);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};
    }

    function brightnessByColor(color) {
    	var color = "" + color,
    		isHEX = color.indexOf("#") == 0,
    		isRGB = color.indexOf("rgb") == 0;

    	if (isHEX) {
    		var m = color.substr(1).match(color.length == 7 ? /(\S{2})/g : /(\S{1})/g);
    		if (m) var r = parseInt(m[0], 16), g = parseInt(m[1], 16), b = parseInt(m[2], 16);
    	}

    	if (isRGB) {
    		var m = color.match(/rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)/);
    		if (m) var r = m[1], g = m[2], b = m[3];
    	}

    	if (typeof r != "undefined") return (r * 299 + g * 587 + b * 114) / 1000;
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { backgroundColor = "white" } = $$props;
    	let { isImage = false } = $$props;
    	let { valueFunction = async () => "" } = $$props;
    	let { rowHeight = 40 } = $$props;
    	let fontColor = "black";

    	$$self.$$set = $$props => {
    		if ("backgroundColor" in $$props) $$invalidate(0, backgroundColor = $$props.backgroundColor);
    		if ("isImage" in $$props) $$invalidate(1, isImage = $$props.isImage);
    		if ("valueFunction" in $$props) $$invalidate(2, valueFunction = $$props.valueFunction);
    		if ("rowHeight" in $$props) $$invalidate(3, rowHeight = $$props.rowHeight);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*backgroundColor*/ 1) {
    			if (brightnessByColor(backgroundColor) < 125) {
    				$$invalidate(4, fontColor = "white"); // adaptive font color for darker highlight
    			}
    		}
    	};

    	return [backgroundColor, isImage, valueFunction, rowHeight, fontColor];
    }

    class Cell extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$s, create_fragment$r, safe_not_equal, {
    			backgroundColor: 0,
    			isImage: 1,
    			valueFunction: 2,
    			rowHeight: 3
    		});
    	}
    }

    /* src/components/Table/Row.svelte generated by Svelte v3.38.2 */

    function get_each_context$a(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (25:2) {#each columns as col, i}
    function create_each_block$a(ctx) {
    	let cell;
    	let current;

    	function func() {
    		return /*func*/ ctx[8](/*col*/ ctx[9]);
    	}

    	cell = new Cell({
    			props: {
    				rowHeight: /*rowHeight*/ ctx[2],
    				isImage: /*col*/ ctx[9].isImageUrl,
    				valueFunction: func,
    				backgroundColor: /*cellBackgroundColors*/ ctx[3][/*i*/ ctx[11]]
    			}
    		});

    	return {
    		c() {
    			create_component(cell.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(cell, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const cell_changes = {};
    			if (dirty & /*rowHeight*/ 4) cell_changes.rowHeight = /*rowHeight*/ ctx[2];
    			if (dirty & /*columns*/ 1) cell_changes.isImage = /*col*/ ctx[9].isImageUrl;
    			if (dirty & /*columns, item*/ 3) cell_changes.valueFunction = func;
    			if (dirty & /*cellBackgroundColors*/ 8) cell_changes.backgroundColor = /*cellBackgroundColors*/ ctx[3][/*i*/ ctx[11]];
    			cell.$set(cell_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(cell.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(cell.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(cell, detaching);
    		}
    	};
    }

    function create_fragment$q(ctx) {
    	let tr;
    	let tr_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*columns*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$a(get_each_context$a(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(tr, "style", tr_style_value = `height: ${/*rowHeight*/ ctx[2]}px;`);
    			attr(tr, "class", "svelte-fuste0");
    		},
    		m(target, anchor) {
    			insert(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(tr, "click", /*click_handler*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*rowHeight, columns, displayValue, item, cellBackgroundColors*/ 31) {
    				each_value = /*columns*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$a(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$a(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*rowHeight*/ 4 && tr_style_value !== (tr_style_value = `height: ${/*rowHeight*/ ctx[2]}px;`)) {
    				attr(tr, "style", tr_style_value);
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { columns = [] } = $$props;
    	let { item = {} } = $$props;
    	let { rowHeight = 40 } = $$props;
    	let { cellBackgroundColorsFunction } = $$props;
    	let { evenRowNumber = false } = $$props;

    	const displayValue = async (col, item) => {
    		if (!(col.key in item)) {
    			return "";
    		} else {
    			return col.display
    			? await col.display(item[col.key])
    			: item[col.key];
    		}
    	};

    	let cellBackgroundColors = new Array(columns.length).fill("white");

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const func = col => displayValue(col, item);

    	$$self.$$set = $$props => {
    		if ("columns" in $$props) $$invalidate(0, columns = $$props.columns);
    		if ("item" in $$props) $$invalidate(1, item = $$props.item);
    		if ("rowHeight" in $$props) $$invalidate(2, rowHeight = $$props.rowHeight);
    		if ("cellBackgroundColorsFunction" in $$props) $$invalidate(5, cellBackgroundColorsFunction = $$props.cellBackgroundColorsFunction);
    		if ("evenRowNumber" in $$props) $$invalidate(6, evenRowNumber = $$props.evenRowNumber);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*cellBackgroundColorsFunction, item, evenRowNumber*/ 98) {
    			cellBackgroundColorsFunction(item, evenRowNumber).then(newCellBackgroundColors => $$invalidate(3, cellBackgroundColors = newCellBackgroundColors));
    		}
    	};

    	return [
    		columns,
    		item,
    		rowHeight,
    		cellBackgroundColors,
    		displayValue,
    		cellBackgroundColorsFunction,
    		evenRowNumber,
    		click_handler,
    		func
    	];
    }

    class Row extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$r, create_fragment$q, safe_not_equal, {
    			columns: 0,
    			item: 1,
    			rowHeight: 2,
    			cellBackgroundColorsFunction: 5,
    			evenRowNumber: 6
    		});
    	}
    }

    /* node_modules/fa-svelte/src/Icon.svelte generated by Svelte v3.38.2 */

    function create_fragment$p(ctx) {
    	let svg;
    	let path_1;
    	let svg_class_value;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			attr(path_1, "fill", "currentColor");
    			attr(path_1, "d", /*path*/ ctx[0]);
    			attr(svg, "aria-hidden", "true");
    			attr(svg, "class", svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-1d15yci"));
    			attr(svg, "role", "img");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(svg, "viewBox", /*viewBox*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path_1);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*path*/ 1) {
    				attr(path_1, "d", /*path*/ ctx[0]);
    			}

    			if (dirty & /*classes*/ 2 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-1d15yci"))) {
    				attr(svg, "class", svg_class_value);
    			}

    			if (dirty & /*viewBox*/ 4) {
    				attr(svg, "viewBox", /*viewBox*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { icon } = $$props;
    	let path = [];
    	let classes = "";
    	let viewBox = "";

    	$$self.$$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("icon" in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 8) {
    			$$invalidate(2, viewBox = "0 0 " + icon.icon[0] + " " + icon.icon[1]);
    		}

    		$$invalidate(1, classes = "fa-svelte " + ($$props.class ? $$props.class : ""));

    		if ($$self.$$.dirty & /*icon*/ 8) {
    			$$invalidate(0, path = icon.icon[4]);
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [path, classes, viewBox, icon];
    }

    class Icon extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$q, create_fragment$p, safe_not_equal, { icon: 3 });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var faSort = {};

    (function (exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'sort';
    var width = 320;
    var height = 512;
    var ligatures = [];
    var unicode = 'f0dc';
    var svgPathData = 'M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faSort = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    }(faSort));

    var faSortDown = {};

    (function (exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'sort-down';
    var width = 320;
    var height = 512;
    var ligatures = [];
    var unicode = 'f0dd';
    var svgPathData = 'M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faSortDown = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    }(faSortDown));

    var faSortUp = {};

    (function (exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'sort-up';
    var width = 320;
    var height = 512;
    var ligatures = [];
    var unicode = 'f0de';
    var svgPathData = 'M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faSortUp = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    }(faSortUp));

    /* src/components/Table/Header.svelte generated by Svelte v3.38.2 */

    function get_each_context$9(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (23:6) {:else}
    function create_else_block$5(ctx) {
    	let th;
    	let t0_value = /*col*/ ctx[7].title + "";
    	let t0;
    	let t1;
    	let span0;
    	let icon0;
    	let t2;
    	let span1;
    	let icon1;
    	let t3;
    	let span2;
    	let icon2;
    	let t4;
    	let current;
    	let mounted;
    	let dispose;
    	icon0 = new Icon({ props: { icon: faSort.faSort } });
    	icon1 = new Icon({ props: { icon: faSortUp.faSortUp } });
    	icon2 = new Icon({ props: { icon: faSortDown.faSortDown } });

    	function mouseover_handler() {
    		return /*mouseover_handler*/ ctx[5](/*col*/ ctx[7]);
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*col*/ ctx[7]);
    	}

    	return {
    		c() {
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			span0 = element("span");
    			create_component(icon0.$$.fragment);
    			t2 = space();
    			span1 = element("span");
    			create_component(icon1.$$.fragment);
    			t3 = space();
    			span2 = element("span");
    			create_component(icon2.$$.fragment);
    			t4 = space();
    			attr(span0, "class", "sort-indicator svelte-whzxrs");
    			toggle_class(span0, "visible", /*mouseOverColHeader*/ ctx[2][/*col*/ ctx[7].key]);
    			attr(span1, "class", "sort-indicator-up svelte-whzxrs");
    			toggle_class(span1, "visible", /*indicateSort*/ ctx[1][/*i*/ ctx[9]] === "up" && !/*mouseOverColHeader*/ ctx[2][/*col*/ ctx[7].key]);
    			attr(span2, "class", "sort-indicator-down svelte-whzxrs");
    			toggle_class(span2, "visible", /*indicateSort*/ ctx[1][/*i*/ ctx[9]] === "down" && !/*mouseOverColHeader*/ ctx[2][/*col*/ ctx[7].key]);
    			attr(th, "class", "clickable svelte-whzxrs");
    		},
    		m(target, anchor) {
    			insert(target, th, anchor);
    			append(th, t0);
    			append(th, t1);
    			append(th, span0);
    			mount_component(icon0, span0, null);
    			append(th, t2);
    			append(th, span1);
    			mount_component(icon1, span1, null);
    			append(th, t3);
    			append(th, span2);
    			mount_component(icon2, span2, null);
    			append(th, t4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(th, "mouseout", /*mouseout_handler*/ ctx[4]),
    					listen(th, "mouseover", mouseover_handler),
    					listen(th, "click", click_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*columns*/ 1) && t0_value !== (t0_value = /*col*/ ctx[7].title + "")) set_data(t0, t0_value);

    			if (dirty & /*mouseOverColHeader, columns*/ 5) {
    				toggle_class(span0, "visible", /*mouseOverColHeader*/ ctx[2][/*col*/ ctx[7].key]);
    			}

    			if (dirty & /*indicateSort, mouseOverColHeader, columns*/ 7) {
    				toggle_class(span1, "visible", /*indicateSort*/ ctx[1][/*i*/ ctx[9]] === "up" && !/*mouseOverColHeader*/ ctx[2][/*col*/ ctx[7].key]);
    			}

    			if (dirty & /*indicateSort, mouseOverColHeader, columns*/ 7) {
    				toggle_class(span2, "visible", /*indicateSort*/ ctx[1][/*i*/ ctx[9]] === "down" && !/*mouseOverColHeader*/ ctx[2][/*col*/ ctx[7].key]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			transition_in(icon2.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			transition_out(icon2.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(th);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			destroy_component(icon2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (19:6) {#if col.disableSort}
    function create_if_block$8(ctx) {
    	let th;
    	let t0_value = /*col*/ ctx[7].title + "";
    	let t0;
    	let t1;

    	return {
    		c() {
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(th, "class", "svelte-whzxrs");
    		},
    		m(target, anchor) {
    			insert(target, th, anchor);
    			append(th, t0);
    			append(th, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*columns*/ 1 && t0_value !== (t0_value = /*col*/ ctx[7].title + "")) set_data(t0, t0_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(th);
    		}
    	};
    }

    // (18:4) {#each columns as col, i}
    function create_each_block$9(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$8, create_else_block$5];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*col*/ ctx[7].disableSort) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function create_fragment$o(ctx) {
    	let thead;
    	let tr;
    	let current;
    	let each_value = /*columns*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$9(get_each_context$9(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(tr, "class", "svelte-whzxrs");
    		},
    		m(target, anchor) {
    			insert(target, thead, anchor);
    			append(thead, tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*columns, mouseOverColHeader, dispatch, indicateSort, faSortDown, faSortUp, faSort*/ 15) {
    				each_value = /*columns*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$9(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$9(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(thead);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance$p($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { columns = [] } = $$props;
    	let { indicateSort = [] } = $$props;
    	let mouseOverColHeader = {};
    	const mouseout_handler = () => $$invalidate(2, mouseOverColHeader = {});

    	const mouseover_handler = col => {
    		$$invalidate(2, mouseOverColHeader = {});
    		$$invalidate(2, mouseOverColHeader[col.key] = true, mouseOverColHeader);
    	};

    	const click_handler = col => dispatch("colHeaderClicked", col);

    	$$self.$$set = $$props => {
    		if ("columns" in $$props) $$invalidate(0, columns = $$props.columns);
    		if ("indicateSort" in $$props) $$invalidate(1, indicateSort = $$props.indicateSort);
    	};

    	return [
    		columns,
    		indicateSort,
    		mouseOverColHeader,
    		dispatch,
    		mouseout_handler,
    		mouseover_handler,
    		click_handler
    	];
    }

    class Header extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$p, create_fragment$o, safe_not_equal, { columns: 0, indicateSort: 1 });
    	}
    }

    /* src/components/Table/Table.svelte generated by Svelte v3.38.2 */

    function get_each_context$8(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    // (16:4) {#each data as row, i (row._id)}
    function create_each_block$8(key_1, ctx) {
    	let first;
    	let row;
    	let current;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*row*/ ctx[8]);
    	}

    	row = new Row({
    			props: {
    				cellBackgroundColorsFunction: /*cellBackgroundColorsFunction*/ ctx[2],
    				columns: /*columns*/ ctx[0],
    				item: /*row*/ ctx[8],
    				rowHeight: /*rowHeight*/ ctx[1],
    				evenRowNumber: /*i*/ ctx[10] % 2 == 0
    			}
    		});

    	row.$on("click", click_handler);

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(row.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(row, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const row_changes = {};
    			if (dirty & /*cellBackgroundColorsFunction*/ 4) row_changes.cellBackgroundColorsFunction = /*cellBackgroundColorsFunction*/ ctx[2];
    			if (dirty & /*columns*/ 1) row_changes.columns = /*columns*/ ctx[0];
    			if (dirty & /*data*/ 8) row_changes.item = /*row*/ ctx[8];
    			if (dirty & /*rowHeight*/ 2) row_changes.rowHeight = /*rowHeight*/ ctx[1];
    			if (dirty & /*data*/ 8) row_changes.evenRowNumber = /*i*/ ctx[10] % 2 == 0;
    			row.$set(row_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(row.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(row.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(row, detaching);
    		}
    	};
    }

    function create_fragment$n(ctx) {
    	let div;
    	let table;
    	let header;
    	let t;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;

    	header = new Header({
    			props: {
    				columns: /*columns*/ ctx[0],
    				indicateSort: /*indicateSort*/ ctx[4]
    			}
    		});

    	header.$on("colHeaderClicked", /*colHeaderClicked_handler*/ ctx[6]);
    	let each_value = /*data*/ ctx[3];
    	const get_key = ctx => /*row*/ ctx[8]._id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$8(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$8(key, child_ctx));
    	}

    	return {
    		c() {
    			div = element("div");
    			table = element("table");
    			create_component(header.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(table, "class", "svelte-vl8nuy");
    			attr(div, "class", "tablecontainer svelte-vl8nuy");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, table);
    			mount_component(header, table, null);
    			append(table, t);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*columns*/ 1) header_changes.columns = /*columns*/ ctx[0];
    			if (dirty & /*indicateSort*/ 16) header_changes.indicateSort = /*indicateSort*/ ctx[4];
    			header.$set(header_changes);

    			if (dirty & /*cellBackgroundColorsFunction, columns, data, rowHeight, dispatch*/ 47) {
    				each_value = /*data*/ ctx[3];
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, table, outro_and_destroy_block, create_each_block$8, null, get_each_context$8);
    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			transition_out(header.$$.fragment, local);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(header);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { columns = [] } = $$props;
    	let { rowHeight = 40 } = $$props;
    	let { cellBackgroundColorsFunction } = $$props;
    	let { data } = $$props;
    	let { indicateSort = {} } = $$props;
    	const dispatch = createEventDispatcher();

    	function colHeaderClicked_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler = row => dispatch("rowClicked", row);

    	$$self.$$set = $$props => {
    		if ("columns" in $$props) $$invalidate(0, columns = $$props.columns);
    		if ("rowHeight" in $$props) $$invalidate(1, rowHeight = $$props.rowHeight);
    		if ("cellBackgroundColorsFunction" in $$props) $$invalidate(2, cellBackgroundColorsFunction = $$props.cellBackgroundColorsFunction);
    		if ("data" in $$props) $$invalidate(3, data = $$props.data);
    		if ("indicateSort" in $$props) $$invalidate(4, indicateSort = $$props.indicateSort);
    	};

    	return [
    		columns,
    		rowHeight,
    		cellBackgroundColorsFunction,
    		data,
    		indicateSort,
    		dispatch,
    		colHeaderClicked_handler,
    		click_handler
    	];
    }

    class Table extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$o, create_fragment$n, safe_not_equal, {
    			columns: 0,
    			rowHeight: 1,
    			cellBackgroundColorsFunction: 2,
    			data: 3,
    			indicateSort: 4
    		});
    	}
    }

    var logger = {exports: {}};

    /*!
     * js-logger - http://github.com/jonnyreeves/js-logger
     * Jonny Reeves, http://jonnyreeves.co.uk/
     * js-logger may be freely distributed under the MIT license.
     */

    (function (module) {
    (function (global) {

    	// Top level module for the global, static logger instance.
    	var Logger = { };

    	// For those that are at home that are keeping score.
    	Logger.VERSION = "1.6.1";

    	// Function which handles all incoming log messages.
    	var logHandler;

    	// Map of ContextualLogger instances by name; used by Logger.get() to return the same named instance.
    	var contextualLoggersByNameMap = {};

    	// Polyfill for ES5's Function.bind.
    	var bind = function(scope, func) {
    		return function() {
    			return func.apply(scope, arguments);
    		};
    	};

    	// Super exciting object merger-matron 9000 adding another 100 bytes to your download.
    	var merge = function () {
    		var args = arguments, target = args[0], key, i;
    		for (i = 1; i < args.length; i++) {
    			for (key in args[i]) {
    				if (!(key in target) && args[i].hasOwnProperty(key)) {
    					target[key] = args[i][key];
    				}
    			}
    		}
    		return target;
    	};

    	// Helper to define a logging level object; helps with optimisation.
    	var defineLogLevel = function(value, name) {
    		return { value: value, name: name };
    	};

    	// Predefined logging levels.
    	Logger.TRACE = defineLogLevel(1, 'TRACE');
    	Logger.DEBUG = defineLogLevel(2, 'DEBUG');
    	Logger.INFO = defineLogLevel(3, 'INFO');
    	Logger.TIME = defineLogLevel(4, 'TIME');
    	Logger.WARN = defineLogLevel(5, 'WARN');
    	Logger.ERROR = defineLogLevel(8, 'ERROR');
    	Logger.OFF = defineLogLevel(99, 'OFF');

    	// Inner class which performs the bulk of the work; ContextualLogger instances can be configured independently
    	// of each other.
    	var ContextualLogger = function(defaultContext) {
    		this.context = defaultContext;
    		this.setLevel(defaultContext.filterLevel);
    		this.log = this.info;  // Convenience alias.
    	};

    	ContextualLogger.prototype = {
    		// Changes the current logging level for the logging instance.
    		setLevel: function (newLevel) {
    			// Ensure the supplied Level object looks valid.
    			if (newLevel && "value" in newLevel) {
    				this.context.filterLevel = newLevel;
    			}
    		},
    		
    		// Gets the current logging level for the logging instance
    		getLevel: function () {
    			return this.context.filterLevel;
    		},

    		// Is the logger configured to output messages at the supplied level?
    		enabledFor: function (lvl) {
    			var filterLevel = this.context.filterLevel;
    			return lvl.value >= filterLevel.value;
    		},

    		trace: function () {
    			this.invoke(Logger.TRACE, arguments);
    		},

    		debug: function () {
    			this.invoke(Logger.DEBUG, arguments);
    		},

    		info: function () {
    			this.invoke(Logger.INFO, arguments);
    		},

    		warn: function () {
    			this.invoke(Logger.WARN, arguments);
    		},

    		error: function () {
    			this.invoke(Logger.ERROR, arguments);
    		},

    		time: function (label) {
    			if (typeof label === 'string' && label.length > 0) {
    				this.invoke(Logger.TIME, [ label, 'start' ]);
    			}
    		},

    		timeEnd: function (label) {
    			if (typeof label === 'string' && label.length > 0) {
    				this.invoke(Logger.TIME, [ label, 'end' ]);
    			}
    		},

    		// Invokes the logger callback if it's not being filtered.
    		invoke: function (level, msgArgs) {
    			if (logHandler && this.enabledFor(level)) {
    				logHandler(msgArgs, merge({ level: level }, this.context));
    			}
    		}
    	};

    	// Protected instance which all calls to the to level `Logger` module will be routed through.
    	var globalLogger = new ContextualLogger({ filterLevel: Logger.OFF });

    	// Configure the global Logger instance.
    	(function() {
    		// Shortcut for optimisers.
    		var L = Logger;

    		L.enabledFor = bind(globalLogger, globalLogger.enabledFor);
    		L.trace = bind(globalLogger, globalLogger.trace);
    		L.debug = bind(globalLogger, globalLogger.debug);
    		L.time = bind(globalLogger, globalLogger.time);
    		L.timeEnd = bind(globalLogger, globalLogger.timeEnd);
    		L.info = bind(globalLogger, globalLogger.info);
    		L.warn = bind(globalLogger, globalLogger.warn);
    		L.error = bind(globalLogger, globalLogger.error);

    		// Don't forget the convenience alias!
    		L.log = L.info;
    	}());

    	// Set the global logging handler.  The supplied function should expect two arguments, the first being an arguments
    	// object with the supplied log messages and the second being a context object which contains a hash of stateful
    	// parameters which the logging function can consume.
    	Logger.setHandler = function (func) {
    		logHandler = func;
    	};

    	// Sets the global logging filter level which applies to *all* previously registered, and future Logger instances.
    	// (note that named loggers (retrieved via `Logger.get`) can be configured independently if required).
    	Logger.setLevel = function(level) {
    		// Set the globalLogger's level.
    		globalLogger.setLevel(level);

    		// Apply this level to all registered contextual loggers.
    		for (var key in contextualLoggersByNameMap) {
    			if (contextualLoggersByNameMap.hasOwnProperty(key)) {
    				contextualLoggersByNameMap[key].setLevel(level);
    			}
    		}
    	};

    	// Gets the global logging filter level
    	Logger.getLevel = function() {
    		return globalLogger.getLevel();
    	};

    	// Retrieve a ContextualLogger instance.  Note that named loggers automatically inherit the global logger's level,
    	// default context and log handler.
    	Logger.get = function (name) {
    		// All logger instances are cached so they can be configured ahead of use.
    		return contextualLoggersByNameMap[name] ||
    			(contextualLoggersByNameMap[name] = new ContextualLogger(merge({ name: name }, globalLogger.context)));
    	};

    	// CreateDefaultHandler returns a handler function which can be passed to `Logger.setHandler()` which will
    	// write to the window's console object (if present); the optional options object can be used to customise the
    	// formatter used to format each log message.
    	Logger.createDefaultHandler = function (options) {
    		options = options || {};

    		options.formatter = options.formatter || function defaultMessageFormatter(messages, context) {
    			// Prepend the logger's name to the log message for easy identification.
    			if (context.name) {
    				messages.unshift("[" + context.name + "]");
    			}
    		};

    		// Map of timestamps by timer labels used to track `#time` and `#timeEnd()` invocations in environments
    		// that don't offer a native console method.
    		var timerStartTimeByLabelMap = {};

    		// Support for IE8+ (and other, slightly more sane environments)
    		var invokeConsoleMethod = function (hdlr, messages) {
    			Function.prototype.apply.call(hdlr, console, messages);
    		};

    		// Check for the presence of a logger.
    		if (typeof console === "undefined") {
    			return function () { /* no console */ };
    		}

    		return function(messages, context) {
    			// Convert arguments object to Array.
    			messages = Array.prototype.slice.call(messages);

    			var hdlr = console.log;
    			var timerLabel;

    			if (context.level === Logger.TIME) {
    				timerLabel = (context.name ? '[' + context.name + '] ' : '') + messages[0];

    				if (messages[1] === 'start') {
    					if (console.time) {
    						console.time(timerLabel);
    					}
    					else {
    						timerStartTimeByLabelMap[timerLabel] = new Date().getTime();
    					}
    				}
    				else {
    					if (console.timeEnd) {
    						console.timeEnd(timerLabel);
    					}
    					else {
    						invokeConsoleMethod(hdlr, [ timerLabel + ': ' +
    							(new Date().getTime() - timerStartTimeByLabelMap[timerLabel]) + 'ms' ]);
    					}
    				}
    			}
    			else {
    				// Delegate through to custom warn/error loggers if present on the console.
    				if (context.level === Logger.WARN && console.warn) {
    					hdlr = console.warn;
    				} else if (context.level === Logger.ERROR && console.error) {
    					hdlr = console.error;
    				} else if (context.level === Logger.INFO && console.info) {
    					hdlr = console.info;
    				} else if (context.level === Logger.DEBUG && console.debug) {
    					hdlr = console.debug;
    				} else if (context.level === Logger.TRACE && console.trace) {
    					hdlr = console.trace;
    				}

    				options.formatter(messages, context);
    				invokeConsoleMethod(hdlr, messages);
    			}
    		};
    	};

    	// Configure and example a Default implementation which writes to the `window.console` (if present).  The
    	// `options` hash can be used to configure the default logLevel and provide a custom message formatter.
    	Logger.useDefaults = function(options) {
    		Logger.setLevel(options && options.defaultLevel || Logger.DEBUG);
    		Logger.setHandler(Logger.createDefaultHandler(options));
    	};

    	// Createa an alias to useDefaults to avoid reaking a react-hooks rule.
    	Logger.setDefaults = Logger.useDefaults;

    	// Export to popular environments boilerplate.
    	if (module.exports) {
    		module.exports = Logger;
    	}
    	else {
    		Logger._prevLogger = global.Logger;

    		Logger.noConflict = function () {
    			global.Logger = Logger._prevLogger;
    			return Logger;
    		};

    		global.Logger = Logger;
    	}
    }(commonjsGlobal));
    }(logger));

    var Logger = logger.exports;

    class PopupFormularConfiguration {
      constructor() {
        this.displaySaveButton = true;
      }

      setDocName(docName) {
        this.docName = docName;
        return this;
      }

      setInputGroups(inputGroups) {
        this.inputGroups = inputGroups;
        return this;
      }

      setInputs(inputs) {
        this.inputs = inputs;
        return this;
      }

      setDisplayDeleteButton(displayDeleteButton) {
        this.displayDeleteButton = displayDeleteButton;
        return this;
      }

      setDisplaySaveButton(displaySaveButton) {
        this.displaySaveButton = displaySaveButton;
        return this;
      }

      setTitle(title) {
        this.title = title;
        return this;
      }
    }

    var InputTypes = Object.freeze({
      TEXT: 1,
      AUTOCOMPLETE: 2,
      DATE: 4,
      CHECKBOX: 5,
      SELECTION: 6,
      BUTTON: 7,
    });

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    const createStyle = ({
      from = 0,
      to = 1,
      reverse = false,
      duration = 300,
      delay = 0,
      css = {},
      onChange = () => false,
      onEnd = () => false,
      easing
    }) => {
      const animation = tweened(reverse ? to : from, {
        duration,
        delay,
        easing
      });
      animation.subscribe(t => {
        let newStyle = "";
        for (let item in css) {
          const {
            input,
            output,
            onComplete = () => false,
            beforeStart = () => false
          } = css[item];
          const inRange = input.filter(i => i <= t).reverse()[0];
          const index = input.indexOf(inRange);
          let val;
          if (!inRange && inRange !== 0) {
            val = output[0];
            beforeStart();
          } else {
            if (input.length - 1 === index) {
              val = output[output.length - 1];
              input[input.length - 1] <= t && onComplete();
            } else {
              const endRange = input[index + 1];
              const percent = ((t - inRange) * 100) / (endRange - inRange);
              const firstItem = output[index];
              const lastItem = output[index + 1];
              if (typeof lastItem === "object") {
                val = "";
                lastItem.map(i => {
                  val += firstItem + ((i - firstItem) * percent) / 100;
                  val += " ";
                });
              } else {
                val = firstItem + ((lastItem - firstItem) * percent) / 100;
              }
            }
          }
          newStyle += `${item}: ${val};`;
        }
        onChange(newStyle);
        if (t === to || t === from) {
          onEnd();
        }
      });
      return {
        play: () => animation.set(to),
        reverse: () => animation.set(from)
      };
    };

    /* node_modules/svelte-checkbox/Checkbox.svelte generated by Svelte v3.38.2 */

    function create_fragment$m(ctx) {
    	let div;
    	let input;
    	let t;
    	let svg;
    	let rect0;
    	let rect1;
    	let path;
    	let div_class_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			input = element("input");
    			t = space();
    			svg = svg_element("svg");
    			rect0 = svg_element("rect");
    			rect1 = svg_element("rect");
    			path = svg_element("path");
    			attr(input, "id", /*labelId*/ ctx[4]);
    			attr(input, "type", "checkbox");
    			attr(input, "name", /*name*/ ctx[2]);
    			attr(input, "class", "svelte-d8g7vy");
    			attr(rect0, "class", "checkbox__border svelte-d8g7vy");
    			attr(rect0, "rx", "15%");
    			attr(rect1, "class", "checkbox__border -active svelte-d8g7vy");
    			attr(rect1, "style", /*borderStyle*/ ctx[8]);
    			attr(rect1, "rx", "15%");
    			attr(path, "style", /*checkStyle*/ ctx[9]);
    			attr(path, "class", "checkbox__check svelte-d8g7vy");
    			attr(path, "d", "M 89.5 13 L 46 71 L 28 54");
    			attr(svg, "class", "checkbox__svg svelte-d8g7vy");
    			attr(svg, "preserveAspectRatio", "none");
    			attr(svg, "viewBox", "0 0 100 100");
    			attr(div, "id", /*id*/ ctx[3]);
    			attr(div, "class", div_class_value = "checkbox " + /*$$props*/ ctx[11].class + " svelte-d8g7vy");
    			set_style(div, "width", /*size*/ ctx[1]);
    			set_style(div, "height", /*size*/ ctx[1]);
    			toggle_class(div, "-changeBg", /*changeBg*/ ctx[7]);
    			toggle_class(div, "-checked", /*checked*/ ctx[0] || !/*canChange*/ ctx[6]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, input);
    			append(div, t);
    			append(div, svg);
    			append(svg, rect0);
    			append(svg, rect1);
    			append(svg, path);
    			/*div_binding*/ ctx[15](div);

    			if (!mounted) {
    				dispose = listen(input, "change", /*handleChange*/ ctx[10]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*labelId*/ 16) {
    				attr(input, "id", /*labelId*/ ctx[4]);
    			}

    			if (dirty & /*name*/ 4) {
    				attr(input, "name", /*name*/ ctx[2]);
    			}

    			if (dirty & /*borderStyle*/ 256) {
    				attr(rect1, "style", /*borderStyle*/ ctx[8]);
    			}

    			if (dirty & /*checkStyle*/ 512) {
    				attr(path, "style", /*checkStyle*/ ctx[9]);
    			}

    			if (dirty & /*id*/ 8) {
    				attr(div, "id", /*id*/ ctx[3]);
    			}

    			if (dirty & /*$$props*/ 2048 && div_class_value !== (div_class_value = "checkbox " + /*$$props*/ ctx[11].class + " svelte-d8g7vy")) {
    				attr(div, "class", div_class_value);
    			}

    			if (dirty & /*size*/ 2) {
    				set_style(div, "width", /*size*/ ctx[1]);
    			}

    			if (dirty & /*size*/ 2) {
    				set_style(div, "height", /*size*/ ctx[1]);
    			}

    			if (dirty & /*$$props, changeBg*/ 2176) {
    				toggle_class(div, "-changeBg", /*changeBg*/ ctx[7]);
    			}

    			if (dirty & /*$$props, checked, canChange*/ 2113) {
    				toggle_class(div, "-checked", /*checked*/ ctx[0] || !/*canChange*/ ctx[6]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			/*div_binding*/ ctx[15](null);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let self,
    		canChange = true,
    		changeBg = false,
    		{ checked = false } = $$props,
    		{ size = "3rem" } = $$props,
    		{ name = "" } = $$props,
    		{ id = "" } = $$props,
    		{ labelId = "" } = $$props,
    		borderStyle,
    		checkStyle,
    		{ duration = 900 } = $$props,
    		{ primaryColor = "#242432" } = $$props,
    		{ secondaryColor = "#d8d8ea" } = $$props;

    	const dispatch = createEventDispatcher();

    	const animationOptions = {
    		to: 100,
    		duration,
    		easing: sineInOut,
    		reverse: checked
    	};

    	const borderAnimation = createStyle({
    		...animationOptions,
    		duration,
    		css: {
    			"stroke-dashoffset": {
    				input: [0, 45, 75],
    				output: [342, -150, -307],
    				onComplete: () => $$invalidate(7, changeBg = true)
    			},
    			"stroke-dasharray": {
    				input: [0, 45, 75],
    				output: [342, 154, [0, 310]]
    			},
    			opacity: { input: [0, 5], output: [0, 1] }
    		},
    		onChange: style => $$invalidate(8, borderStyle = style),
    		onEnd: () => $$invalidate(6, canChange = true)
    	});

    	const checkAnimation = createStyle({
    		...animationOptions,
    		css: {
    			"stroke-dashoffset": {
    				input: [65, 100],
    				output: [300, 144],
    				beforeStart: () => $$invalidate(7, changeBg = false)
    			},
    			"stroke-dasharray": { input: [65, 100], output: [100, 84] }
    		},
    		onChange: style => $$invalidate(9, checkStyle = style)
    	});

    	const handleChange = () => {
    		if (!canChange) return false;

    		if (checked) {
    			borderAnimation.reverse();
    			checkAnimation.reverse();
    		} else {
    			borderAnimation.play();
    			checkAnimation.play();
    		}

    		$$invalidate(6, canChange = false);
    		$$invalidate(0, checked = !checked);
    		dispatch("change", checked);
    	};

    	const setProp = (prop, val) => self.style.setProperty(prop, val);

    	onMount(() => {
    		setProp("--checkbox-color-primary", primaryColor);
    		setProp("--checkbox-color-secondary", secondaryColor);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			self = $$value;
    			$$invalidate(5, self);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(11, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("checked" in $$new_props) $$invalidate(0, checked = $$new_props.checked);
    		if ("size" in $$new_props) $$invalidate(1, size = $$new_props.size);
    		if ("name" in $$new_props) $$invalidate(2, name = $$new_props.name);
    		if ("id" in $$new_props) $$invalidate(3, id = $$new_props.id);
    		if ("labelId" in $$new_props) $$invalidate(4, labelId = $$new_props.labelId);
    		if ("duration" in $$new_props) $$invalidate(12, duration = $$new_props.duration);
    		if ("primaryColor" in $$new_props) $$invalidate(13, primaryColor = $$new_props.primaryColor);
    		if ("secondaryColor" in $$new_props) $$invalidate(14, secondaryColor = $$new_props.secondaryColor);
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		checked,
    		size,
    		name,
    		id,
    		labelId,
    		self,
    		canChange,
    		changeBg,
    		borderStyle,
    		checkStyle,
    		handleChange,
    		$$props,
    		duration,
    		primaryColor,
    		secondaryColor,
    		div_binding
    	];
    }

    class Checkbox extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$n, create_fragment$m, safe_not_equal, {
    			checked: 0,
    			size: 1,
    			name: 2,
    			id: 3,
    			labelId: 4,
    			duration: 12,
    			primaryColor: 13,
    			secondaryColor: 14
    		});
    	}
    }

    /* src/components/Input/InputGroup.svelte generated by Svelte v3.38.2 */

    function create_fragment$l(ctx) {
    	let div1;
    	let div0;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr(div0, "class", "group svelte-1c09nbg");
    			attr(div1, "class", "outerbox svelte-1c09nbg");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class InputGroup extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$m, create_fragment$l, safe_not_equal, {});
    	}
    }

    const getCalendarPage = (month, year, dayProps, weekStart = 0) => {
      let date = new Date(year, month, 1);
      date.setDate(date.getDate() - date.getDay() + weekStart);
      let nextMonth = month === 11 ? 0 : month + 1;
      // ensure days starts on Sunday
      // and end on saturday
      let weeks = [];
      while (date.getMonth() !== nextMonth || date.getDay() !== weekStart || weeks.length !== 6) {
        if (date.getDay() === weekStart) weeks.unshift({ days: [], id: `${year}${month}${year}${weeks.length}` });
        const updated = Object.assign({
          partOfMonth: date.getMonth() === month,
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          date: new Date(date)
        }, dayProps(date));
        weeks[0].days.push(updated);
        date.setDate(date.getDate() + 1);
      }
      weeks.reverse();
      return { month, year, weeks };
    };

    const getDayPropsHandler = (start, end, selectableCallback) => {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      return date => {
        const isInRange = date >= start && date <= end;
        return {
          isInRange,
          selectable: isInRange && (!selectableCallback || selectableCallback(date)),
          isToday: date.getTime() === today.getTime()
        };
      };
    };

    function getMonths(start, end, selectableCallback = null, weekStart = 0) {
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      let endDate = new Date(end.getFullYear(), end.getMonth() + 1, 1);
      let months = [];
      let date = new Date(start.getFullYear(), start.getMonth(), 1);
      let dayPropsHandler = getDayPropsHandler(start, end, selectableCallback);
      while (date < endDate) {
        months.push(getCalendarPage(date.getMonth(), date.getFullYear(), dayPropsHandler, weekStart));
        date.setMonth(date.getMonth() + 1);
      }
      return months;
    }

    const areDatesEquivalent = (a, b) => a.getDate() === b.getDate()
      && a.getMonth() === b.getMonth()
      && a.getFullYear() === b.getFullYear();

    /* node_modules/svelte-calendar/src/Components/Week.svelte generated by Svelte v3.38.2 */

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (20:2) {#each days as day}
    function create_each_block$7(ctx) {
    	let div;
    	let button;
    	let t0_value = /*day*/ ctx[7].date.getDate() + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[6](/*day*/ ctx[7]);
    	}

    	return {
    		c() {
    			div = element("div");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(button, "class", "day--label svelte-1f2gkwh");
    			attr(button, "type", "button");
    			toggle_class(button, "selected", areDatesEquivalent(/*day*/ ctx[7].date, /*selected*/ ctx[1]));
    			toggle_class(button, "highlighted", areDatesEquivalent(/*day*/ ctx[7].date, /*highlighted*/ ctx[2]));
    			toggle_class(button, "shake-date", /*shouldShakeDate*/ ctx[3] && areDatesEquivalent(/*day*/ ctx[7].date, /*shouldShakeDate*/ ctx[3]));
    			toggle_class(button, "disabled", !/*day*/ ctx[7].selectable);
    			attr(div, "class", "day svelte-1f2gkwh");
    			toggle_class(div, "outside-month", !/*day*/ ctx[7].partOfMonth);
    			toggle_class(div, "is-today", /*day*/ ctx[7].isToday);
    			toggle_class(div, "is-disabled", !/*day*/ ctx[7].selectable);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    			append(button, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*days*/ 1 && t0_value !== (t0_value = /*day*/ ctx[7].date.getDate() + "")) set_data(t0, t0_value);

    			if (dirty & /*areDatesEquivalent, days, selected*/ 3) {
    				toggle_class(button, "selected", areDatesEquivalent(/*day*/ ctx[7].date, /*selected*/ ctx[1]));
    			}

    			if (dirty & /*areDatesEquivalent, days, highlighted*/ 5) {
    				toggle_class(button, "highlighted", areDatesEquivalent(/*day*/ ctx[7].date, /*highlighted*/ ctx[2]));
    			}

    			if (dirty & /*shouldShakeDate, areDatesEquivalent, days*/ 9) {
    				toggle_class(button, "shake-date", /*shouldShakeDate*/ ctx[3] && areDatesEquivalent(/*day*/ ctx[7].date, /*shouldShakeDate*/ ctx[3]));
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(button, "disabled", !/*day*/ ctx[7].selectable);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "outside-month", !/*day*/ ctx[7].partOfMonth);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "is-today", /*day*/ ctx[7].isToday);
    			}

    			if (dirty & /*days*/ 1) {
    				toggle_class(div, "is-disabled", !/*day*/ ctx[7].selectable);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$k(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value = /*days*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "week svelte-1f2gkwh");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*days, areDatesEquivalent, selected, highlighted, shouldShakeDate, dispatch*/ 47) {
    				each_value = /*days*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i(local) {
    			if (current) return;

    			if (local) {
    				add_render_callback(() => {
    					if (div_outro) div_outro.end(1);

    					if (!div_intro) div_intro = create_in_transition(div, fly, {
    						x: /*direction*/ ctx[4] * 50,
    						duration: 180,
    						delay: 90
    					});

    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o(local) {
    			if (div_intro) div_intro.invalidate();

    			if (local) {
    				div_outro = create_out_transition(div, fade, { duration: 180 });
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};
    }

    function instance$l($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { days } = $$props;
    	let { selected } = $$props;
    	let { highlighted } = $$props;
    	let { shouldShakeDate } = $$props;
    	let { direction } = $$props;
    	const click_handler = day => dispatch("dateSelected", day.date);

    	$$self.$$set = $$props => {
    		if ("days" in $$props) $$invalidate(0, days = $$props.days);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("highlighted" in $$props) $$invalidate(2, highlighted = $$props.highlighted);
    		if ("shouldShakeDate" in $$props) $$invalidate(3, shouldShakeDate = $$props.shouldShakeDate);
    		if ("direction" in $$props) $$invalidate(4, direction = $$props.direction);
    	};

    	return [
    		days,
    		selected,
    		highlighted,
    		shouldShakeDate,
    		direction,
    		dispatch,
    		click_handler
    	];
    }

    class Week extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$l, create_fragment$k, safe_not_equal, {
    			days: 0,
    			selected: 1,
    			highlighted: 2,
    			shouldShakeDate: 3,
    			direction: 4
    		});
    	}
    }

    /* node_modules/svelte-calendar/src/Components/Month.svelte generated by Svelte v3.38.2 */

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (20:2) {#each visibleMonth.weeks as week (week.id) }
    function create_each_block$6(key_1, ctx) {
    	let first;
    	let week;
    	let current;

    	week = new Week({
    			props: {
    				days: /*week*/ ctx[8].days,
    				selected: /*selected*/ ctx[1],
    				highlighted: /*highlighted*/ ctx[2],
    				shouldShakeDate: /*shouldShakeDate*/ ctx[3],
    				direction: /*direction*/ ctx[4]
    			}
    		});

    	week.$on("dateSelected", /*dateSelected_handler*/ ctx[7]);

    	return {
    		key: key_1,
    		first: null,
    		c() {
    			first = empty();
    			create_component(week.$$.fragment);
    			this.first = first;
    		},
    		m(target, anchor) {
    			insert(target, first, anchor);
    			mount_component(week, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const week_changes = {};
    			if (dirty & /*visibleMonth*/ 1) week_changes.days = /*week*/ ctx[8].days;
    			if (dirty & /*selected*/ 2) week_changes.selected = /*selected*/ ctx[1];
    			if (dirty & /*highlighted*/ 4) week_changes.highlighted = /*highlighted*/ ctx[2];
    			if (dirty & /*shouldShakeDate*/ 8) week_changes.shouldShakeDate = /*shouldShakeDate*/ ctx[3];
    			if (dirty & /*direction*/ 16) week_changes.direction = /*direction*/ ctx[4];
    			week.$set(week_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(week.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(week.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(first);
    			destroy_component(week, detaching);
    		}
    	};
    }

    function create_fragment$j(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*visibleMonth*/ ctx[0].weeks;
    	const get_key = ctx => /*week*/ ctx[8].id;

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$6(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$6(key, child_ctx));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "month-container svelte-ny3kda");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*visibleMonth, selected, highlighted, shouldShakeDate, direction*/ 31) {
    				each_value = /*visibleMonth*/ ctx[0].weeks;
    				group_outros();
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$6, null, get_each_context$6);
    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let { visibleMonth } = $$props;
    	let { selected } = $$props;
    	let { highlighted } = $$props;
    	let { shouldShakeDate } = $$props;
    	let lastId = id;
    	let direction;

    	function dateSelected_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(5, id = $$props.id);
    		if ("visibleMonth" in $$props) $$invalidate(0, visibleMonth = $$props.visibleMonth);
    		if ("selected" in $$props) $$invalidate(1, selected = $$props.selected);
    		if ("highlighted" in $$props) $$invalidate(2, highlighted = $$props.highlighted);
    		if ("shouldShakeDate" in $$props) $$invalidate(3, shouldShakeDate = $$props.shouldShakeDate);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*lastId, id*/ 96) {
    			{
    				$$invalidate(4, direction = lastId < id ? 1 : -1);
    				$$invalidate(6, lastId = id);
    			}
    		}
    	};

    	return [
    		visibleMonth,
    		selected,
    		highlighted,
    		shouldShakeDate,
    		direction,
    		id,
    		lastId,
    		dateSelected_handler
    	];
    }

    class Month extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$k, create_fragment$j, safe_not_equal, {
    			id: 5,
    			visibleMonth: 0,
    			selected: 1,
    			highlighted: 2,
    			shouldShakeDate: 3
    		});
    	}
    }

    /* node_modules/svelte-calendar/src/Components/NavBar.svelte generated by Svelte v3.38.2 */

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (64:4) {#each availableMonths as monthDefinition, index}
    function create_each_block$5(ctx) {
    	let div;
    	let span;
    	let t0_value = /*monthDefinition*/ ctx[15].abbrev + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[14](/*monthDefinition*/ ctx[15], /*index*/ ctx[17], ...args);
    	}

    	return {
    		c() {
    			div = element("div");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(span, "class", "svelte-1dqf106");
    			attr(div, "class", "month-selector--month svelte-1dqf106");
    			toggle_class(div, "selected", /*index*/ ctx[17] === /*month*/ ctx[0]);
    			toggle_class(div, "selectable", /*monthDefinition*/ ctx[15].selectable);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, span);
    			append(span, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = listen(div, "click", click_handler_2);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*availableMonths*/ 64 && t0_value !== (t0_value = /*monthDefinition*/ ctx[15].abbrev + "")) set_data(t0, t0_value);

    			if (dirty & /*month*/ 1) {
    				toggle_class(div, "selected", /*index*/ ctx[17] === /*month*/ ctx[0]);
    			}

    			if (dirty & /*availableMonths*/ 64) {
    				toggle_class(div, "selectable", /*monthDefinition*/ ctx[15].selectable);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$i(ctx) {
    	let div5;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1_value = /*monthsOfYear*/ ctx[4][/*month*/ ctx[0]][0] + "";
    	let t1;
    	let t2;
    	let t3;
    	let t4;
    	let div2;
    	let t5;
    	let div4;
    	let mounted;
    	let dispose;
    	let each_value = /*availableMonths*/ ctx[6];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			div0.innerHTML = `<i class="arrow left svelte-1dqf106"></i>`;
    			t0 = space();
    			div1 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			t3 = text(/*year*/ ctx[1]);
    			t4 = space();
    			div2 = element("div");
    			div2.innerHTML = `<i class="arrow right svelte-1dqf106"></i>`;
    			t5 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div0, "class", "control svelte-1dqf106");
    			toggle_class(div0, "enabled", /*canDecrementMonth*/ ctx[3]);
    			attr(div1, "class", "label svelte-1dqf106");
    			attr(div2, "class", "control svelte-1dqf106");
    			toggle_class(div2, "enabled", /*canIncrementMonth*/ ctx[2]);
    			attr(div3, "class", "heading-section svelte-1dqf106");
    			attr(div4, "class", "month-selector svelte-1dqf106");
    			toggle_class(div4, "open", /*monthSelectorOpen*/ ctx[5]);
    			attr(div5, "class", "title");
    		},
    		m(target, anchor) {
    			insert(target, div5, anchor);
    			append(div5, div3);
    			append(div3, div0);
    			append(div3, t0);
    			append(div3, div1);
    			append(div1, t1);
    			append(div1, t2);
    			append(div1, t3);
    			append(div3, t4);
    			append(div3, div2);
    			append(div5, t5);
    			append(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen(div0, "click", /*click_handler*/ ctx[12]),
    					listen(div1, "click", /*toggleMonthSelectorOpen*/ ctx[8]),
    					listen(div2, "click", /*click_handler_1*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*canDecrementMonth*/ 8) {
    				toggle_class(div0, "enabled", /*canDecrementMonth*/ ctx[3]);
    			}

    			if (dirty & /*monthsOfYear, month*/ 17 && t1_value !== (t1_value = /*monthsOfYear*/ ctx[4][/*month*/ ctx[0]][0] + "")) set_data(t1, t1_value);
    			if (dirty & /*year*/ 2) set_data(t3, /*year*/ ctx[1]);

    			if (dirty & /*canIncrementMonth*/ 4) {
    				toggle_class(div2, "enabled", /*canIncrementMonth*/ ctx[2]);
    			}

    			if (dirty & /*month, availableMonths, monthSelected*/ 577) {
    				each_value = /*availableMonths*/ ctx[6];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*monthSelectorOpen*/ 32) {
    				toggle_class(div4, "open", /*monthSelectorOpen*/ ctx[5]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div5);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$j($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { month } = $$props;
    	let { year } = $$props;
    	let { start } = $$props;
    	let { end } = $$props;
    	let { canIncrementMonth } = $$props;
    	let { canDecrementMonth } = $$props;
    	let { monthsOfYear } = $$props;
    	let monthSelectorOpen = false;
    	let availableMonths;

    	function toggleMonthSelectorOpen() {
    		$$invalidate(5, monthSelectorOpen = !monthSelectorOpen);
    	}

    	function monthSelected(event, { m, i }) {
    		event.stopPropagation();
    		if (!m.selectable) return;
    		dispatch("monthSelected", i);
    		toggleMonthSelectorOpen();
    	}

    	const click_handler = () => dispatch("incrementMonth", -1);
    	const click_handler_1 = () => dispatch("incrementMonth", 1);
    	const click_handler_2 = (monthDefinition, index, e) => monthSelected(e, { m: monthDefinition, i: index });

    	$$self.$$set = $$props => {
    		if ("month" in $$props) $$invalidate(0, month = $$props.month);
    		if ("year" in $$props) $$invalidate(1, year = $$props.year);
    		if ("start" in $$props) $$invalidate(10, start = $$props.start);
    		if ("end" in $$props) $$invalidate(11, end = $$props.end);
    		if ("canIncrementMonth" in $$props) $$invalidate(2, canIncrementMonth = $$props.canIncrementMonth);
    		if ("canDecrementMonth" in $$props) $$invalidate(3, canDecrementMonth = $$props.canDecrementMonth);
    		if ("monthsOfYear" in $$props) $$invalidate(4, monthsOfYear = $$props.monthsOfYear);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*start, year, end, monthsOfYear*/ 3090) {
    			{
    				let isOnLowerBoundary = start.getFullYear() === year;
    				let isOnUpperBoundary = end.getFullYear() === year;

    				$$invalidate(6, availableMonths = monthsOfYear.map((m, i) => {
    					return Object.assign({}, { name: m[0], abbrev: m[1] }, {
    						selectable: !isOnLowerBoundary && !isOnUpperBoundary || (!isOnLowerBoundary || i >= start.getMonth()) && (!isOnUpperBoundary || i <= end.getMonth())
    					});
    				}));
    			}
    		}
    	};

    	return [
    		month,
    		year,
    		canIncrementMonth,
    		canDecrementMonth,
    		monthsOfYear,
    		monthSelectorOpen,
    		availableMonths,
    		dispatch,
    		toggleMonthSelectorOpen,
    		monthSelected,
    		start,
    		end,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class NavBar extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$j, create_fragment$i, safe_not_equal, {
    			month: 0,
    			year: 1,
    			start: 10,
    			end: 11,
    			canIncrementMonth: 2,
    			canDecrementMonth: 3,
    			monthsOfYear: 4
    		});
    	}
    }

    /* node_modules/svelte-calendar/src/Components/Popover.svelte generated by Svelte v3.38.2 */

    const { window: window_1$2 } = globals;
    const get_contents_slot_changes = dirty => ({});
    const get_contents_slot_context = ctx => ({});
    const get_trigger_slot_changes = dirty => ({});
    const get_trigger_slot_context = ctx => ({});

    function create_fragment$h(ctx) {
    	let div4;
    	let div0;
    	let t;
    	let div3;
    	let div2;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[14]);
    	const trigger_slot_template = /*#slots*/ ctx[13].trigger;
    	const trigger_slot = create_slot(trigger_slot_template, ctx, /*$$scope*/ ctx[12], get_trigger_slot_context);
    	const contents_slot_template = /*#slots*/ ctx[13].contents;
    	const contents_slot = create_slot(contents_slot_template, ctx, /*$$scope*/ ctx[12], get_contents_slot_context);

    	return {
    		c() {
    			div4 = element("div");
    			div0 = element("div");
    			if (trigger_slot) trigger_slot.c();
    			t = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			if (contents_slot) contents_slot.c();
    			attr(div0, "class", "trigger");
    			attr(div1, "class", "contents-inner svelte-mc1z8c");
    			attr(div2, "class", "contents svelte-mc1z8c");
    			attr(div3, "class", "contents-wrapper svelte-mc1z8c");
    			set_style(div3, "transform", "translate(-50%,-50%) translate(" + /*translateX*/ ctx[8] + "px, " + /*translateY*/ ctx[7] + "px)");
    			toggle_class(div3, "visible", /*open*/ ctx[0]);
    			toggle_class(div3, "shrink", /*shrink*/ ctx[1]);
    			attr(div4, "class", "sc-popover svelte-mc1z8c");
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div0);

    			if (trigger_slot) {
    				trigger_slot.m(div0, null);
    			}

    			/*div0_binding*/ ctx[15](div0);
    			append(div4, t);
    			append(div4, div3);
    			append(div3, div2);
    			append(div2, div1);

    			if (contents_slot) {
    				contents_slot.m(div1, null);
    			}

    			/*div2_binding*/ ctx[16](div2);
    			/*div3_binding*/ ctx[17](div3);
    			/*div4_binding*/ ctx[18](div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window_1$2, "resize", /*onwindowresize*/ ctx[14]),
    					listen(div0, "click", /*doOpen*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (trigger_slot) {
    				if (trigger_slot.p && (!current || dirty & /*$$scope*/ 4096)) {
    					update_slot(trigger_slot, trigger_slot_template, ctx, /*$$scope*/ ctx[12], dirty, get_trigger_slot_changes, get_trigger_slot_context);
    				}
    			}

    			if (contents_slot) {
    				if (contents_slot.p && (!current || dirty & /*$$scope*/ 4096)) {
    					update_slot(contents_slot, contents_slot_template, ctx, /*$$scope*/ ctx[12], dirty, get_contents_slot_changes, get_contents_slot_context);
    				}
    			}

    			if (!current || dirty & /*translateX, translateY*/ 384) {
    				set_style(div3, "transform", "translate(-50%,-50%) translate(" + /*translateX*/ ctx[8] + "px, " + /*translateY*/ ctx[7] + "px)");
    			}

    			if (dirty & /*open*/ 1) {
    				toggle_class(div3, "visible", /*open*/ ctx[0]);
    			}

    			if (dirty & /*shrink*/ 2) {
    				toggle_class(div3, "shrink", /*shrink*/ ctx[1]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(trigger_slot, local);
    			transition_in(contents_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(trigger_slot, local);
    			transition_out(contents_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div4);
    			if (trigger_slot) trigger_slot.d(detaching);
    			/*div0_binding*/ ctx[15](null);
    			if (contents_slot) contents_slot.d(detaching);
    			/*div2_binding*/ ctx[16](null);
    			/*div3_binding*/ ctx[17](null);
    			/*div4_binding*/ ctx[18](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();

    	let once = (el, evt, cb) => {
    		function handler() {
    			cb.apply(this, arguments);
    			el.removeEventListener(evt, handler);
    		}

    		el.addEventListener(evt, handler);
    	};

    	let popover;
    	let w;
    	let triggerContainer;
    	let contentsAnimated;
    	let contentsWrapper;
    	let translateY = 0;
    	let translateX = 0;
    	let { open = false } = $$props;
    	let { shrink } = $$props;
    	let { trigger } = $$props;

    	const close = () => {
    		$$invalidate(1, shrink = true);

    		once(contentsAnimated, "animationend", () => {
    			$$invalidate(1, shrink = false);
    			$$invalidate(0, open = false);
    			dispatch("closed");
    		});
    	};

    	function checkForFocusLoss(evt) {
    		if (!open) return;
    		let el = evt.target;

    		// eslint-disable-next-line
    		do {
    			if (el === popover) return;
    		} while (el = el.parentNode); // eslint-disable-next-line

    		close();
    	}

    	onMount(() => {
    		document.addEventListener("click", checkForFocusLoss);
    		if (!trigger) return;
    		triggerContainer.appendChild(trigger.parentNode.removeChild(trigger));

    		// eslint-disable-next-line
    		return () => {
    			document.removeEventListener("click", checkForFocusLoss);
    		};
    	});

    	const getDistanceToEdges = async () => {
    		if (!open) {
    			$$invalidate(0, open = true);
    		}

    		await tick();
    		let rect = contentsWrapper.getBoundingClientRect();

    		return {
    			top: rect.top + -1 * translateY,
    			bottom: window.innerHeight - rect.bottom + translateY,
    			left: rect.left + -1 * translateX,
    			right: document.body.clientWidth - rect.right + translateX
    		};
    	};

    	const getTranslate = async () => {
    		let dist = await getDistanceToEdges();
    		let x;
    		let y;

    		if (w < 480) {
    			y = dist.bottom;
    		} else if (dist.top < 0) {
    			y = Math.abs(dist.top);
    		} else if (dist.bottom < 0) {
    			y = dist.bottom;
    		} else {
    			y = 0;
    		}

    		if (dist.left < 0) {
    			x = Math.abs(dist.left);
    		} else if (dist.right < 0) {
    			x = dist.right;
    		} else {
    			x = 0;
    		}

    		return { x, y };
    	};

    	const doOpen = async () => {
    		const { x, y } = await getTranslate();
    		$$invalidate(8, translateX = x);
    		$$invalidate(7, translateY = y);
    		$$invalidate(0, open = true);
    		dispatch("opened");
    	};

    	function onwindowresize() {
    		$$invalidate(3, w = window_1$2.innerWidth);
    	}

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			triggerContainer = $$value;
    			$$invalidate(4, triggerContainer);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contentsAnimated = $$value;
    			$$invalidate(5, contentsAnimated);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			contentsWrapper = $$value;
    			$$invalidate(6, contentsWrapper);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			popover = $$value;
    			$$invalidate(2, popover);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("shrink" in $$props) $$invalidate(1, shrink = $$props.shrink);
    		if ("trigger" in $$props) $$invalidate(10, trigger = $$props.trigger);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	return [
    		open,
    		shrink,
    		popover,
    		w,
    		triggerContainer,
    		contentsAnimated,
    		contentsWrapper,
    		translateY,
    		translateX,
    		doOpen,
    		trigger,
    		close,
    		$$scope,
    		slots,
    		onwindowresize,
    		div0_binding,
    		div2_binding,
    		div3_binding,
    		div4_binding
    	];
    }

    class Popover extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$i, create_fragment$h, safe_not_equal, {
    			open: 0,
    			shrink: 1,
    			trigger: 10,
    			close: 11
    		});
    	}

    	get close() {
    		return this.$$.ctx[11];
    	}
    }

    /**
     * generic function to inject data into token-laden string
     * @param str {String} Required
     * @param name {String} Required
     * @param value {String|Integer} Required
     * @returns {String}
     *
     * @example
     * injectStringData("The following is a token: #{tokenName}", "tokenName", 123); 
     * @returns {String} "The following is a token: 123"
     *
     */
    const injectStringData = (str,name,value) => str
      .replace(new RegExp('#{'+name+'}','g'), value);

    /**
     * Generic function to enforce length of string. 
     * 
     * Pass a string or number to this function and specify the desired length.
     * This function will either pad the # with leading 0's (if str.length < length)
     * or remove data from the end (@fromBack==false) or beginning (@fromBack==true)
     * of the string when str.length > length.
     *
     * When length == str.length or typeof length == 'undefined', this function
     * returns the original @str parameter.
     * 
     * @param str {String} Required
     * @param length {Integer} Required
     * @param fromBack {Boolean} Optional
     * @returns {String}
     *
     */
    const enforceLength = function(str,length,fromBack) {
      str = str.toString();
      if(typeof length == 'undefined') return str;
      if(str.length == length) return str;
      fromBack = (typeof fromBack == 'undefined') ? false : fromBack;
      if(str.length < length) {
        // pad the beginning of the string w/ enough 0's to reach desired length:
        while(length - str.length > 0) str = '0' + str;
      } else if(str.length > length) {
        if(fromBack) {
          // grab the desired #/chars from end of string: ex: '2015' -> '15'
          str = str.substring(str.length-length);
        } else {
          // grab the desired #/chars from beginning of string: ex: '2015' -> '20'
          str = str.substring(0,length);
        }
      }
      return str;
    };

    const daysOfWeek = [ 
      [ 'Sunday', 'Sun' ],
      [ 'Monday', 'Mon' ],
      [ 'Tuesday', 'Tue' ],
      [ 'Wednesday', 'Wed' ],
      [ 'Thursday', 'Thu' ],
      [ 'Friday', 'Fri' ],
      [ 'Saturday', 'Sat' ]
    ];

    const monthsOfYear = [ 
      [ 'January', 'Jan' ],
      [ 'February', 'Feb' ],
      [ 'March', 'Mar' ],
      [ 'April', 'Apr' ],
      [ 'May', 'May' ],
      [ 'June', 'Jun' ],
      [ 'July', 'Jul' ],
      [ 'August', 'Aug' ],
      [ 'September', 'Sep' ],
      [ 'October', 'Oct' ],
      [ 'November', 'Nov' ],
      [ 'December', 'Dec' ]
    ];

    let dictionary = { 
      daysOfWeek, 
      monthsOfYear
    };

    const extendDictionary = (conf) => 
      Object.keys(conf).forEach(key => {
        if(dictionary[key] && dictionary[key].length == conf[key].length) {
          dictionary[key] = conf[key];
        }
      });

    var acceptedDateTokens = [
      { 
        // d: day of the month, 2 digits with leading zeros:
        key: 'd', 
        method: function(date) { return enforceLength(date.getDate(), 2); } 
      }, { 
        // D: textual representation of day, 3 letters: Sun thru Sat
        key: 'D', 
        method: function(date) { return dictionary.daysOfWeek[date.getDay()][1]; } 
      }, { 
        // j: day of month without leading 0's
        key: 'j', 
        method: function(date) { return date.getDate(); } 
      }, { 
        // l: full textual representation of day of week: Sunday thru Saturday
        key: 'l', 
        method: function(date) { return dictionary.daysOfWeek[date.getDay()][0]; } 
      }, { 
        // F: full text month: 'January' thru 'December'
        key: 'F', 
        method: function(date) { return dictionary.monthsOfYear[date.getMonth()][0]; } 
      }, { 
        // m: 2 digit numeric month: '01' - '12':
        key: 'm', 
        method: function(date) { return enforceLength(date.getMonth()+1,2); } 
      }, { 
        // M: a short textual representation of the month, 3 letters: 'Jan' - 'Dec'
        key: 'M', 
        method: function(date) { return dictionary.monthsOfYear[date.getMonth()][1]; } 
      }, { 
        // n: numeric represetation of month w/o leading 0's, '1' - '12':
        key: 'n', 
        method: function(date) { return date.getMonth() + 1; } 
      }, { 
        // Y: Full numeric year, 4 digits
        key: 'Y', 
        method: function(date) { return date.getFullYear(); } 
      }, { 
        // y: 2 digit numeric year:
        key: 'y', 
        method: function(date) { return enforceLength(date.getFullYear(),2,true); }
       }
    ];

    var acceptedTimeTokens = [
      { 
        // a: lowercase ante meridiem and post meridiem 'am' or 'pm'
        key: 'a', 
        method: function(date) { return (date.getHours() > 11) ? 'pm' : 'am'; } 
      }, { 
        // A: uppercase ante merdiiem and post meridiem 'AM' or 'PM'
        key: 'A', 
        method: function(date) { return (date.getHours() > 11) ? 'PM' : 'AM'; } 
      }, { 
        // g: 12-hour format of an hour without leading zeros 1-12
        key: 'g', 
        method: function(date) { return date.getHours() % 12 || 12; } 
      }, { 
        // G: 24-hour format of an hour without leading zeros 0-23
        key: 'G', 
        method: function(date) { return date.getHours(); } 
      }, { 
        // h: 12-hour format of an hour with leading zeros 01-12
        key: 'h', 
        method: function(date) { return enforceLength(date.getHours()%12 || 12,2); } 
      }, { 
        // H: 24-hour format of an hour with leading zeros: 00-23
        key: 'H', 
        method: function(date) { return enforceLength(date.getHours(),2); } 
      }, { 
        // i: Minutes with leading zeros 00-59
        key: 'i', 
        method: function(date) { return enforceLength(date.getMinutes(),2); } 
      }, { 
        // s: Seconds with leading zeros 00-59
        key: 's', 
        method: function(date) { return enforceLength(date.getSeconds(),2); }
       }
    ];

    /**
     * Internationalization object for timeUtils.internationalize().
     * @typedef internationalizeObj
     * @property {Array} [daysOfWeek=[ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ]] daysOfWeek Weekday labels as strings, starting with Sunday.
     * @property {Array} [monthsOfYear=[ 'January','February','March','April','May','June','July','August','September','October','November','December' ]] monthsOfYear Month labels as strings, starting with January.
     */

    /**
     * This function can be used to support additional languages by passing an object with 
     * `daysOfWeek` and `monthsOfYear` attributes.  Each attribute should be an array of
     * strings (ex: `daysOfWeek: ['monday', 'tuesday', 'wednesday'...]`)
     *
     * @param {internationalizeObj} conf
     */
    const internationalize = (conf={}) => { 
      extendDictionary(conf);
    };

    /**
     * generic formatDate function which accepts dynamic templates
     * @param date {Date} Required
     * @param template {String} Optional
     * @returns {String}
     *
     * @example
     * formatDate(new Date(), '#{M}. #{j}, #{Y}')
     * @returns {Number} Returns a formatted date
     *
     */
    const formatDate = (date,template='#{m}/#{d}/#{Y}') => {
      acceptedDateTokens.forEach(token => {
        if(template.indexOf(`#{${token.key}}`) == -1) return; 
        template = injectStringData(template,token.key,token.method(date));
      }); 
      acceptedTimeTokens.forEach(token => {
        if(template.indexOf(`#{${token.key}}`) == -1) return;
        template = injectStringData(template,token.key,token.method(date));
      });
      return template;
    };

    const keyCodes = {
      left: 37,
      up: 38,
      right: 39,
      down: 40,
      pgup: 33,
      pgdown: 34,
      enter: 13,
      escape: 27,
      tab: 9
    };

    const keyCodesArray = Object.keys(keyCodes).map(k => keyCodes[k]);

    /* node_modules/svelte-calendar/src/Components/Datepicker.svelte generated by Svelte v3.38.2 */

    const get_default_slot_changes = dirty => ({
    	selected: dirty[0] & /*selected*/ 1,
    	formattedSelected: dirty[0] & /*formattedSelected*/ 4
    });

    const get_default_slot_context = ctx => ({
    	selected: /*selected*/ ctx[0],
    	formattedSelected: /*formattedSelected*/ ctx[2]
    });

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[63] = list[i];
    	return child_ctx;
    }

    // (277:8) {#if !trigger}
    function create_if_block$7(ctx) {
    	let button;
    	let t;

    	return {
    		c() {
    			button = element("button");
    			t = text(/*formattedSelected*/ ctx[2]);
    			attr(button, "class", "calendar-button svelte-1lorc63");
    			attr(button, "type", "button");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*formattedSelected*/ 4) set_data(t, /*formattedSelected*/ ctx[2]);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    		}
    	};
    }

    // (276:43)          
    function fallback_block$1(ctx) {
    	let if_block_anchor;
    	let if_block = !/*trigger*/ ctx[1] && create_if_block$7(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (!/*trigger*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (275:4) 
    function create_trigger_slot(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[40].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[47], get_default_slot_context);
    	const default_slot_or_fallback = default_slot || fallback_block$1(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot_or_fallback) default_slot_or_fallback.c();
    			attr(div, "slot", "trigger");
    			attr(div, "class", "svelte-1lorc63");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot_or_fallback) {
    				default_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[0] & /*selected, formattedSelected*/ 5 | dirty[1] & /*$$scope*/ 65536)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[47], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			} else {
    				if (default_slot_or_fallback && default_slot_or_fallback.p && dirty[0] & /*formattedSelected, trigger*/ 6) {
    					default_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot_or_fallback, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot_or_fallback, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot_or_fallback) default_slot_or_fallback.d(detaching);
    		}
    	};
    }

    // (298:10) {#each sortedDaysOfWeek as day}
    function create_each_block$4(ctx) {
    	let span;
    	let t_value = /*day*/ ctx[63][1] + "";
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(t_value);
    			attr(span, "class", "svelte-1lorc63");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (284:4) 
    function create_contents_slot(ctx) {
    	let div2;
    	let div1;
    	let navbar;
    	let t0;
    	let div0;
    	let t1;
    	let month_1;
    	let current;

    	navbar = new NavBar({
    			props: {
    				month: /*month*/ ctx[6],
    				year: /*year*/ ctx[7],
    				canIncrementMonth: /*canIncrementMonth*/ ctx[15],
    				canDecrementMonth: /*canDecrementMonth*/ ctx[16],
    				start: /*start*/ ctx[3],
    				end: /*end*/ ctx[4],
    				monthsOfYear: /*monthsOfYear*/ ctx[5]
    			}
    		});

    	navbar.$on("monthSelected", /*monthSelected_handler*/ ctx[41]);
    	navbar.$on("incrementMonth", /*incrementMonth_handler*/ ctx[42]);
    	let each_value = /*sortedDaysOfWeek*/ ctx[18];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	month_1 = new Month({
    			props: {
    				visibleMonth: /*visibleMonth*/ ctx[8],
    				selected: /*selected*/ ctx[0],
    				highlighted: /*highlighted*/ ctx[10],
    				shouldShakeDate: /*shouldShakeDate*/ ctx[11],
    				id: /*visibleMonthId*/ ctx[14]
    			}
    		});

    	month_1.$on("dateSelected", /*dateSelected_handler*/ ctx[43]);

    	return {
    		c() {
    			div2 = element("div");
    			div1 = element("div");
    			create_component(navbar.$$.fragment);
    			t0 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			create_component(month_1.$$.fragment);
    			attr(div0, "class", "legend svelte-1lorc63");
    			attr(div1, "class", "calendar svelte-1lorc63");
    			attr(div2, "slot", "contents");
    			attr(div2, "class", "svelte-1lorc63");
    		},
    		m(target, anchor) {
    			insert(target, div2, anchor);
    			append(div2, div1);
    			mount_component(navbar, div1, null);
    			append(div1, t0);
    			append(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append(div1, t1);
    			mount_component(month_1, div1, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const navbar_changes = {};
    			if (dirty[0] & /*month*/ 64) navbar_changes.month = /*month*/ ctx[6];
    			if (dirty[0] & /*year*/ 128) navbar_changes.year = /*year*/ ctx[7];
    			if (dirty[0] & /*canIncrementMonth*/ 32768) navbar_changes.canIncrementMonth = /*canIncrementMonth*/ ctx[15];
    			if (dirty[0] & /*canDecrementMonth*/ 65536) navbar_changes.canDecrementMonth = /*canDecrementMonth*/ ctx[16];
    			if (dirty[0] & /*start*/ 8) navbar_changes.start = /*start*/ ctx[3];
    			if (dirty[0] & /*end*/ 16) navbar_changes.end = /*end*/ ctx[4];
    			if (dirty[0] & /*monthsOfYear*/ 32) navbar_changes.monthsOfYear = /*monthsOfYear*/ ctx[5];
    			navbar.$set(navbar_changes);

    			if (dirty[0] & /*sortedDaysOfWeek*/ 262144) {
    				each_value = /*sortedDaysOfWeek*/ ctx[18];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const month_1_changes = {};
    			if (dirty[0] & /*visibleMonth*/ 256) month_1_changes.visibleMonth = /*visibleMonth*/ ctx[8];
    			if (dirty[0] & /*selected*/ 1) month_1_changes.selected = /*selected*/ ctx[0];
    			if (dirty[0] & /*highlighted*/ 1024) month_1_changes.highlighted = /*highlighted*/ ctx[10];
    			if (dirty[0] & /*shouldShakeDate*/ 2048) month_1_changes.shouldShakeDate = /*shouldShakeDate*/ ctx[11];
    			if (dirty[0] & /*visibleMonthId*/ 16384) month_1_changes.id = /*visibleMonthId*/ ctx[14];
    			month_1.$set(month_1_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(month_1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(month_1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div2);
    			destroy_component(navbar);
    			destroy_each(each_blocks, detaching);
    			destroy_component(month_1);
    		}
    	};
    }

    function create_fragment$g(ctx) {
    	let div;
    	let popover_1;
    	let updating_open;
    	let updating_shrink;
    	let current;

    	function popover_1_open_binding(value) {
    		/*popover_1_open_binding*/ ctx[45](value);
    	}

    	function popover_1_shrink_binding(value) {
    		/*popover_1_shrink_binding*/ ctx[46](value);
    	}

    	let popover_1_props = {
    		trigger: /*trigger*/ ctx[1],
    		$$slots: {
    			contents: [create_contents_slot],
    			trigger: [create_trigger_slot]
    		},
    		$$scope: { ctx }
    	};

    	if (/*isOpen*/ ctx[12] !== void 0) {
    		popover_1_props.open = /*isOpen*/ ctx[12];
    	}

    	if (/*isClosing*/ ctx[13] !== void 0) {
    		popover_1_props.shrink = /*isClosing*/ ctx[13];
    	}

    	popover_1 = new Popover({ props: popover_1_props });
    	/*popover_1_binding*/ ctx[44](popover_1);
    	binding_callbacks.push(() => bind$1(popover_1, "open", popover_1_open_binding));
    	binding_callbacks.push(() => bind$1(popover_1, "shrink", popover_1_shrink_binding));
    	popover_1.$on("opened", /*registerOpen*/ ctx[23]);
    	popover_1.$on("closed", /*registerClose*/ ctx[22]);

    	return {
    		c() {
    			div = element("div");
    			create_component(popover_1.$$.fragment);
    			attr(div, "class", "datepicker svelte-1lorc63");
    			attr(div, "style", /*wrapperStyle*/ ctx[17]);
    			toggle_class(div, "open", /*isOpen*/ ctx[12]);
    			toggle_class(div, "closing", /*isClosing*/ ctx[13]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(popover_1, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const popover_1_changes = {};
    			if (dirty[0] & /*trigger*/ 2) popover_1_changes.trigger = /*trigger*/ ctx[1];

    			if (dirty[0] & /*visibleMonth, selected, highlighted, shouldShakeDate, visibleMonthId, month, year, canIncrementMonth, canDecrementMonth, start, end, monthsOfYear, formattedSelected, trigger*/ 118271 | dirty[1] & /*$$scope*/ 65536) {
    				popover_1_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_open && dirty[0] & /*isOpen*/ 4096) {
    				updating_open = true;
    				popover_1_changes.open = /*isOpen*/ ctx[12];
    				add_flush_callback(() => updating_open = false);
    			}

    			if (!updating_shrink && dirty[0] & /*isClosing*/ 8192) {
    				updating_shrink = true;
    				popover_1_changes.shrink = /*isClosing*/ ctx[13];
    				add_flush_callback(() => updating_shrink = false);
    			}

    			popover_1.$set(popover_1_changes);

    			if (!current || dirty[0] & /*wrapperStyle*/ 131072) {
    				attr(div, "style", /*wrapperStyle*/ ctx[17]);
    			}

    			if (dirty[0] & /*isOpen*/ 4096) {
    				toggle_class(div, "open", /*isOpen*/ ctx[12]);
    			}

    			if (dirty[0] & /*isClosing*/ 8192) {
    				toggle_class(div, "closing", /*isClosing*/ ctx[13]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(popover_1.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(popover_1.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			/*popover_1_binding*/ ctx[44](null);
    			destroy_component(popover_1);
    		}
    	};
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let months;
    	let visibleMonth;
    	let visibleMonthId;
    	let lastVisibleDate;
    	let firstVisibleDate;
    	let canIncrementMonth;
    	let canDecrementMonth;
    	let wrapperStyle;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	const today = new Date();
    	const oneYear = 1000 * 60 * 60 * 24 * 365;
    	let popover;
    	let { format = "#{m}/#{d}/#{Y}" } = $$props;
    	let { start = new Date(Date.now() - oneYear) } = $$props;
    	let { end = new Date(Date.now() + oneYear) } = $$props;
    	let { selected = today } = $$props;
    	let { dateChosen = false } = $$props;
    	let { trigger = null } = $$props;
    	let { selectableCallback = null } = $$props;
    	let { weekStart = 0 } = $$props;

    	let { daysOfWeek = [
    		["Sunday", "Sun"],
    		["Monday", "Mon"],
    		["Tuesday", "Tue"],
    		["Wednesday", "Wed"],
    		["Thursday", "Thu"],
    		["Friday", "Fri"],
    		["Saturday", "Sat"]
    	] } = $$props;

    	let { monthsOfYear = [
    		["January", "Jan"],
    		["February", "Feb"],
    		["March", "Mar"],
    		["April", "Apr"],
    		["May", "May"],
    		["June", "Jun"],
    		["July", "Jul"],
    		["August", "Aug"],
    		["September", "Sep"],
    		["October", "Oct"],
    		["November", "Nov"],
    		["December", "Dec"]
    	] } = $$props;

    	selected = selected.getTime() < start.getTime() || selected.getTime() > end.getTime()
    	? start
    	: selected;

    	let { style = "" } = $$props;
    	let { buttonBackgroundColor = "#fff" } = $$props;
    	let { buttonBorderColor = "#eee" } = $$props;
    	let { buttonTextColor = "#333" } = $$props;
    	let { highlightColor = "#f7901e" } = $$props;
    	let { dayBackgroundColor = "none" } = $$props;
    	let { dayTextColor = "#4a4a4a" } = $$props;
    	let { dayHighlightedBackgroundColor = "#efefef" } = $$props;
    	let { dayHighlightedTextColor = "#4a4a4a" } = $$props;
    	internationalize({ daysOfWeek, monthsOfYear });

    	let sortedDaysOfWeek = weekStart === 0
    	? daysOfWeek
    	: (() => {
    			let dow = daysOfWeek.slice();
    			dow.push(dow.shift());
    			return dow;
    		})();

    	let highlighted = today;
    	let shouldShakeDate = false;
    	let shakeHighlightTimeout;
    	let month = today.getMonth();
    	let year = today.getFullYear();
    	let isOpen = false;
    	let isClosing = false;
    	today.setHours(0, 0, 0, 0);

    	function assignmentHandler(formatted) {
    		if (!trigger) return;
    		$$invalidate(1, trigger.innerHTML = formatted, trigger);
    	}

    	let monthIndex = 0;
    	let { formattedSelected } = $$props;

    	onMount(() => {
    		$$invalidate(6, month = selected.getMonth());
    		$$invalidate(7, year = selected.getFullYear());
    	});

    	function changeMonth(selectedMonth) {
    		$$invalidate(6, month = selectedMonth);
    		$$invalidate(10, highlighted = new Date(year, month, 1));
    	}

    	function incrementMonth(direction, day = 1) {
    		if (direction === 1 && !canIncrementMonth) return;
    		if (direction === -1 && !canDecrementMonth) return;
    		let current = new Date(year, month, 1);
    		current.setMonth(current.getMonth() + direction);
    		$$invalidate(6, month = current.getMonth());
    		$$invalidate(7, year = current.getFullYear());
    		$$invalidate(10, highlighted = new Date(year, month, day));
    	}

    	function getDefaultHighlighted() {
    		return new Date(selected);
    	}

    	const getDay = (m, d, y) => {
    		let theMonth = months.find(aMonth => aMonth.month === m && aMonth.year === y);
    		if (!theMonth) return null;

    		// eslint-disable-next-line
    		for (let i = 0; i < theMonth.weeks.length; ++i) {
    			// eslint-disable-next-line
    			for (let j = 0; j < theMonth.weeks[i].days.length; ++j) {
    				let aDay = theMonth.weeks[i].days[j];
    				if (aDay.month === m && aDay.day === d && aDay.year === y) return aDay;
    			}
    		}

    		return null;
    	};

    	function incrementDayHighlighted(amount) {
    		let proposedDate = new Date(highlighted);
    		proposedDate.setDate(highlighted.getDate() + amount);
    		let correspondingDayObj = getDay(proposedDate.getMonth(), proposedDate.getDate(), proposedDate.getFullYear());
    		if (!correspondingDayObj || !correspondingDayObj.isInRange) return;
    		$$invalidate(10, highlighted = proposedDate);

    		if (amount > 0 && highlighted > lastVisibleDate) {
    			incrementMonth(1, highlighted.getDate());
    		}

    		if (amount < 0 && highlighted < firstVisibleDate) {
    			incrementMonth(-1, highlighted.getDate());
    		}
    	}

    	function checkIfVisibleDateIsSelectable(date) {
    		const proposedDay = getDay(date.getMonth(), date.getDate(), date.getFullYear());
    		return proposedDay && proposedDay.selectable;
    	}

    	function shakeDate(date) {
    		clearTimeout(shakeHighlightTimeout);
    		$$invalidate(11, shouldShakeDate = date);

    		shakeHighlightTimeout = setTimeout(
    			() => {
    				$$invalidate(11, shouldShakeDate = false);
    			},
    			700
    		);
    	}

    	function assignValueToTrigger(formatted) {
    		assignmentHandler(formatted);
    	}

    	function registerSelection(chosen) {
    		if (!checkIfVisibleDateIsSelectable(chosen)) return shakeDate(chosen);

    		// eslint-disable-next-line
    		close();

    		$$invalidate(0, selected = chosen);
    		$$invalidate(24, dateChosen = true);
    		assignValueToTrigger(formattedSelected);
    		return dispatch("dateSelected", { date: chosen });
    	}

    	function handleKeyPress(evt) {
    		if (keyCodesArray.indexOf(evt.keyCode) === -1) return;
    		evt.preventDefault();

    		switch (evt.keyCode) {
    			case keyCodes.left:
    				incrementDayHighlighted(-1);
    				break;
    			case keyCodes.up:
    				incrementDayHighlighted(-7);
    				break;
    			case keyCodes.right:
    				incrementDayHighlighted(1);
    				break;
    			case keyCodes.down:
    				incrementDayHighlighted(7);
    				break;
    			case keyCodes.pgup:
    				incrementMonth(-1);
    				break;
    			case keyCodes.pgdown:
    				incrementMonth(1);
    				break;
    			case keyCodes.escape:
    				// eslint-disable-next-line
    				close();
    				break;
    			case keyCodes.enter:
    				registerSelection(highlighted);
    				break;
    		}
    	}

    	function registerClose() {
    		document.removeEventListener("keydown", handleKeyPress);
    		dispatch("close");
    	}

    	function close() {
    		popover.close();
    		registerClose();
    	}

    	function registerOpen() {
    		$$invalidate(10, highlighted = getDefaultHighlighted());
    		$$invalidate(6, month = selected.getMonth());
    		$$invalidate(7, year = selected.getFullYear());
    		document.addEventListener("keydown", handleKeyPress);
    		dispatch("open");
    	}

    	const monthSelected_handler = e => changeMonth(e.detail);
    	const incrementMonth_handler = e => incrementMonth(e.detail);
    	const dateSelected_handler = e => registerSelection(e.detail);

    	function popover_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			popover = $$value;
    			$$invalidate(9, popover);
    		});
    	}

    	function popover_1_open_binding(value) {
    		isOpen = value;
    		$$invalidate(12, isOpen);
    	}

    	function popover_1_shrink_binding(value) {
    		isClosing = value;
    		$$invalidate(13, isClosing);
    	}

    	$$self.$$set = $$props => {
    		if ("format" in $$props) $$invalidate(25, format = $$props.format);
    		if ("start" in $$props) $$invalidate(3, start = $$props.start);
    		if ("end" in $$props) $$invalidate(4, end = $$props.end);
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("dateChosen" in $$props) $$invalidate(24, dateChosen = $$props.dateChosen);
    		if ("trigger" in $$props) $$invalidate(1, trigger = $$props.trigger);
    		if ("selectableCallback" in $$props) $$invalidate(26, selectableCallback = $$props.selectableCallback);
    		if ("weekStart" in $$props) $$invalidate(27, weekStart = $$props.weekStart);
    		if ("daysOfWeek" in $$props) $$invalidate(28, daysOfWeek = $$props.daysOfWeek);
    		if ("monthsOfYear" in $$props) $$invalidate(5, monthsOfYear = $$props.monthsOfYear);
    		if ("style" in $$props) $$invalidate(29, style = $$props.style);
    		if ("buttonBackgroundColor" in $$props) $$invalidate(30, buttonBackgroundColor = $$props.buttonBackgroundColor);
    		if ("buttonBorderColor" in $$props) $$invalidate(31, buttonBorderColor = $$props.buttonBorderColor);
    		if ("buttonTextColor" in $$props) $$invalidate(32, buttonTextColor = $$props.buttonTextColor);
    		if ("highlightColor" in $$props) $$invalidate(33, highlightColor = $$props.highlightColor);
    		if ("dayBackgroundColor" in $$props) $$invalidate(34, dayBackgroundColor = $$props.dayBackgroundColor);
    		if ("dayTextColor" in $$props) $$invalidate(35, dayTextColor = $$props.dayTextColor);
    		if ("dayHighlightedBackgroundColor" in $$props) $$invalidate(36, dayHighlightedBackgroundColor = $$props.dayHighlightedBackgroundColor);
    		if ("dayHighlightedTextColor" in $$props) $$invalidate(37, dayHighlightedTextColor = $$props.dayHighlightedTextColor);
    		if ("formattedSelected" in $$props) $$invalidate(2, formattedSelected = $$props.formattedSelected);
    		if ("$$scope" in $$props) $$invalidate(47, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*start, end, selectableCallback, weekStart*/ 201326616) {
    			$$invalidate(39, months = getMonths(start, end, selectableCallback, weekStart));
    		}

    		if ($$self.$$.dirty[0] & /*month, year*/ 192 | $$self.$$.dirty[1] & /*months*/ 256) {
    			{
    				$$invalidate(38, monthIndex = 0);

    				for (let i = 0; i < months.length; i += 1) {
    					if (months[i].month === month && months[i].year === year) {
    						$$invalidate(38, monthIndex = i);
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty[1] & /*months, monthIndex*/ 384) {
    			$$invalidate(8, visibleMonth = months[monthIndex]);
    		}

    		if ($$self.$$.dirty[0] & /*year, month*/ 192) {
    			$$invalidate(14, visibleMonthId = year + month / 100);
    		}

    		if ($$self.$$.dirty[0] & /*visibleMonth*/ 256) {
    			lastVisibleDate = visibleMonth.weeks[visibleMonth.weeks.length - 1].days[6].date;
    		}

    		if ($$self.$$.dirty[0] & /*visibleMonth*/ 256) {
    			firstVisibleDate = visibleMonth.weeks[0].days[0].date;
    		}

    		if ($$self.$$.dirty[1] & /*monthIndex, months*/ 384) {
    			$$invalidate(15, canIncrementMonth = monthIndex < months.length - 1);
    		}

    		if ($$self.$$.dirty[1] & /*monthIndex*/ 128) {
    			$$invalidate(16, canDecrementMonth = monthIndex > 0);
    		}

    		if ($$self.$$.dirty[0] & /*buttonBackgroundColor, style*/ 1610612736 | $$self.$$.dirty[1] & /*buttonBorderColor, buttonTextColor, highlightColor, dayBackgroundColor, dayTextColor, dayHighlightedBackgroundColor, dayHighlightedTextColor*/ 127) {
    			$$invalidate(17, wrapperStyle = `
    --button-background-color: ${buttonBackgroundColor};
    --button-border-color: ${buttonBorderColor};
    --button-text-color: ${buttonTextColor};
    --highlight-color: ${highlightColor};
    --day-background-color: ${dayBackgroundColor};
    --day-text-color: ${dayTextColor};
    --day-highlighted-background-color: ${dayHighlightedBackgroundColor};
    --day-highlighted-text-color: ${dayHighlightedTextColor};
    ${style}
  `);
    		}

    		if ($$self.$$.dirty[0] & /*format, selected*/ 33554433) {
    			{
    				$$invalidate(2, formattedSelected = typeof format === "function"
    				? format(selected)
    				: formatDate(selected, format));
    			}
    		}
    	};

    	return [
    		selected,
    		trigger,
    		formattedSelected,
    		start,
    		end,
    		monthsOfYear,
    		month,
    		year,
    		visibleMonth,
    		popover,
    		highlighted,
    		shouldShakeDate,
    		isOpen,
    		isClosing,
    		visibleMonthId,
    		canIncrementMonth,
    		canDecrementMonth,
    		wrapperStyle,
    		sortedDaysOfWeek,
    		changeMonth,
    		incrementMonth,
    		registerSelection,
    		registerClose,
    		registerOpen,
    		dateChosen,
    		format,
    		selectableCallback,
    		weekStart,
    		daysOfWeek,
    		style,
    		buttonBackgroundColor,
    		buttonBorderColor,
    		buttonTextColor,
    		highlightColor,
    		dayBackgroundColor,
    		dayTextColor,
    		dayHighlightedBackgroundColor,
    		dayHighlightedTextColor,
    		monthIndex,
    		months,
    		slots,
    		monthSelected_handler,
    		incrementMonth_handler,
    		dateSelected_handler,
    		popover_1_binding,
    		popover_1_open_binding,
    		popover_1_shrink_binding,
    		$$scope
    	];
    }

    class Datepicker extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$h,
    			create_fragment$g,
    			safe_not_equal,
    			{
    				format: 25,
    				start: 3,
    				end: 4,
    				selected: 0,
    				dateChosen: 24,
    				trigger: 1,
    				selectableCallback: 26,
    				weekStart: 27,
    				daysOfWeek: 28,
    				monthsOfYear: 5,
    				style: 29,
    				buttonBackgroundColor: 30,
    				buttonBorderColor: 31,
    				buttonTextColor: 32,
    				highlightColor: 33,
    				dayBackgroundColor: 34,
    				dayTextColor: 35,
    				dayHighlightedBackgroundColor: 36,
    				dayHighlightedTextColor: 37,
    				formattedSelected: 2
    			},
    			[-1, -1, -1]
    		);
    	}
    }

    /* src/components/Input/ClearInputButton.svelte generated by Svelte v3.38.2 */

    function create_if_block$6(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");

    			div.innerHTML = `<svg width="100%" height="100%" viewBox="-2 -2 50 50" focusable="false" role="presentation"><path fill="currentColor" d="M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124
      l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z"></path></svg>`;

    			attr(div, "class", "clear svelte-1q4dthm");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (!mounted) {
    				dispose = listen(div, "click", stop_propagation(/*click_handler*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$f(ctx) {
    	let if_block_anchor;
    	let if_block = /*visible*/ ctx[0] && create_if_block$6(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (/*visible*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { visible = true } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
    	};

    	return [visible, click_handler];
    }

    class ClearInputButton extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$g, create_fragment$f, safe_not_equal, { visible: 0 });
    	}
    }

    /* src/components/Input/DateInput.svelte generated by Svelte v3.38.2 */

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i][0];
    	child_ctx[12] = list[i][1];
    	return child_ctx;
    }

    // (59:0) {:else}
    function create_else_block$4(ctx) {
    	let datepicker;
    	let current;

    	datepicker = new Datepicker({
    			props: {
    				selected: /*timeMillis*/ ctx[0] === 0
    				? new Date()
    				: new Date(/*timeMillis*/ ctx[0]),
    				weekStart: 1,
    				daysOfWeek: /*daysOfWeek*/ ctx[4],
    				monthsOfYear: /*monthsOfYear*/ ctx[5],
    				format: "#{d}.#{m}.#{Y}",
    				start: new Date(2018, 1, 1),
    				end: inTwoMonths(),
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			}
    		});

    	datepicker.$on("dateSelected", /*dateSelected_handler*/ ctx[9]);

    	return {
    		c() {
    			create_component(datepicker.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(datepicker, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const datepicker_changes = {};

    			if (dirty & /*timeMillis*/ 1) datepicker_changes.selected = /*timeMillis*/ ctx[0] === 0
    			? new Date()
    			: new Date(/*timeMillis*/ ctx[0]);

    			if (dirty & /*$$scope, timeMillis*/ 32769) {
    				datepicker_changes.$$scope = { dirty, ctx };
    			}

    			datepicker.$set(datepicker_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(datepicker.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(datepicker, detaching);
    		}
    	};
    }

    // (53:0) {#if disabled}
    function create_if_block$5(ctx) {
    	let input;
    	let input_value_value;

    	return {
    		c() {
    			input = element("input");
    			attr(input, "type", "text");

    			input.value = input_value_value = /*timeMillis*/ ctx[0] === 0
    			? "-"
    			: saveParseTimestampToString(/*timeMillis*/ ctx[0]);

    			input.disabled = true;
    			attr(input, "class", "svelte-1wlfvs4");
    		},
    		m(target, anchor) {
    			insert(target, input, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty & /*timeMillis*/ 1 && input_value_value !== (input_value_value = /*timeMillis*/ ctx[0] === 0
    			? "-"
    			: saveParseTimestampToString(/*timeMillis*/ ctx[0])) && input.value !== input_value_value) {
    				input.value = input_value_value;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(input);
    		}
    	};
    }

    // (60:2) <Datepicker     selected={timeMillis === 0 ? new Date() : new Date(timeMillis)}     on:dateSelected={(event) => {       const date = event.detail.date;       const newTimeMillis = date.getTime() - getTimeZoneOffsetMs(date.getTime());       if (millisAtStartOfDay(timeMillis) !== millisAtStartOfDay(newTimeMillis)) {         timeMillis = millisAtStartOfDay(newTimeMillis);         dispatch("change", date);       }     }}     weekStart={1}     {daysOfWeek}     {monthsOfYear}     format={"#{d}.#{m}.#{Y}"}     start={new Date(2018, 1, 1)}     end={inTwoMonths()}   >
    function create_default_slot$3(ctx) {
    	let input;
    	let input_value_value;
    	let t;
    	let clearinputbutton;
    	let current;

    	clearinputbutton = new ClearInputButton({
    			props: { visible: /*timeMillis*/ ctx[0] !== 0 }
    		});

    	clearinputbutton.$on("click", /*click_handler*/ ctx[8]);

    	return {
    		c() {
    			input = element("input");
    			t = space();
    			create_component(clearinputbutton.$$.fragment);
    			attr(input, "type", "text");

    			input.value = input_value_value = /*timeMillis*/ ctx[0] === 0
    			? "-"
    			: saveParseTimestampToString(/*timeMillis*/ ctx[0]);

    			attr(input, "class", "svelte-1wlfvs4");
    		},
    		m(target, anchor) {
    			insert(target, input, anchor);
    			insert(target, t, anchor);
    			mount_component(clearinputbutton, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (!current || dirty & /*timeMillis*/ 1 && input_value_value !== (input_value_value = /*timeMillis*/ ctx[0] === 0
    			? "-"
    			: saveParseTimestampToString(/*timeMillis*/ ctx[0])) && input.value !== input_value_value) {
    				input.value = input_value_value;
    			}

    			const clearinputbutton_changes = {};
    			if (dirty & /*timeMillis*/ 1) clearinputbutton_changes.visible = /*timeMillis*/ ctx[0] !== 0;
    			clearinputbutton.$set(clearinputbutton_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(clearinputbutton.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(clearinputbutton.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(input);
    			if (detaching) detach(t);
    			destroy_component(clearinputbutton, detaching);
    		}
    	};
    }

    // (88:0) {#each Object.entries(quickset) as [days, label]}
    function create_each_block$3(ctx) {
    	let button;
    	let t_value = /*label*/ ctx[12] + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[10](/*days*/ ctx[11]);
    	}

    	return {
    		c() {
    			button = element("button");
    			t = text(t_value);
    			attr(button, "class", "button-tight svelte-1wlfvs4");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);

    			if (!mounted) {
    				dispose = listen(button, "click", click_handler_1);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*quickset*/ 2 && t_value !== (t_value = /*label*/ ctx[12] + "")) set_data(t, t_value);
    		},
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let each_1_anchor;
    	let current;
    	const if_block_creators = [create_if_block$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*disabled*/ ctx[2]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let each_value = Object.entries(/*quickset*/ ctx[1]);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	return {
    		c() {
    			if_block.c();
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(t.parentNode, t);
    			}

    			if (dirty & /*addDays, parseInt, Object, quickset*/ 130) {
    				each_value = Object.entries(/*quickset*/ ctx[1]);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(each_1_anchor);
    		}
    	};
    }

    function inTwoMonths() {
    	const date = new Date();
    	date.setMonth(date.getMonth() + 2);
    	return date;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

    	const daysOfWeek = [
    		["Sonntag", "So"],
    		["Montag", "Mo"],
    		["Dienstag", "Di"],
    		["Mittwoch", "Mi"],
    		["Donnerstag", "Do"],
    		["Freitag", "Fr"],
    		["Samstag", "Sa"]
    	];

    	const monthsOfYear = [
    		["Januar", "Jan"],
    		["Februar", "Feb"],
    		["März", "Mär"],
    		["April", "Apr"],
    		["Mai", "Mai"],
    		["Juni", "Jun"],
    		["Juli", "Jul"],
    		["August", "Aug"],
    		["September", "Sep"],
    		["Oktober", "Okt"],
    		["November", "Nov"],
    		["Dezember", "Dez"]
    	];

    	const getTimeZoneOffsetMs = (millis = new Date().getTime()) => {
    		return new Date(millis).getTimezoneOffset() * 60000;
    	};

    	let { quickset = {} } = $$props;
    	let { timeMillis = 0 } = $$props;
    	let { disabled = false } = $$props;

    	function addDays(days) {
    		let date = new Date();
    		date.setDate(date.getDate() + days);
    		$$invalidate(0, timeMillis = millisAtStartOfDay$1(date.getTime()));
    	}

    	const click_handler = () => {
    		$$invalidate(0, timeMillis = 0);
    		dispatch("change", undefined);
    	};

    	const dateSelected_handler = event => {
    		const date = event.detail.date;
    		const newTimeMillis = date.getTime() - getTimeZoneOffsetMs(date.getTime());

    		if (millisAtStartOfDay$1(timeMillis) !== millisAtStartOfDay$1(newTimeMillis)) {
    			$$invalidate(0, timeMillis = millisAtStartOfDay$1(newTimeMillis));
    			dispatch("change", date);
    		}
    	};

    	const click_handler_1 = days => addDays(parseInt(days));

    	$$self.$$set = $$props => {
    		if ("quickset" in $$props) $$invalidate(1, quickset = $$props.quickset);
    		if ("timeMillis" in $$props) $$invalidate(0, timeMillis = $$props.timeMillis);
    		if ("disabled" in $$props) $$invalidate(2, disabled = $$props.disabled);
    	};

    	return [
    		timeMillis,
    		quickset,
    		disabled,
    		dispatch,
    		daysOfWeek,
    		monthsOfYear,
    		getTimeZoneOffsetMs,
    		addDays,
    		click_handler,
    		dateSelected_handler,
    		click_handler_1
    	];
    }

    class DateInput extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$f, create_fragment$e, safe_not_equal, { quickset: 1, timeMillis: 0, disabled: 2 });
    	}
    }

    function restrict(node, allowInputType) {
      const onKeyPress = (event) => {
        const keys = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        if (!keys.includes(event.key)) {
          event.returnValue = false;
          if (event.preventDefault) event.preventDefault();
        }
      };

      if (allowInputType === "number") {
        node.addEventListener("keypress", onKeyPress);
      }

      return {
        update(newRegex) {
          regex = newRegex;
        },
        destroy() {
          node.removeEventListener("keypress", onKeyPress);
        },
      };
    }

    /* src/components/Input/TextInput.svelte generated by Svelte v3.38.2 */

    function create_else_block$3(ctx) {
    	let input;
    	let restrict_action;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input = element("input");
    			attr(input, "type", "text");
    			attr(input, "id", /*id*/ ctx[1]);
    			attr(input, "name", /*id*/ ctx[1]);
    			input.readOnly = /*readonly*/ ctx[2];
    			input.disabled = /*disabled*/ ctx[3];
    			attr(input, "class", "svelte-1kskb0s");
    		},
    		m(target, anchor) {
    			insert(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(restrict_action = restrict.call(null, input, /*inputType*/ ctx[5])),
    					listen(input, "input", /*input_input_handler*/ ctx[9]),
    					listen(input, "keydown", keydown_handler$1),
    					listen(input, "input", /*input_handler_1*/ ctx[10])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*id*/ 2) {
    				attr(input, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr(input, "name", /*id*/ ctx[1]);
    			}

    			if (dirty & /*readonly*/ 4) {
    				input.readOnly = /*readonly*/ ctx[2];
    			}

    			if (dirty & /*disabled*/ 8) {
    				input.disabled = /*disabled*/ ctx[3];
    			}

    			if (restrict_action && is_function(restrict_action.update) && dirty & /*inputType*/ 32) restrict_action.update.call(null, /*inputType*/ ctx[5]);

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (16:2) {#if multiline}
    function create_if_block$4(ctx) {
    	let textarea;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			textarea = element("textarea");
    			attr(textarea, "type", "text");
    			attr(textarea, "id", /*id*/ ctx[1]);
    			attr(textarea, "name", /*id*/ ctx[1]);
    			textarea.readOnly = /*readonly*/ ctx[2];
    			textarea.disabled = /*disabled*/ ctx[3];
    			attr(textarea, "rows", "4");
    		},
    		m(target, anchor) {
    			insert(target, textarea, anchor);
    			set_input_value(textarea, /*value*/ ctx[0]);

    			if (!mounted) {
    				dispose = [
    					listen(textarea, "input", /*textarea_input_handler*/ ctx[7]),
    					listen(textarea, "input", /*input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty & /*id*/ 2) {
    				attr(textarea, "id", /*id*/ ctx[1]);
    			}

    			if (dirty & /*id*/ 2) {
    				attr(textarea, "name", /*id*/ ctx[1]);
    			}

    			if (dirty & /*readonly*/ 4) {
    				textarea.readOnly = /*readonly*/ ctx[2];
    			}

    			if (dirty & /*disabled*/ 8) {
    				textarea.disabled = /*disabled*/ ctx[3];
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(textarea);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	let form;

    	function select_block_type(ctx, dirty) {
    		if (/*multiline*/ ctx[4]) return create_if_block$4;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			form = element("form");
    			if_block.c();
    			attr(form, "autocomplete", "off");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			if_block.m(form, null);
    		},
    		p(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(form);
    			if_block.d();
    		}
    	};
    }

    const keydown_handler$1 = event => event.key === "Enter" ? event.preventDefault() : event;

    function instance$e($$self, $$props, $$invalidate) {
    	let { id = "" } = $$props;
    	let { readonly = false } = $$props;
    	let { value = "" } = $$props;
    	let { disabled = false } = $$props;
    	let { multiline = false } = $$props;
    	let { inputType = false } = $$props;
    	const dispatch = createEventDispatcher();

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const input_handler = event => dispatch("change", event.target.value);

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	const input_handler_1 = event => dispatch("change", event.target.value);

    	$$self.$$set = $$props => {
    		if ("id" in $$props) $$invalidate(1, id = $$props.id);
    		if ("readonly" in $$props) $$invalidate(2, readonly = $$props.readonly);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
    		if ("multiline" in $$props) $$invalidate(4, multiline = $$props.multiline);
    		if ("inputType" in $$props) $$invalidate(5, inputType = $$props.inputType);
    	};

    	return [
    		value,
    		id,
    		readonly,
    		disabled,
    		multiline,
    		inputType,
    		dispatch,
    		textarea_input_handler,
    		input_handler,
    		input_input_handler,
    		input_handler_1
    	];
    }

    class TextInput extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$e, create_fragment$d, safe_not_equal, {
    			id: 1,
    			readonly: 2,
    			value: 0,
    			disabled: 3,
    			multiline: 4,
    			inputType: 5
    		});
    	}
    }

    /* node_modules/simple-svelte-autocomplete/src/SimpleAutocomplete.svelte generated by Svelte v3.38.2 */

    const get_no_results_slot_changes = dirty => ({
    	noResultsText: dirty[0] & /*noResultsText*/ 2
    });

    const get_no_results_slot_context = ctx => ({ noResultsText: /*noResultsText*/ ctx[1] });

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[79] = list[i];
    	child_ctx[81] = i;
    	return child_ctx;
    }

    const get_item_slot_changes = dirty => ({
    	item: dirty[0] & /*filteredListItems*/ 131072,
    	label: dirty[0] & /*filteredListItems*/ 131072
    });

    const get_item_slot_context = ctx => ({
    	item: /*listItem*/ ctx[79].item,
    	label: /*listItem*/ ctx[79].highlighted
    	? /*listItem*/ ctx[79].highlighted.label
    	: /*listItem*/ ctx[79].label
    });

    // (775:2) {#if showClear}
    function create_if_block_6$1(ctx) {
    	let span;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			span = element("span");
    			span.textContent = "✖";
    			attr(span, "class", "autocomplete-clear-button svelte-77usy");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);

    			if (!mounted) {
    				dispose = listen(span, "click", /*clear*/ ctx[27]);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(span);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (812:28) 
    function create_if_block_5$1(ctx) {
    	let div;
    	let current;
    	const no_results_slot_template = /*#slots*/ ctx[50]["no-results"];
    	const no_results_slot = create_slot(no_results_slot_template, ctx, /*$$scope*/ ctx[49], get_no_results_slot_context);
    	const no_results_slot_or_fallback = no_results_slot || fallback_block_1(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (no_results_slot_or_fallback) no_results_slot_or_fallback.c();
    			attr(div, "class", "autocomplete-list-item-no-results svelte-77usy");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (no_results_slot_or_fallback) {
    				no_results_slot_or_fallback.m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (no_results_slot) {
    				if (no_results_slot.p && (!current || dirty[0] & /*noResultsText*/ 2 | dirty[1] & /*$$scope*/ 262144)) {
    					update_slot(no_results_slot, no_results_slot_template, ctx, /*$$scope*/ ctx[49], dirty, get_no_results_slot_changes, get_no_results_slot_context);
    				}
    			} else {
    				if (no_results_slot_or_fallback && no_results_slot_or_fallback.p && dirty[0] & /*noResultsText*/ 2) {
    					no_results_slot_or_fallback.p(ctx, dirty);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(no_results_slot_or_fallback, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(no_results_slot_or_fallback, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (no_results_slot_or_fallback) no_results_slot_or_fallback.d(detaching);
    		}
    	};
    }

    // (782:4) {#if filteredListItems && filteredListItems.length > 0}
    function create_if_block$3(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	let each_value = /*filteredListItems*/ ctx[17];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block = /*maxItemsToShowInList*/ ctx[0] > 0 && /*filteredListItems*/ ctx[17].length > /*maxItemsToShowInList*/ ctx[0] && create_if_block_1$2(ctx);

    	return {
    		c() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*highlightIndex, onListItemClick, filteredListItems, maxItemsToShowInList*/ 1212417 | dirty[1] & /*$$scope*/ 262144) {
    				each_value = /*filteredListItems*/ ctx[17];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t.parentNode, t);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*maxItemsToShowInList*/ ctx[0] > 0 && /*filteredListItems*/ ctx[17].length > /*maxItemsToShowInList*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (814:48) {noResultsText}
    function fallback_block_1(ctx) {
    	let t;

    	return {
    		c() {
    			t = text(/*noResultsText*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, t, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*noResultsText*/ 2) set_data(t, /*noResultsText*/ ctx[1]);
    		},
    		d(detaching) {
    			if (detaching) detach(t);
    		}
    	};
    }

    // (784:8) {#if listItem && (maxItemsToShowInList <= 0 || i < maxItemsToShowInList)}
    function create_if_block_2$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*listItem*/ ctx[79] && create_if_block_3$1(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*listItem*/ ctx[79]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*filteredListItems*/ 131072) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_3$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (785:10) {#if listItem}
    function create_if_block_3$1(ctx) {
    	let div;
    	let div_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const item_slot_template = /*#slots*/ ctx[50].item;
    	const item_slot = create_slot(item_slot_template, ctx, /*$$scope*/ ctx[49], get_item_slot_context);
    	const item_slot_or_fallback = item_slot || fallback_block(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[53](/*listItem*/ ctx[79]);
    	}

    	function pointerenter_handler() {
    		return /*pointerenter_handler*/ ctx[54](/*i*/ ctx[81]);
    	}

    	return {
    		c() {
    			div = element("div");
    			if (item_slot_or_fallback) item_slot_or_fallback.c();

    			attr(div, "class", div_class_value = "autocomplete-list-item " + (/*i*/ ctx[81] === /*highlightIndex*/ ctx[15]
    			? "selected"
    			: "") + " svelte-77usy");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (item_slot_or_fallback) {
    				item_slot_or_fallback.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div, "click", click_handler),
    					listen(div, "pointerenter", pointerenter_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (item_slot) {
    				if (item_slot.p && (!current || dirty[0] & /*filteredListItems*/ 131072 | dirty[1] & /*$$scope*/ 262144)) {
    					update_slot(item_slot, item_slot_template, ctx, /*$$scope*/ ctx[49], dirty, get_item_slot_changes, get_item_slot_context);
    				}
    			} else {
    				if (item_slot_or_fallback && item_slot_or_fallback.p && dirty[0] & /*filteredListItems*/ 131072) {
    					item_slot_or_fallback.p(ctx, dirty);
    				}
    			}

    			if (!current || dirty[0] & /*highlightIndex*/ 32768 && div_class_value !== (div_class_value = "autocomplete-list-item " + (/*i*/ ctx[81] === /*highlightIndex*/ ctx[15]
    			? "selected"
    			: "") + " svelte-77usy")) {
    				attr(div, "class", div_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(item_slot_or_fallback, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(item_slot_or_fallback, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (item_slot_or_fallback) item_slot_or_fallback.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (798:16) {:else}
    function create_else_block$2(ctx) {
    	let html_tag;
    	let raw_value = /*listItem*/ ctx[79].label + "";
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*filteredListItems*/ 131072 && raw_value !== (raw_value = /*listItem*/ ctx[79].label + "")) html_tag.p(raw_value);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    // (796:16) {#if listItem.highlighted}
    function create_if_block_4$1(ctx) {
    	let html_tag;
    	let raw_value = /*listItem*/ ctx[79].highlighted.label + "";
    	let html_anchor;

    	return {
    		c() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m(target, anchor) {
    			html_tag.m(raw_value, target, anchor);
    			insert(target, html_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*filteredListItems*/ 131072 && raw_value !== (raw_value = /*listItem*/ ctx[79].highlighted.label + "")) html_tag.p(raw_value);
    		},
    		d(detaching) {
    			if (detaching) detach(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};
    }

    // (795:91)                  
    function fallback_block(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*listItem*/ ctx[79].highlighted) return create_if_block_4$1;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (783:6) {#each filteredListItems as listItem, i}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*listItem*/ ctx[79] && (/*maxItemsToShowInList*/ ctx[0] <= 0 || /*i*/ ctx[81] < /*maxItemsToShowInList*/ ctx[0]) && create_if_block_2$2(ctx);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (/*listItem*/ ctx[79] && (/*maxItemsToShowInList*/ ctx[0] <= 0 || /*i*/ ctx[81] < /*maxItemsToShowInList*/ ctx[0])) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*filteredListItems, maxItemsToShowInList*/ 131073) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (807:6) {#if maxItemsToShowInList > 0 && filteredListItems.length > maxItemsToShowInList}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*filteredListItems*/ ctx[17].length - /*maxItemsToShowInList*/ ctx[0] + "";
    	let t1;
    	let t2;

    	return {
    		c() {
    			div = element("div");
    			t0 = text("...");
    			t1 = text(t1_value);
    			t2 = text(" results not shown");
    			attr(div, "class", "autocomplete-list-item-no-results svelte-77usy");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);
    			append(div, t2);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*filteredListItems, maxItemsToShowInList*/ 131073 && t1_value !== (t1_value = /*filteredListItems*/ ctx[17].length - /*maxItemsToShowInList*/ ctx[0] + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$c(ctx) {
    	let div1;
    	let input_1;
    	let input_1_class_value;
    	let input_1_id_value;
    	let input_1_autocomplete_value;
    	let t0;
    	let t1;
    	let div0;
    	let current_block_type_index;
    	let if_block1;
    	let div0_class_value;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*showClear*/ ctx[11] && create_if_block_6$1(ctx);
    	const if_block_creators = [create_if_block$3, create_if_block_5$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*filteredListItems*/ ctx[17] && /*filteredListItems*/ ctx[17].length > 0) return 0;
    		if (/*noResultsText*/ ctx[1]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			div1 = element("div");
    			input_1 = element("input");
    			t0 = space();
    			if (if_block0) if_block0.c();
    			t1 = space();
    			div0 = element("div");
    			if (if_block1) if_block1.c();
    			attr(input_1, "type", "text");

    			attr(input_1, "class", input_1_class_value = "" + ((/*inputClassName*/ ctx[4]
    			? /*inputClassName*/ ctx[4]
    			: "") + " input autocomplete-input" + " svelte-77usy"));

    			attr(input_1, "id", input_1_id_value = /*inputId*/ ctx[5] ? /*inputId*/ ctx[5] : "");
    			attr(input_1, "autocomplete", input_1_autocomplete_value = /*html5autocomplete*/ ctx[8] ? "on" : "off");
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			attr(input_1, "name", /*name*/ ctx[6]);
    			input_1.disabled = /*disabled*/ ctx[12];
    			attr(input_1, "title", /*title*/ ctx[7]);

    			attr(div0, "class", div0_class_value = "" + ((/*dropdownClassName*/ ctx[9]
    			? /*dropdownClassName*/ ctx[9]
    			: "") + " autocomplete-list " + (/*showList*/ ctx[18] ? "" : "hidden") + "\n    is-fullwidth" + " svelte-77usy"));

    			attr(div1, "class", div1_class_value = "" + ((/*className*/ ctx[3] ? /*className*/ ctx[3] : "") + "\n  " + (/*hideArrow*/ ctx[10] ? "hide-arrow is-multiple" : "") + "\n  " + (/*showClear*/ ctx[11] ? "show-clear" : "") + " autocomplete select is-fullwidth " + /*uniqueId*/ ctx[19] + " svelte-77usy"));
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, input_1);
    			/*input_1_binding*/ ctx[51](input_1);
    			set_input_value(input_1, /*text*/ ctx[16]);
    			append(div1, t0);
    			if (if_block0) if_block0.m(div1, null);
    			append(div1, t1);
    			append(div1, div0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			/*div0_binding*/ ctx[55](div0);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(window, "click", /*onDocumentClick*/ ctx[21]),
    					listen(input_1, "input", /*input_1_input_handler*/ ctx[52]),
    					listen(input_1, "input", /*onInput*/ ctx[24]),
    					listen(input_1, "focus", /*onFocus*/ ctx[26]),
    					listen(input_1, "keydown", /*onKeyDown*/ ctx[22]),
    					listen(input_1, "click", /*onInputClick*/ ctx[25]),
    					listen(input_1, "keypress", /*onKeyPress*/ ctx[23])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (!current || dirty[0] & /*inputClassName*/ 16 && input_1_class_value !== (input_1_class_value = "" + ((/*inputClassName*/ ctx[4]
    			? /*inputClassName*/ ctx[4]
    			: "") + " input autocomplete-input" + " svelte-77usy"))) {
    				attr(input_1, "class", input_1_class_value);
    			}

    			if (!current || dirty[0] & /*inputId*/ 32 && input_1_id_value !== (input_1_id_value = /*inputId*/ ctx[5] ? /*inputId*/ ctx[5] : "")) {
    				attr(input_1, "id", input_1_id_value);
    			}

    			if (!current || dirty[0] & /*html5autocomplete*/ 256 && input_1_autocomplete_value !== (input_1_autocomplete_value = /*html5autocomplete*/ ctx[8] ? "on" : "off")) {
    				attr(input_1, "autocomplete", input_1_autocomplete_value);
    			}

    			if (!current || dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (!current || dirty[0] & /*name*/ 64) {
    				attr(input_1, "name", /*name*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*disabled*/ 4096) {
    				input_1.disabled = /*disabled*/ ctx[12];
    			}

    			if (!current || dirty[0] & /*title*/ 128) {
    				attr(input_1, "title", /*title*/ ctx[7]);
    			}

    			if (dirty[0] & /*text*/ 65536 && input_1.value !== /*text*/ ctx[16]) {
    				set_input_value(input_1, /*text*/ ctx[16]);
    			}

    			if (/*showClear*/ ctx[11]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_6$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block1) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block1 = if_blocks[current_block_type_index];

    					if (!if_block1) {
    						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block1.c();
    					} else {
    						if_block1.p(ctx, dirty);
    					}

    					transition_in(if_block1, 1);
    					if_block1.m(div0, null);
    				} else {
    					if_block1 = null;
    				}
    			}

    			if (!current || dirty[0] & /*dropdownClassName, showList*/ 262656 && div0_class_value !== (div0_class_value = "" + ((/*dropdownClassName*/ ctx[9]
    			? /*dropdownClassName*/ ctx[9]
    			: "") + " autocomplete-list " + (/*showList*/ ctx[18] ? "" : "hidden") + "\n    is-fullwidth" + " svelte-77usy"))) {
    				attr(div0, "class", div0_class_value);
    			}

    			if (!current || dirty[0] & /*className, hideArrow, showClear*/ 3080 && div1_class_value !== (div1_class_value = "" + ((/*className*/ ctx[3] ? /*className*/ ctx[3] : "") + "\n  " + (/*hideArrow*/ ctx[10] ? "hide-arrow is-multiple" : "") + "\n  " + (/*showClear*/ ctx[11] ? "show-clear" : "") + " autocomplete select is-fullwidth " + /*uniqueId*/ ctx[19] + " svelte-77usy"))) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			/*input_1_binding*/ ctx[51](null);
    			if (if_block0) if_block0.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			/*div0_binding*/ ctx[55](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function safeStringFunction(theFunction, argument) {
    	if (typeof theFunction !== "function") {
    		console.error("Not a function: " + theFunction + ", argument: " + argument);
    	}

    	let originalResult;

    	try {
    		originalResult = theFunction(argument);
    	} catch(error) {
    		console.warn("Error executing Autocomplete function on value: " + argument + " function: " + theFunction);
    	}

    	let result = originalResult;

    	if (result === undefined || result === null) {
    		result = "";
    	}

    	if (typeof result !== "string") {
    		result = result.toString();
    	}

    	return result;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let showList;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { items = [] } = $$props;
    	let { searchFunction = false } = $$props;
    	let { labelFieldName = undefined } = $$props;
    	let { keywordsFieldName = labelFieldName } = $$props;
    	let { valueFieldName = undefined } = $$props;

    	let { labelFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return labelFieldName ? item[labelFieldName] : item;
    	} } = $$props;

    	let { keywordsFunction = function (item) {
    		if (item === undefined || item === null) {
    			return "";
    		}

    		return keywordsFieldName
    		? item[keywordsFieldName]
    		: labelFunction(item);
    	} } = $$props;

    	let { valueFunction = function (item) {
    		if (item === undefined || item === null) {
    			return item;
    		}

    		return valueFieldName ? item[valueFieldName] : item;
    	} } = $$props;

    	let { keywordsCleanFunction = function (keywords) {
    		return keywords;
    	} } = $$props;

    	let { textCleanFunction = function (userEnteredText) {
    		return userEnteredText;
    	} } = $$props;

    	let { beforeChange = function (oldSelectedItem, newSelectedItem) {
    		return true;
    	} } = $$props;

    	let { onChange = function (newSelectedItem) {
    		
    	} } = $$props;

    	let { selectFirstIfEmpty = false } = $$props;
    	let { minCharactersToSearch = 1 } = $$props;
    	let { maxItemsToShowInList = 0 } = $$props;
    	let { delay = 0 } = $$props;
    	let { localFiltering = true } = $$props;
    	let { noResultsText = "No results found" } = $$props;
    	let { placeholder = undefined } = $$props;
    	let { className = undefined } = $$props;
    	let { inputClassName = undefined } = $$props;
    	let { inputId = undefined } = $$props;
    	let { name = undefined } = $$props;
    	let { title = undefined } = $$props;
    	let { html5autocomplete = undefined } = $$props;
    	let { dropdownClassName = undefined } = $$props;
    	let { hideArrow = false } = $$props;
    	let { showClear = false } = $$props;
    	let { disabled = false } = $$props;
    	let { debug = false } = $$props;
    	let { selectedItem = undefined } = $$props;
    	let { value = undefined } = $$props;

    	// --- Internal State ----
    	const uniqueId = "sautocomplete-" + Math.floor(Math.random() * 1000);

    	// HTML elements
    	let input;

    	let list;

    	// UI state
    	let opened = false;

    	let highlightIndex = -1;
    	let text;
    	let filteredTextLength = 0;

    	// view model
    	let filteredListItems;

    	let listItems = [];

    	// other state
    	let inputDelayTimeout;

    	// -- Reactivity --
    	function onSelectedItemChanged() {
    		$$invalidate(30, value = valueFunction(selectedItem));
    		$$invalidate(16, text = safeLabelFunction(selectedItem));
    		onChange(selectedItem);
    	}

    	function safeLabelFunction(item) {
    		// console.log("labelFunction: " + labelFunction);
    		// console.log("safeLabelFunction, item: " + item);
    		return safeStringFunction(labelFunction, item);
    	}

    	function safeKeywordsFunction(item) {
    		// console.log("safeKeywordsFunction");
    		const keywords = safeStringFunction(keywordsFunction, item);

    		let result = safeStringFunction(keywordsCleanFunction, keywords);
    		result = result.toLowerCase().trim();

    		if (debug) {
    			console.log("Extracted keywords: '" + result + "' from item: " + JSON.stringify(item));
    		}

    		return result;
    	}

    	function prepareListItems() {
    		let tStart;

    		if (debug) {
    			tStart = performance.now();
    			console.log("prepare items to search");
    			console.log("items: " + JSON.stringify(items));
    		}

    		if (!Array.isArray(items)) {
    			console.warn("Autocomplete items / search function did not return array but", items);
    			$$invalidate(28, items = []);
    		}

    		const length = items ? items.length : 0;
    		listItems = new Array(length);

    		if (length > 0) {
    			items.forEach((item, i) => {
    				const listItem = getListItem(item);

    				if (listItem == undefined) {
    					console.log("Undefined item for: ", item);
    				}

    				listItems[i] = listItem;
    			});
    		}

    		if (debug) {
    			const tEnd = performance.now();
    			console.log(listItems.length + " items to search prepared in " + (tEnd - tStart) + " milliseconds");
    		}
    	}

    	function getListItem(item) {
    		return {
    			// keywords representation of the item
    			keywords: safeKeywordsFunction(item),
    			// item label
    			label: safeLabelFunction(item),
    			// store reference to the origial item
    			item
    		};
    	}

    	function prepareUserEnteredText(userEnteredText) {
    		if (userEnteredText === undefined || userEnteredText === null) {
    			return "";
    		}

    		const textFiltered = userEnteredText.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, " ").trim();
    		$$invalidate(48, filteredTextLength = textFiltered.length);

    		if (minCharactersToSearch > 1) {
    			if (filteredTextLength < minCharactersToSearch) {
    				return "";
    			}
    		}

    		const cleanUserEnteredText = textCleanFunction(textFiltered);
    		const textFilteredLowerCase = cleanUserEnteredText.toLowerCase().trim();

    		if (debug) {
    			console.log("Change user entered text '" + userEnteredText + "' into '" + textFilteredLowerCase + "'");
    		}

    		return textFilteredLowerCase;
    	}

    	async function search() {
    		let tStart;

    		if (debug) {
    			tStart = performance.now();
    			console.log("Searching user entered text: '" + text + "'");
    		}

    		const textFiltered = prepareUserEnteredText(text);

    		if (textFiltered === "") {
    			$$invalidate(17, filteredListItems = listItems);
    			closeIfMinCharsToSearchReached();

    			if (debug) {
    				console.log("User entered text is empty set the list of items to all items");
    			}

    			return;
    		}

    		// external search which provides items
    		if (searchFunction) {
    			$$invalidate(28, items = await searchFunction(textFiltered));
    			prepareListItems();
    		}

    		// local search
    		let tempfilteredListItems;

    		if (localFiltering) {
    			const searchWords = textFiltered.split(" ");

    			tempfilteredListItems = listItems.filter(listItem => {
    				if (!listItem) {
    					return false;
    				}

    				const itemKeywords = listItem.keywords;
    				let matches = 0;

    				searchWords.forEach(searchWord => {
    					if (itemKeywords.includes(searchWord)) {
    						matches++;
    					}
    				});

    				return matches >= searchWords.length;
    			});
    		} else {
    			tempfilteredListItems = listItems;
    		}

    		const hlfilter = highlightFilter(textFiltered, ["label"]);
    		const filteredListItemsHighlighted = tempfilteredListItems.map(hlfilter);
    		$$invalidate(17, filteredListItems = filteredListItemsHighlighted);
    		closeIfMinCharsToSearchReached();

    		if (debug) {
    			const tEnd = performance.now();
    			console.log("Search took " + (tEnd - tStart) + " milliseconds, found " + filteredListItems.length + " items");
    		}
    	}

    	// $: text, search();
    	function selectListItem(listItem) {
    		if (debug) {
    			console.log("selectListItem");
    		}

    		if ("undefined" === typeof listItem) {
    			if (debug) {
    				console.log(`listItem ${i} is undefined. Can not select.`);
    			}

    			return false;
    		}

    		const newSelectedItem = listItem.item;

    		if (beforeChange(selectedItem, newSelectedItem)) {
    			$$invalidate(29, selectedItem = newSelectedItem);
    		}

    		return true;
    	}

    	function selectItem() {
    		if (debug) {
    			console.log("selectItem");
    		}

    		const listItem = filteredListItems[highlightIndex];

    		if (selectListItem(listItem)) {
    			close();
    		}
    	}

    	function up() {
    		if (debug) {
    			console.log("up");
    		}

    		open();
    		if (highlightIndex > 0) $$invalidate(15, highlightIndex--, highlightIndex);
    		highlight();
    	}

    	function down() {
    		if (debug) {
    			console.log("down");
    		}

    		open();
    		if (highlightIndex < filteredListItems.length - 1) $$invalidate(15, highlightIndex++, highlightIndex);
    		highlight();
    	}

    	function highlight() {
    		if (debug) {
    			console.log("highlight");
    		}

    		const query = ".selected";

    		if (debug) {
    			console.log("Seaching DOM element: " + query + " in " + list);
    		}

    		const el = list && list.querySelector(query);

    		if (el) {
    			if (typeof el.scrollIntoViewIfNeeded === "function") {
    				if (debug) {
    					console.log("Scrolling selected item into view");
    				}

    				el.scrollIntoViewIfNeeded();
    			} else {
    				if (debug) {
    					console.warn("Could not scroll selected item into view, scrollIntoViewIfNeeded not supported");
    				}
    			}
    		} else {
    			if (debug) {
    				console.warn("Selected item not found to scroll into view");
    			}
    		}
    	}

    	function onListItemClick(listItem) {
    		if (debug) {
    			console.log("onListItemClick");
    		}

    		if (selectListItem(listItem)) {
    			close();
    		}
    	}

    	function onDocumentClick(e) {
    		if (debug) {
    			console.log("onDocumentClick: " + JSON.stringify(e.target));
    		}

    		if (e.target.closest("." + uniqueId)) {
    			if (debug) {
    				console.log("onDocumentClick inside");
    			}

    			// resetListToAllItemsAndOpen();
    			highlight();
    		} else {
    			if (debug) {
    				console.log("onDocumentClick outside");
    			}

    			close();
    		}
    	}

    	function onKeyDown(e) {
    		if (debug) {
    			console.log("onKeyDown");
    		}

    		let key = e.key;
    		if (key === "Tab" && e.shiftKey) key = "ShiftTab";

    		const fnmap = {
    			Tab: opened ? down.bind(this) : null,
    			ShiftTab: opened ? up.bind(this) : null,
    			ArrowDown: down.bind(this),
    			ArrowUp: up.bind(this),
    			Escape: onEsc.bind(this)
    		};

    		const fn = fnmap[key];

    		if (typeof fn === "function") {
    			e.preventDefault();
    			fn(e);
    		}
    	}

    	function onKeyPress(e) {
    		if (debug) {
    			console.log("onKeyPress");
    		}

    		if (e.key === "Enter") {
    			e.preventDefault();
    			selectItem();
    		}
    	}

    	function onInput(e) {
    		if (debug) {
    			console.log("onInput");
    		}

    		$$invalidate(16, text = e.target.value);

    		if (inputDelayTimeout) {
    			clearTimeout(inputDelayTimeout);
    		}

    		if (delay) {
    			inputDelayTimeout = setTimeout(processInput, delay);
    		} else {
    			processInput();
    		}
    	}

    	function processInput() {
    		search();
    		$$invalidate(15, highlightIndex = 0);
    		open();
    	}

    	function onInputClick() {
    		if (debug) {
    			console.log("onInputClick");
    		}

    		resetListToAllItemsAndOpen();
    	}

    	function onEsc(e) {
    		if (debug) {
    			console.log("onEsc");
    		}

    		//if (text) return clear();
    		e.stopPropagation();

    		if (opened) {
    			input.focus();
    			close();
    		}
    	}

    	function onFocus() {
    		if (debug) {
    			console.log("onFocus");
    		}

    		resetListToAllItemsAndOpen();
    	}

    	function resetListToAllItemsAndOpen() {
    		if (debug) {
    			console.log("resetListToAllItemsAndOpen");
    		}

    		$$invalidate(17, filteredListItems = listItems);
    		open();

    		// find selected item
    		if (selectedItem) {
    			if (debug) {
    				console.log("Searching currently selected item: " + JSON.stringify(selectedItem));
    			}

    			for (let i = 0; i < listItems.length; i++) {
    				const listItem = listItems[i];

    				if ("undefined" === typeof listItem) {
    					if (debug) {
    						console.log(`listItem ${i} is undefined. Skipping.`);
    					}

    					continue;
    				}

    				if (debug) {
    					console.log("Item " + i + ": " + JSON.stringify(listItem));
    				}

    				if (selectedItem == listItem.item) {
    					$$invalidate(15, highlightIndex = i);

    					if (debug) {
    						console.log("Found selected item: " + i + ": " + JSON.stringify(listItem));
    					}

    					highlight();
    					break;
    				}
    			}
    		}
    	}

    	function open() {
    		if (debug) {
    			console.log("open");
    		}

    		// check if the search text has more than the min chars required
    		if (isMinCharsToSearchReached()) {
    			return;
    		}

    		$$invalidate(47, opened = true);
    	}

    	function close() {
    		if (debug) {
    			console.log("close");
    		}

    		$$invalidate(47, opened = false);

    		if (!text && selectFirstIfEmpty) {
    			highlightFilter = 0;
    			selectItem();
    		}
    	}

    	function isMinCharsToSearchReached() {
    		return minCharactersToSearch > 1 && filteredTextLength < minCharactersToSearch;
    	}

    	function closeIfMinCharsToSearchReached() {
    		if (isMinCharsToSearchReached()) {
    			close();
    		}
    	}

    	function clear() {
    		if (debug) {
    			console.log("clear");
    		}

    		$$invalidate(16, text = "");
    		$$invalidate(29, selectedItem = undefined);

    		setTimeout(() => {
    			input.focus();
    			close();
    		});
    	}

    	// 'item number one'.replace(/(it)(.*)(nu)(.*)(one)/ig, '<b>$1</b>$2 <b>$3</b>$4 <b>$5</b>')
    	function highlightFilter(q, fields) {
    		const qs = "(" + q.trim().replace(/\s/g, ")(.*)(") + ")";
    		const reg = new RegExp(qs, "ig");
    		let n = 1;
    		const len = qs.split(")(").length + 1;
    		let repl = "";
    		for (; n < len; n++) repl += n % 2 ? `<b>$${n}</b>` : `$${n}`;

    		return i => {
    			const newI = Object.assign({ highlighted: {} }, i);

    			if (fields) {
    				fields.forEach(f => {
    					if (!newI[f]) return;
    					newI.highlighted[f] = newI[f].replace(reg, repl);
    				});
    			}

    			return newI;
    		};
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler() {
    		text = this.value;
    		$$invalidate(16, text);
    	}

    	const click_handler = listItem => onListItemClick(listItem);

    	const pointerenter_handler = i => {
    		$$invalidate(15, highlightIndex = i);
    	};

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			list = $$value;
    			$$invalidate(14, list);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("items" in $$props) $$invalidate(28, items = $$props.items);
    		if ("searchFunction" in $$props) $$invalidate(31, searchFunction = $$props.searchFunction);
    		if ("labelFieldName" in $$props) $$invalidate(32, labelFieldName = $$props.labelFieldName);
    		if ("keywordsFieldName" in $$props) $$invalidate(33, keywordsFieldName = $$props.keywordsFieldName);
    		if ("valueFieldName" in $$props) $$invalidate(34, valueFieldName = $$props.valueFieldName);
    		if ("labelFunction" in $$props) $$invalidate(35, labelFunction = $$props.labelFunction);
    		if ("keywordsFunction" in $$props) $$invalidate(36, keywordsFunction = $$props.keywordsFunction);
    		if ("valueFunction" in $$props) $$invalidate(37, valueFunction = $$props.valueFunction);
    		if ("keywordsCleanFunction" in $$props) $$invalidate(38, keywordsCleanFunction = $$props.keywordsCleanFunction);
    		if ("textCleanFunction" in $$props) $$invalidate(39, textCleanFunction = $$props.textCleanFunction);
    		if ("beforeChange" in $$props) $$invalidate(40, beforeChange = $$props.beforeChange);
    		if ("onChange" in $$props) $$invalidate(41, onChange = $$props.onChange);
    		if ("selectFirstIfEmpty" in $$props) $$invalidate(42, selectFirstIfEmpty = $$props.selectFirstIfEmpty);
    		if ("minCharactersToSearch" in $$props) $$invalidate(43, minCharactersToSearch = $$props.minCharactersToSearch);
    		if ("maxItemsToShowInList" in $$props) $$invalidate(0, maxItemsToShowInList = $$props.maxItemsToShowInList);
    		if ("delay" in $$props) $$invalidate(44, delay = $$props.delay);
    		if ("localFiltering" in $$props) $$invalidate(45, localFiltering = $$props.localFiltering);
    		if ("noResultsText" in $$props) $$invalidate(1, noResultsText = $$props.noResultsText);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("className" in $$props) $$invalidate(3, className = $$props.className);
    		if ("inputClassName" in $$props) $$invalidate(4, inputClassName = $$props.inputClassName);
    		if ("inputId" in $$props) $$invalidate(5, inputId = $$props.inputId);
    		if ("name" in $$props) $$invalidate(6, name = $$props.name);
    		if ("title" in $$props) $$invalidate(7, title = $$props.title);
    		if ("html5autocomplete" in $$props) $$invalidate(8, html5autocomplete = $$props.html5autocomplete);
    		if ("dropdownClassName" in $$props) $$invalidate(9, dropdownClassName = $$props.dropdownClassName);
    		if ("hideArrow" in $$props) $$invalidate(10, hideArrow = $$props.hideArrow);
    		if ("showClear" in $$props) $$invalidate(11, showClear = $$props.showClear);
    		if ("disabled" in $$props) $$invalidate(12, disabled = $$props.disabled);
    		if ("debug" in $$props) $$invalidate(46, debug = $$props.debug);
    		if ("selectedItem" in $$props) $$invalidate(29, selectedItem = $$props.selectedItem);
    		if ("value" in $$props) $$invalidate(30, value = $$props.value);
    		if ("$$scope" in $$props) $$invalidate(49, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*selectedItem*/ 536870912) {
    			(onSelectedItemChanged());
    		}

    		if ($$self.$$.dirty[0] & /*items*/ 268435456 | $$self.$$.dirty[1] & /*opened, filteredTextLength*/ 196608) {
    			$$invalidate(18, showList = opened && (items && items.length > 0 || filteredTextLength > 0));
    		}

    		if ($$self.$$.dirty[0] & /*items*/ 268435456) {
    			(prepareListItems());
    		}
    	};

    	return [
    		maxItemsToShowInList,
    		noResultsText,
    		placeholder,
    		className,
    		inputClassName,
    		inputId,
    		name,
    		title,
    		html5autocomplete,
    		dropdownClassName,
    		hideArrow,
    		showClear,
    		disabled,
    		input,
    		list,
    		highlightIndex,
    		text,
    		filteredListItems,
    		showList,
    		uniqueId,
    		onListItemClick,
    		onDocumentClick,
    		onKeyDown,
    		onKeyPress,
    		onInput,
    		onInputClick,
    		onFocus,
    		clear,
    		items,
    		selectedItem,
    		value,
    		searchFunction,
    		labelFieldName,
    		keywordsFieldName,
    		valueFieldName,
    		labelFunction,
    		keywordsFunction,
    		valueFunction,
    		keywordsCleanFunction,
    		textCleanFunction,
    		beforeChange,
    		onChange,
    		selectFirstIfEmpty,
    		minCharactersToSearch,
    		delay,
    		localFiltering,
    		debug,
    		opened,
    		filteredTextLength,
    		$$scope,
    		slots,
    		input_1_binding,
    		input_1_input_handler,
    		click_handler,
    		pointerenter_handler,
    		div0_binding
    	];
    }

    class SimpleAutocomplete extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$d,
    			create_fragment$c,
    			safe_not_equal,
    			{
    				items: 28,
    				searchFunction: 31,
    				labelFieldName: 32,
    				keywordsFieldName: 33,
    				valueFieldName: 34,
    				labelFunction: 35,
    				keywordsFunction: 36,
    				valueFunction: 37,
    				keywordsCleanFunction: 38,
    				textCleanFunction: 39,
    				beforeChange: 40,
    				onChange: 41,
    				selectFirstIfEmpty: 42,
    				minCharactersToSearch: 43,
    				maxItemsToShowInList: 0,
    				delay: 44,
    				localFiltering: 45,
    				noResultsText: 1,
    				placeholder: 2,
    				className: 3,
    				inputClassName: 4,
    				inputId: 5,
    				name: 6,
    				title: 7,
    				html5autocomplete: 8,
    				dropdownClassName: 9,
    				hideArrow: 10,
    				showClear: 11,
    				disabled: 12,
    				debug: 46,
    				selectedItem: 29,
    				value: 30
    			},
    			[-1, -1, -1]
    		);
    	}
    }

    /* src/components/Input/AutocompleteInput.svelte generated by Svelte v3.38.2 */

    function create_fragment$b(ctx) {
    	let form;
    	let autocomplete;
    	let current;

    	autocomplete = new SimpleAutocomplete({
    			props: {
    				textCleanFunction: /*func*/ ctx[8],
    				searchFunction: /*searchFunction*/ ctx[3],
    				beforeChange: /*func_1*/ ctx[9],
    				labelFunction: /*func_2*/ ctx[10],
    				inputId: /*inputId*/ ctx[2],
    				noResultsText: /*noResultsText*/ ctx[1],
    				disabled: /*disabled*/ ctx[5],
    				hideArrow: true,
    				selectedItem: { attr: /*value*/ ctx[0] }
    			}
    		});

    	return {
    		c() {
    			form = element("form");
    			create_component(autocomplete.$$.fragment);
    			attr(form, "autocomplete", "off");
    		},
    		m(target, anchor) {
    			insert(target, form, anchor);
    			mount_component(autocomplete, form, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const autocomplete_changes = {};
    			if (dirty & /*value*/ 1) autocomplete_changes.textCleanFunction = /*func*/ ctx[8];
    			if (dirty & /*searchFunction*/ 8) autocomplete_changes.searchFunction = /*searchFunction*/ ctx[3];
    			if (dirty & /*suggestionFormat*/ 16) autocomplete_changes.labelFunction = /*func_2*/ ctx[10];
    			if (dirty & /*inputId*/ 4) autocomplete_changes.inputId = /*inputId*/ ctx[2];
    			if (dirty & /*noResultsText*/ 2) autocomplete_changes.noResultsText = /*noResultsText*/ ctx[1];
    			if (dirty & /*disabled*/ 32) autocomplete_changes.disabled = /*disabled*/ ctx[5];
    			if (dirty & /*value*/ 1) autocomplete_changes.selectedItem = { attr: /*value*/ ctx[0] };
    			autocomplete.$set(autocomplete_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(autocomplete.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(autocomplete.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(form);
    			destroy_component(autocomplete);
    		}
    	};
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();
    	let { noResultsText } = $$props;
    	let { inputId } = $$props;
    	let { searchFunction } = $$props;
    	let { value } = $$props;
    	let { suggestionFormat } = $$props;
    	let { disabled } = $$props;
    	let { inputType } = $$props;
    	onMount(() => restrict(document.getElementById(inputId), inputType));
    	const func = text => $$invalidate(0, value = text);

    	const func_1 = (prevSelectedValue, newSelectedValue) => {
    		dispatch("change", newSelectedValue);
    	};

    	const func_2 = item => {
    		const values = Object.values(item);
    		if (values.length === 0) return ""; else if (values.length === 1 && Object.keys(item)[0] === "attr") return item.attr; else return suggestionFormat(...values);
    	};

    	$$self.$$set = $$props => {
    		if ("noResultsText" in $$props) $$invalidate(1, noResultsText = $$props.noResultsText);
    		if ("inputId" in $$props) $$invalidate(2, inputId = $$props.inputId);
    		if ("searchFunction" in $$props) $$invalidate(3, searchFunction = $$props.searchFunction);
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("suggestionFormat" in $$props) $$invalidate(4, suggestionFormat = $$props.suggestionFormat);
    		if ("disabled" in $$props) $$invalidate(5, disabled = $$props.disabled);
    		if ("inputType" in $$props) $$invalidate(7, inputType = $$props.inputType);
    	};

    	return [
    		value,
    		noResultsText,
    		inputId,
    		searchFunction,
    		suggestionFormat,
    		disabled,
    		dispatch,
    		inputType,
    		func,
    		func_1,
    		func_2
    	];
    }

    class AutocompleteInput extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$c, create_fragment$b, safe_not_equal, {
    			noResultsText: 1,
    			inputId: 2,
    			searchFunction: 3,
    			value: 0,
    			suggestionFormat: 4,
    			disabled: 5,
    			inputType: 7
    		});
    	}
    }

    const createKeyValueStore = () => {
      const store = writable({});

      return {
        ...store,
        setValue: (key, value) =>
          store.update((formularStore) => ({
            ...formularStore,
            [key]: value,
          })),
        removeValue: (key) =>
          store.update((formularStore) => {
            const { [key]: _, ...rest } = formularStore;
            return rest;
          }),
      };
    };

    const keyValueStore = createKeyValueStore();

    /* src/components/Input/PopupFormular.svelte generated by Svelte v3.38.2 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	child_ctx[20] = list;
    	child_ctx[21] = i;
    	return child_ctx;
    }

    // (96:59) 
    function create_if_block_7(ctx) {
    	let button;
    	let t_value = /*input*/ ctx[19].text + "";
    	let t;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			t = text(t_value);
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);
    			append(button, t);

    			if (!mounted) {
    				dispose = listen(button, "click", function () {
    					if (is_function(/*input*/ ctx[19].onClick)) /*input*/ ctx[19].onClick.apply(this, arguments);
    				});

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*popupFormularConfiguration*/ 1 && t_value !== (t_value = /*input*/ ctx[19].text + "")) set_data(t, t_value);
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (84:62) 
    function create_if_block_6(ctx) {
    	let selectinput;
    	let updating_selectedValuesString;
    	let current;

    	function selectinput_selectedValuesString_binding(value) {
    		/*selectinput_selectedValuesString_binding*/ ctx[12](value, /*input*/ ctx[19]);
    	}

    	let selectinput_props = {
    		selectionOptions: /*input*/ ctx[19].selectionOptions,
    		disabled: /*input*/ ctx[19].disabled,
    		isMulti: /*input*/ ctx[19].isMulti,
    		isCreatable: /*input*/ ctx[19].isCreatable,
    		isClearable: /*input*/ ctx[19].isClearable,
    		placeholder: /*input*/ ctx[19].placeholder
    	};

    	if (/*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr] !== void 0) {
    		selectinput_props.selectedValuesString = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    	}

    	selectinput = new SelectInput({ props: selectinput_props });
    	binding_callbacks.push(() => bind$1(selectinput, "selectedValuesString", selectinput_selectedValuesString_binding));

    	return {
    		c() {
    			create_component(selectinput.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(selectinput, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const selectinput_changes = {};
    			if (dirty & /*popupFormularConfiguration*/ 1) selectinput_changes.selectionOptions = /*input*/ ctx[19].selectionOptions;
    			if (dirty & /*popupFormularConfiguration*/ 1) selectinput_changes.disabled = /*input*/ ctx[19].disabled;
    			if (dirty & /*popupFormularConfiguration*/ 1) selectinput_changes.isMulti = /*input*/ ctx[19].isMulti;
    			if (dirty & /*popupFormularConfiguration*/ 1) selectinput_changes.isCreatable = /*input*/ ctx[19].isCreatable;
    			if (dirty & /*popupFormularConfiguration*/ 1) selectinput_changes.isClearable = /*input*/ ctx[19].isClearable;
    			if (dirty & /*popupFormularConfiguration*/ 1) selectinput_changes.placeholder = /*input*/ ctx[19].placeholder;

    			if (!updating_selectedValuesString && dirty & /*$keyValueStore, popupFormularConfiguration*/ 3) {
    				updating_selectedValuesString = true;
    				selectinput_changes.selectedValuesString = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    				add_flush_callback(() => updating_selectedValuesString = false);
    			}

    			selectinput.$set(selectinput_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(selectinput.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(selectinput.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(selectinput, detaching);
    		}
    	};
    }

    // (73:57) 
    function create_if_block_5(ctx) {
    	let dateinput;
    	let updating_timeMillis;
    	let current;

    	function dateinput_timeMillis_binding(value) {
    		/*dateinput_timeMillis_binding*/ ctx[10](value, /*input*/ ctx[19]);
    	}

    	function change_handler_3(...args) {
    		return /*change_handler_3*/ ctx[11](/*input*/ ctx[19], ...args);
    	}

    	let dateinput_props = {
    		disabled: /*input*/ ctx[19].disabled,
    		quickset: /*input*/ ctx[19].quickset ?? {}
    	};

    	if (/*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr] !== void 0) {
    		dateinput_props.timeMillis = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    	}

    	dateinput = new DateInput({ props: dateinput_props });
    	binding_callbacks.push(() => bind$1(dateinput, "timeMillis", dateinput_timeMillis_binding));
    	dateinput.$on("change", change_handler_3);

    	return {
    		c() {
    			create_component(dateinput.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(dateinput, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const dateinput_changes = {};
    			if (dirty & /*popupFormularConfiguration*/ 1) dateinput_changes.disabled = /*input*/ ctx[19].disabled;
    			if (dirty & /*popupFormularConfiguration*/ 1) dateinput_changes.quickset = /*input*/ ctx[19].quickset ?? {};

    			if (!updating_timeMillis && dirty & /*$keyValueStore, popupFormularConfiguration*/ 3) {
    				updating_timeMillis = true;
    				dateinput_changes.timeMillis = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    				add_flush_callback(() => updating_timeMillis = false);
    			}

    			dateinput.$set(dateinput_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(dateinput.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(dateinput.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(dateinput, detaching);
    		}
    	};
    }

    // (63:61) 
    function create_if_block_4(ctx) {
    	let checkbox;
    	let updating_checked;
    	let current;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[8](value, /*input*/ ctx[19]);
    	}

    	function change_handler_2(...args) {
    		return /*change_handler_2*/ ctx[9](/*input*/ ctx[19], ...args);
    	}

    	let checkbox_props = {
    		id: /*input*/ ctx[19].id,
    		name: /*input*/ ctx[19].id,
    		size: "2rem"
    	};

    	if (/*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr] !== void 0) {
    		checkbox_props.checked = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    	}

    	checkbox = new Checkbox({ props: checkbox_props });
    	binding_callbacks.push(() => bind$1(checkbox, "checked", checkbox_checked_binding));
    	checkbox.$on("change", change_handler_2);

    	return {
    		c() {
    			create_component(checkbox.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(checkbox, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const checkbox_changes = {};
    			if (dirty & /*popupFormularConfiguration*/ 1) checkbox_changes.id = /*input*/ ctx[19].id;
    			if (dirty & /*popupFormularConfiguration*/ 1) checkbox_changes.name = /*input*/ ctx[19].id;

    			if (!updating_checked && dirty & /*$keyValueStore, popupFormularConfiguration*/ 3) {
    				updating_checked = true;
    				checkbox_changes.checked = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(checkbox, detaching);
    		}
    	};
    }

    // (50:65) 
    function create_if_block_3(ctx) {
    	let autocompleteinput;
    	let updating_value;
    	let current;

    	function autocompleteinput_value_binding(value) {
    		/*autocompleteinput_value_binding*/ ctx[6](value, /*input*/ ctx[19]);
    	}

    	function change_handler_1(...args) {
    		return /*change_handler_1*/ ctx[7](/*input*/ ctx[19], ...args);
    	}

    	let autocompleteinput_props = {
    		inputType: /*input*/ ctx[19].inputType,
    		inputId: /*input*/ ctx[19].id,
    		disabled: /*input*/ ctx[19].disabled,
    		noResultsText: /*input*/ ctx[19].noResultsText,
    		searchFunction: /*input*/ ctx[19].searchFunction,
    		suggestionFormat: /*input*/ ctx[19].suggestionFormat
    	};

    	if (/*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr] !== void 0) {
    		autocompleteinput_props.value = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    	}

    	autocompleteinput = new AutocompleteInput({ props: autocompleteinput_props });
    	binding_callbacks.push(() => bind$1(autocompleteinput, "value", autocompleteinput_value_binding));
    	autocompleteinput.$on("change", change_handler_1);

    	return {
    		c() {
    			create_component(autocompleteinput.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(autocompleteinput, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const autocompleteinput_changes = {};
    			if (dirty & /*popupFormularConfiguration*/ 1) autocompleteinput_changes.inputType = /*input*/ ctx[19].inputType;
    			if (dirty & /*popupFormularConfiguration*/ 1) autocompleteinput_changes.inputId = /*input*/ ctx[19].id;
    			if (dirty & /*popupFormularConfiguration*/ 1) autocompleteinput_changes.disabled = /*input*/ ctx[19].disabled;
    			if (dirty & /*popupFormularConfiguration*/ 1) autocompleteinput_changes.noResultsText = /*input*/ ctx[19].noResultsText;
    			if (dirty & /*popupFormularConfiguration*/ 1) autocompleteinput_changes.searchFunction = /*input*/ ctx[19].searchFunction;
    			if (dirty & /*popupFormularConfiguration*/ 1) autocompleteinput_changes.suggestionFormat = /*input*/ ctx[19].suggestionFormat;

    			if (!updating_value && dirty & /*$keyValueStore, popupFormularConfiguration*/ 3) {
    				updating_value = true;
    				autocompleteinput_changes.value = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    				add_flush_callback(() => updating_value = false);
    			}

    			autocompleteinput.$set(autocompleteinput_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(autocompleteinput.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(autocompleteinput.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(autocompleteinput, detaching);
    		}
    	};
    }

    // (38:16) {#if input.type === InputTypes.TEXT}
    function create_if_block_2$1(ctx) {
    	let textinput;
    	let updating_value;
    	let current;

    	function textinput_value_binding(value) {
    		/*textinput_value_binding*/ ctx[4](value, /*input*/ ctx[19]);
    	}

    	function change_handler(...args) {
    		return /*change_handler*/ ctx[5](/*input*/ ctx[19], ...args);
    	}

    	let textinput_props = {
    		inputType: /*input*/ ctx[19].inputType,
    		id: /*input*/ ctx[19].id,
    		readonly: /*input*/ ctx[19].readonly,
    		disabled: /*input*/ ctx[19].disabled,
    		multiline: /*input*/ ctx[19].multiline ?? false
    	};

    	if (/*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr] !== void 0) {
    		textinput_props.value = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    	}

    	textinput = new TextInput({ props: textinput_props });
    	binding_callbacks.push(() => bind$1(textinput, "value", textinput_value_binding));
    	textinput.$on("change", change_handler);

    	return {
    		c() {
    			create_component(textinput.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(textinput, target, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const textinput_changes = {};
    			if (dirty & /*popupFormularConfiguration*/ 1) textinput_changes.inputType = /*input*/ ctx[19].inputType;
    			if (dirty & /*popupFormularConfiguration*/ 1) textinput_changes.id = /*input*/ ctx[19].id;
    			if (dirty & /*popupFormularConfiguration*/ 1) textinput_changes.readonly = /*input*/ ctx[19].readonly;
    			if (dirty & /*popupFormularConfiguration*/ 1) textinput_changes.disabled = /*input*/ ctx[19].disabled;
    			if (dirty & /*popupFormularConfiguration*/ 1) textinput_changes.multiline = /*input*/ ctx[19].multiline ?? false;

    			if (!updating_value && dirty & /*$keyValueStore, popupFormularConfiguration*/ 3) {
    				updating_value = true;
    				textinput_changes.value = /*$keyValueStore*/ ctx[1][/*input*/ ctx[19].bindTo.keyValueStoreKey][/*input*/ ctx[19].bindTo.attr];
    				add_flush_callback(() => updating_value = false);
    			}

    			textinput.$set(textinput_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(textinput.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(textinput.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(textinput, detaching);
    		}
    	};
    }

    // (30:10) {#each popupFormularConfiguration.inputs             .filter((input) => !input.hidden || !input.hidden())             .filter((input) => input.group === group) as input}
    function create_each_block_1(ctx) {
    	let row;
    	let div0;
    	let label;
    	let t0_value = /*input*/ ctx[19].label + "";
    	let t0;
    	let label_for_value;
    	let t1;
    	let div1;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	const if_block_creators = [
    		create_if_block_2$1,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*input*/ ctx[19].type === InputTypes.TEXT) return 0;
    		if (/*input*/ ctx[19].type === InputTypes.AUTOCOMPLETE) return 1;
    		if (/*input*/ ctx[19].type === InputTypes.CHECKBOX) return 2;
    		if (/*input*/ ctx[19].type === InputTypes.DATE) return 3;
    		if (/*input*/ ctx[19].type === InputTypes.SELECTION) return 4;
    		if (/*input*/ ctx[19].type === InputTypes.BUTTON) return 5;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c() {
    			row = element("row");
    			div0 = element("div");
    			label = element("label");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			attr(label, "for", label_for_value = /*input*/ ctx[19].id);
    			attr(label, "class", "svelte-1muzuqp");
    			attr(div0, "class", "col-label svelte-1muzuqp");
    			attr(div1, "class", "col-input svelte-1muzuqp");
    			attr(row, "class", "svelte-1muzuqp");
    		},
    		m(target, anchor) {
    			insert(target, row, anchor);
    			append(row, div0);
    			append(div0, label);
    			append(label, t0);
    			append(row, t1);
    			append(row, div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div1, null);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if ((!current || dirty & /*popupFormularConfiguration*/ 1) && t0_value !== (t0_value = /*input*/ ctx[19].label + "")) set_data(t0, t0_value);

    			if (!current || dirty & /*popupFormularConfiguration*/ 1 && label_for_value !== (label_for_value = /*input*/ ctx[19].id)) {
    				attr(label, "for", label_for_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(row);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};
    }

    // (26:8) <InputGroup>
    function create_default_slot$2(ctx) {
    	let row;
    	let h3;
    	let t0_value = /*group*/ ctx[16] + "";
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	function func_1(...args) {
    		return /*func_1*/ ctx[3](/*group*/ ctx[16], ...args);
    	}

    	let each_value_1 = /*popupFormularConfiguration*/ ctx[0].inputs.filter(func$1).filter(func_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c() {
    			row = element("row");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr(h3, "class", "svelte-1muzuqp");
    			attr(row, "class", "svelte-1muzuqp");
    		},
    		m(target, anchor) {
    			insert(target, row, anchor);
    			append(row, h3);
    			append(h3, t0);
    			insert(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, t2, anchor);
    			current = true;
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*popupFormularConfiguration*/ 1) && t0_value !== (t0_value = /*group*/ ctx[16] + "")) set_data(t0, t0_value);

    			if (dirty & /*popupFormularConfiguration, $keyValueStore, InputTypes*/ 3) {
    				each_value_1 = /*popupFormularConfiguration*/ ctx[0].inputs.filter(func$1).filter(func_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(t2.parentNode, t2);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(row);
    			if (detaching) detach(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach(t2);
    		}
    	};
    }

    // (25:6) {#each popupFormularConfiguration.inputGroups as group}
    function create_each_block$1(ctx) {
    	let inputgroup;
    	let current;

    	inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(inputgroup.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(inputgroup, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const inputgroup_changes = {};

    			if (dirty & /*$$scope, popupFormularConfiguration, $keyValueStore*/ 4194307) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(inputgroup.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(inputgroup.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(inputgroup, detaching);
    		}
    	};
    }

    // (108:4) {#if popupFormularConfiguration.displayDeleteButton}
    function create_if_block_1$1(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			button.textContent = "Löschen";
    			attr(button, "class", "button-delete svelte-1muzuqp");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler_1*/ ctx[14], { once: true });
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (111:4) {#if popupFormularConfiguration.displaySaveButton}
    function create_if_block$2(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			button.textContent = "Speichern";
    			attr(button, "class", "button-save");
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", /*click_handler_2*/ ctx[15], { once: true });
    				mounted = true;
    			}
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	let div3;
    	let div1;
    	let h1;
    	let t0_value = /*popupFormularConfiguration*/ ctx[0].title + "";
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let div2;
    	let button;
    	let t4;
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*popupFormularConfiguration*/ ctx[0].inputGroups;
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	let if_block0 = /*popupFormularConfiguration*/ ctx[0].displayDeleteButton && create_if_block_1$1(ctx);
    	let if_block1 = /*popupFormularConfiguration*/ ctx[0].displaySaveButton && create_if_block$2(ctx);

    	return {
    		c() {
    			div3 = element("div");
    			div1 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			button = element("button");
    			button.textContent = "Abbrechen";
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			attr(h1, "class", "svelte-1muzuqp");
    			attr(div0, "class", "content svelte-1muzuqp");
    			attr(div1, "class", "container svelte-1muzuqp");
    			attr(button, "class", "button-cancel");
    			attr(div2, "class", "footer svelte-1muzuqp");
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div1);
    			append(div1, h1);
    			append(h1, t0);
    			append(div1, t1);
    			append(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append(div3, t2);
    			append(div3, div2);
    			append(div2, button);
    			append(div2, t4);
    			if (if_block0) if_block0.m(div2, null);
    			append(div2, t5);
    			if (if_block1) if_block1.m(div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(button, "click", /*click_handler*/ ctx[13], { once: true }),
    					listen(div3, "keydown", keydown_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if ((!current || dirty & /*popupFormularConfiguration*/ 1) && t0_value !== (t0_value = /*popupFormularConfiguration*/ ctx[0].title + "")) set_data(t0, t0_value);

    			if (dirty & /*popupFormularConfiguration, $keyValueStore, InputTypes*/ 3) {
    				each_value = /*popupFormularConfiguration*/ ctx[0].inputGroups;
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (/*popupFormularConfiguration*/ ctx[0].displayDeleteButton) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div2, t5);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*popupFormularConfiguration*/ ctx[0].displaySaveButton) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div2, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			destroy_each(each_blocks, detaching);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    const func$1 = input => !input.hidden || !input.hidden();

    const keydown_handler = event => {
    	if (event.key == "ArrowLeft" || event.key == "ArrowRight") event.stopPropagation();
    };

    function instance$b($$self, $$props, $$invalidate) {
    	let $keyValueStore;
    	component_subscribe($$self, keyValueStore, $$value => $$invalidate(1, $keyValueStore = $$value));
    	const dispatch = createEventDispatcher();
    	let { popupFormularConfiguration } = $$props;
    	const func_1 = (group, input) => input.group === group;

    	function textinput_value_binding(value, input) {
    		if ($$self.$$.not_equal($keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr], value)) {
    			$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = value;
    			keyValueStore.set($keyValueStore);
    		}
    	}

    	const change_handler = (input, event) => {
    		if (input.onChange) input.onChange(event.detail);
    	};

    	function autocompleteinput_value_binding(value, input) {
    		if ($$self.$$.not_equal($keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr], value)) {
    			$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = value;
    			keyValueStore.set($keyValueStore);
    		}
    	}

    	const change_handler_1 = (input, event) => {
    		if (input.onChange) input.onChange(event.detail);
    	};

    	function checkbox_checked_binding(value, input) {
    		if ($$self.$$.not_equal($keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr], value)) {
    			$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = value;
    			keyValueStore.set($keyValueStore);
    		}
    	}

    	const change_handler_2 = (input, event) => {
    		if (input.onChange) input.onChange(event.detail);
    	};

    	function dateinput_timeMillis_binding(value, input) {
    		if ($$self.$$.not_equal($keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr], value)) {
    			$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = value;
    			keyValueStore.set($keyValueStore);
    		}
    	}

    	const change_handler_3 = (input, event) => {
    		if (input.onChange) input.onChange(event.detail);
    	};

    	function selectinput_selectedValuesString_binding(value, input) {
    		if ($$self.$$.not_equal($keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr], value)) {
    			$keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = value;
    			keyValueStore.set($keyValueStore);
    		}
    	}

    	const click_handler = () => dispatch("cancel");
    	const click_handler_1 = () => dispatch("delete");

    	const click_handler_2 = () => {
    		popupFormularConfiguration.inputs.filter(input => input.inputType && input.inputType === "number").forEach(input => {
    			const value = String($keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr]).trim();

    			if (value.length === 0) {
    				set_store_value(keyValueStore, $keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = 0, $keyValueStore);
    			} else {
    				set_store_value(keyValueStore, $keyValueStore[input.bindTo.keyValueStoreKey][input.bindTo.attr] = parseInt(value, 10), $keyValueStore);
    			}
    		});

    		dispatch("save");
    	};

    	$$self.$$set = $$props => {
    		if ("popupFormularConfiguration" in $$props) $$invalidate(0, popupFormularConfiguration = $$props.popupFormularConfiguration);
    	};

    	return [
    		popupFormularConfiguration,
    		$keyValueStore,
    		dispatch,
    		func_1,
    		textinput_value_binding,
    		change_handler,
    		autocompleteinput_value_binding,
    		change_handler_1,
    		checkbox_checked_binding,
    		change_handler_2,
    		dateinput_timeMillis_binding,
    		change_handler_3,
    		selectinput_selectedValuesString_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class PopupFormular extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$b, create_fragment$a, safe_not_equal, { popupFormularConfiguration: 0 });
    	}
    }

    /* src/components/TableEditors/Customers/CustomerPopupFormular.svelte generated by Svelte v3.38.2 */

    function create_fragment$9(ctx) {
    	let popupformular;
    	let current;

    	popupformular = new PopupFormular({
    			props: {
    				popupFormularConfiguration: /*popupFormularConfiguration*/ ctx[4]
    			}
    		});

    	popupformular.$on("delete", /*delete_handler*/ ctx[5]);
    	popupformular.$on("save", /*save_handler*/ ctx[6]);
    	popupformular.$on("cancel", /*close*/ ctx[3]);

    	return {
    		c() {
    			create_component(popupformular.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(popupformular, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(popupformular.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(popupformular.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(popupformular, detaching);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $keyValueStore;
    	component_subscribe($$self, keyValueStore, $$value => $$invalidate(2, $keyValueStore = $$value));
    	const { close } = getContext("simple-modal");
    	let { createNew } = $$props;
    	let { onSave } = $$props;

    	if (createNew) {
    		keyValueStore.setValue("currentDoc", {
    			registration_date: millisAtStartOfToday(),
    			type: "customer",
    			lastname: "",
    			firstname: "",
    			renewed_on: 0,
    			remark: "",
    			subscribed_to_newsletter: false,
    			email: "",
    			street: "",
    			house_number: "",
    			postal_code: "",
    			city: "",
    			telephone_number: "",
    			heard: "",
    			highlight: ""
    		});

    		Database.nextUnusedId("customer").then(id => keyValueStore.setValue("currentDoc", { ...$keyValueStore["currentDoc"], id }));
    	}

    	const popupFormularConfiguration = new PopupFormularConfiguration().setTitle(`Kunde ${createNew ? "anlegen" : "bearbeiten"}`).setDisplayDeleteButton(!createNew).setInputGroups(["Name", "Adresse", "Kontakt", "Mitgliedschaft", "Sonstiges"]).setInputs([
    		{
    			id: "firstname",
    			label: "Vorname",
    			group: "Name",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "firstname"
    			}
    		},
    		{
    			id: "lastname",
    			label: "Nachname",
    			group: "Name",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "lastname"
    			}
    		},
    		{
    			id: "street",
    			label: "Straße",
    			group: "Adresse",
    			type: InputTypes.AUTOCOMPLETE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "street"
    			},
    			onChange: selectedItem => {
    				keyValueStore.setValue("currentDoc", {
    					...$keyValueStore["currentDoc"],
    					street: selectedItem.street
    				});
    			},
    			searchFunction: searchTerm => Database.fetchUniqueCustomerFieldValues("street", searchTerm),
    			suggestionFormat: street => `${street}`,
    			noResultsText: "Straße noch nicht in Datenbank"
    		},
    		{
    			id: "house_number",
    			label: "Hausnummer",
    			group: "Adresse",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "house_number"
    			}
    		},
    		{
    			id: "postal_code",
    			label: "Postleitzahl",
    			group: "Adresse",
    			type: InputTypes.AUTOCOMPLETE,
    			inputType: "number",
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "postal_code"
    			},
    			onChange: selectedItem => {
    				keyValueStore.setValue("currentDoc", {
    					...$keyValueStore["currentDoc"],
    					postal_code: selectedItem.postal_code
    				});
    			},
    			searchFunction: searchTerm => Database.fetchUniqueCustomerFieldValues("postal_code", searchTerm, true),
    			suggestionFormat: postal_code => `${postal_code}`,
    			noResultsText: "PLZ noch nicht in Datenbank"
    		},
    		{
    			id: "city",
    			label: "Stadt",
    			group: "Adresse",
    			type: InputTypes.AUTOCOMPLETE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "city"
    			},
    			onChange: selectedItem => {
    				keyValueStore.setValue("currentDoc", {
    					...$keyValueStore["currentDoc"],
    					city: selectedItem.city
    				});
    			},
    			searchFunction: searchTerm => Database.fetchUniqueCustomerFieldValues("city", searchTerm),
    			suggestionFormat: city => `${city}`,
    			noResultsText: "Stadt noch nicht in Datenbank"
    		},
    		{
    			id: "email",
    			label: "E-Mail",
    			group: "Kontakt",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "email"
    			}
    		},
    		{
    			id: "telephone_number",
    			label: "Telefonnummer",
    			group: "Kontakt",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "telephone_number"
    			}
    		},
    		{
    			id: "subscribed_to_newsletter",
    			label: "Newsletter",
    			group: "Kontakt",
    			type: InputTypes.CHECKBOX,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "subscribed_to_newsletter"
    			}
    		},
    		{
    			id: "registration_date",
    			label: "Beitritt",
    			group: "Mitgliedschaft",
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "registration_date"
    			}
    		},
    		{
    			id: "renewed_on",
    			label: "Verlängert am",
    			group: "Mitgliedschaft",
    			hidden: () => createNew,
    			quickset: { 0: "Heute" },
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "renewed_on"
    			}
    		},
    		{
    			id: "heard",
    			label: "Aufmerksam geworden",
    			group: "Mitgliedschaft",
    			type: InputTypes.SELECTION,
    			selectionOptions: ["Internet", "Freunde & Bekannte", "Zeitung / Medien", "Nachbarschaft"],
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "heard"
    			},
    			isCreatable: true,
    			isMulti: true,
    			isClearable: true
    		},
    		{
    			id: "id",
    			label: "Kundennummer",
    			group: "Sonstiges",
    			inputType: "number",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "id"
    			},
    			bindValueToObjectAttr: "id"
    		},
    		{
    			id: "remark",
    			label: "Bemerkung",
    			group: "Sonstiges",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "remark"
    			}
    		},
    		{
    			id: "highlight",
    			label: "Markieren",
    			group: "Sonstiges",
    			type: InputTypes.SELECTION,
    			selectionOptions: [
    				{ value: "", label: "Nicht markieren" },
    				{
    					value: COLORS.HIGHLIGHT_GREEN,
    					label: "<a style='color:" + COLORS.HIGHLIGHT_GREEN + "'>■</a> Grün"
    				},
    				{
    					value: COLORS.HIGHLIGHT_BLUE,
    					label: "<a style='color: " + COLORS.HIGHLIGHT_BLUE + "'>■</a> Blau"
    				},
    				{
    					value: COLORS.HIGHLIGHT_YELLOW,
    					label: "<a style='color: " + COLORS.HIGHLIGHT_YELLOW + "'>■</a> Gelb"
    				},
    				{
    					value: COLORS.HIGHLIGHT_RED,
    					label: "<a style='color: " + COLORS.HIGHLIGHT_RED + "'>■</a> Rot"
    				}
    			],
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "highlight"
    			},
    			isClearable: true,
    			isMulti: false
    		}
    	]);

    	const delete_handler = event => {
    		const doc = $keyValueStore["currentDoc"];

    		if (confirm("Soll dieser Kunde wirklich gelöscht werden?")) {
    			Database.removeDoc(doc).then(() => success("Kunde gelöscht!")).then(close).then(onSave).catch(error => {
    				Logger.error(error.message);
    				danger("Kunde konnte nicht gelöscht werden!", 6000);
    			});
    		}
    	};

    	const save_handler = event => {
    		close();
    		const doc = $keyValueStore["currentDoc"];

    		const savePromise = createNew
    		? Database.createDoc(doc)
    		: Database.updateDoc(doc);

    		savePromise.then(result => success("Kunde gespeichert!")).then(onSave).catch(error => {
    			danger("Kunde konnte nicht gespeichert werden!", 6000);
    			Logger.error(error.message);
    		});
    	};

    	$$self.$$set = $$props => {
    		if ("createNew" in $$props) $$invalidate(0, createNew = $$props.createNew);
    		if ("onSave" in $$props) $$invalidate(1, onSave = $$props.onSave);
    	};

    	return [
    		createNew,
    		onSave,
    		$keyValueStore,
    		close,
    		popupFormularConfiguration,
    		delete_handler,
    		save_handler
    	];
    }

    class CustomerPopupFormular extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$a, create_fragment$9, safe_not_equal, { createNew: 0, onSave: 1 });
    	}
    }

    const ONE_YEAR_AGO_MILLIS = new Date().getTime() - 1000 * 60 * 60 * 24 * 365;

    var customerFilters = {
      filters: {
        "Newsletter: Ja": {
          required_fields: ["subscribed_to_newsletter"],
          selectors: {
            subscribed_to_newsletter: {
              $eq: true,
            },
          },
        },
        "Newsletter: Nein": {
          required_fields: ["subscribed_to_newsletter"],
          selectors: {
            subscribed_to_newsletter: {
              $eq: false,
            },
          },
        },
        "Beitritt vor > 1 Jahr": {
          required_fields: ["registration_date"],
          selectors: {
            registration_date: {
              $lt: ONE_YEAR_AGO_MILLIS,
            },
          },
        },
        "Beitritt vor < 1 Jahr": {
          required_fields: ["registration_date"],
          selectors: {
            registration_date: {
              $gt: ONE_YEAR_AGO_MILLIS,
            },
          },
        },
        "Verlängert vor > 1 Jahr": {
          required_fields: ["renewed_on"],
          selectors: {
            renewed_on: {
              $lt: ONE_YEAR_AGO_MILLIS,
            },
          },
        },
        "Verlängert vor < 1 Jahr": {
          required_fields: ["renewed_on"],
          selectors: {
            renewed_on: {
              $gt: ONE_YEAR_AGO_MILLIS,
            },
          },
        },
      },
      activeByDefault: [],
    };

    class WoocommerceClientMock {
      constructor() {}

      async fetchItem(wcItemId) {
        await new Promise((r) => setTimeout(r, 1500));
        const item = testdata.docs.find((item) => item.wc_id == wcItemId);
        if (wcItemId && item) {
          return {
            stock_status: item.status,
            attributes: [
              {
                options: [item.deposit + " €"],
              },
            ],
            ...(item.image && {
              images: [
                {
                  src: item.image,
                },
              ],
            }),
            permalink: item.wc_url,
            categories: [
              {
                name: item.category,
              },
            ],
          };
        } else {
          throw new Error("Failed to load wc product, http response code 404");
        }
      }

      async updateItem(item) {
        await new Promise((r) => setTimeout(r, 1500));
      }

      async deleteItem(item) {
        await new Promise((r) => setTimeout(r, 1500));
      }

      async createItem(item) {
        await new Promise((r) => setTimeout(r, 1500));
        return {
          permalink: "link",
          id: "wcId",
        };
      }
    }

    /* src/components/TableEditors/Items/ItemPopupFormular.svelte generated by Svelte v3.38.2 */

    function create_fragment$8(ctx) {
    	let popupformular;
    	let current;

    	popupformular = new PopupFormular({
    			props: {
    				popupFormularConfiguration: /*popupFormularConfiguration*/ ctx[6]
    			}
    		});

    	popupformular.$on("delete", /*delete_handler*/ ctx[7]);
    	popupformular.$on("save", /*save_handler*/ ctx[8]);
    	popupformular.$on("cancel", /*close*/ ctx[3]);

    	return {
    		c() {
    			create_component(popupformular.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(popupformular, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(popupformular.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(popupformular.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(popupformular, detaching);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $keyValueStore;
    	component_subscribe($$self, keyValueStore, $$value => $$invalidate(2, $keyValueStore = $$value));
    	const { close } = getContext("simple-modal");
    	const woocommerceClient = new WoocommerceClientMock();
    	let { createNew } = $$props;
    	let { onSave } = $$props;

    	if (createNew) {
    		keyValueStore.setValue("currentDoc", {
    			added: millisAtStartOfToday(),
    			status: "instock",
    			type: "item",
    			name: "",
    			brand: "",
    			itype: "",
    			category: "",
    			deposit: "",
    			parts: "",
    			exists_more_than_once: false,
    			manual: "",
    			package: "",
    			wc_url: "",
    			wc_id: "",
    			image: "",
    			highlight: "",
    			synonyms: "",
    			description: ""
    		});

    		Database.nextUnusedId("item").then(id => keyValueStore.setValue("currentDoc", { ...$keyValueStore["currentDoc"], id }));
    	}

    	const docIsDeleted = $keyValueStore["currentDoc"].status === "deleted";

    	const createOnWooCommerceAndUpdateInDb = doc => woocommerceClient.createItem(doc).then(wcDoc => {
    		doc.wc_url = wcDoc.permalink;
    		doc.wc_id = wcDoc.id;
    		Database.updateDoc(doc);
    		success("Gegenstand auf der Webseite erstellt!", 3000);
    	}).catch(error => {
    		warning("Gegenstand konnte auf der Webseite nicht erstellt werden!", 6000);
    		Logger.error(error.message);
    	});

    	keyValueStore.setValue("mock", { status: "gelöscht" });

    	const popupFormularConfiguration = new PopupFormularConfiguration().setTitle(`Gegenstand ${createNew ? "anlegen" : "bearbeiten"}`).setDisplayDeleteButton(!createNew && !docIsDeleted).setDisplaySaveButton(!docIsDeleted).setInputGroups([
    		...docIsDeleted ? ["Wie­der­her­stel­len"] : [],
    		"Bezeichnung",
    		"Beschreibung",
    		"Eigenschaften",
    		"Bild",
    		"Status"
    	]).setInputs([
    		...docIsDeleted
    		? [
    				{
    					type: InputTypes.BUTTON,
    					group: "Wie­der­her­stel­len",
    					text: "Gelöschten Gegenstand wie­der­her­stel­len",
    					onClick: async () => {
    						if (confirm("Soll dieser Gegenstand wiederhergestellt werden?")) {
    							let doc = await Database.fetchItemById($keyValueStore["currentDoc"].id);
    							doc.status = "instock";
    							createOnWooCommerceAndUpdateInDb(doc).then(close).then(onSave);
    						}
    					},
    					label: ""
    				}
    			]
    		: [],
    		{
    			id: "item_id",
    			disabled: docIsDeleted,
    			label: "Gegenstand Nr",
    			group: "Bezeichnung",
    			inputType: "number",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "id"
    			}
    		},
    		{
    			id: "name",
    			disabled: docIsDeleted,
    			label: "Gegenstand Name",
    			group: "Bezeichnung",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "name"
    			}
    		},
    		{
    			id: "brand",
    			disabled: docIsDeleted,
    			label: "Marke",
    			group: "Bezeichnung",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "brand"
    			}
    		},
    		{
    			id: "itype",
    			disabled: docIsDeleted,
    			label: "Typbezeichnung",
    			group: "Bezeichnung",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "itype"
    			}
    		},
    		{
    			id: "category",
    			disabled: docIsDeleted,
    			label: "Kategorie",
    			group: "Eigenschaften",
    			type: InputTypes.SELECTION,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "category"
    			},
    			selectionOptions: ["Küche", "Haushalt", "Garten", "Kinder", "Freizeit", "Heimwerker"],
    			isCreatable: false,
    			isMulti: true,
    			isClearable: true
    		},
    		{
    			id: "deposit",
    			disabled: docIsDeleted,
    			inputType: "number",
    			label: "Pfand",
    			group: "Eigenschaften",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "deposit"
    			}
    		},
    		{
    			id: "added",
    			disabled: docIsDeleted,
    			label: "Erfasst am",
    			group: "Eigenschaften",
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "added"
    			}
    		},
    		{
    			id: "description",
    			disabled: docIsDeleted,
    			label: "Beschreibung",
    			group: "Beschreibung",
    			type: InputTypes.TEXT,
    			multiline: true,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "description"
    			}
    		},
    		{
    			id: "synonyms",
    			disabled: docIsDeleted,
    			label: "Synonyme",
    			group: "Beschreibung",
    			type: InputTypes.SELECTION,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "synonyms"
    			},
    			isCreatable: true,
    			isMulti: true,
    			isClearable: true,
    			placeholder: "Synonyme anlegen"
    		},
    		{
    			id: "parts",
    			disabled: docIsDeleted,
    			label: "Anzahl Teile",
    			group: "Eigenschaften",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "parts"
    			}
    		},
    		{
    			id: "image",
    			disabled: docIsDeleted,
    			label: "Bild",
    			group: "Bild",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "image"
    			}
    		},
    		{
    			id: "status",
    			disabled: docIsDeleted,
    			label: "Status auf Webseite",
    			group: "Status",
    			type: InputTypes.SELECTION,
    			bindTo: {
    				keyValueStoreKey: docIsDeleted ? "mock" : "currentDoc",
    				attr: "status"
    			},
    			selectionOptions: [
    				{ value: "instock", label: "verfügbar" },
    				{ value: "outofstock", label: "verliehen" },
    				{
    					value: "onbackorder",
    					label: "nicht verleihbar"
    				},
    				{ value: "reserved", label: "reserviert" }
    			],
    			isCreatable: false,
    			isMulti: false,
    			isClearable: false
    		},
    		{
    			id: "exists_more_than_once",
    			label: "Mehrmals vorhanden",
    			group: "Status",
    			type: InputTypes.CHECKBOX,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "exists_more_than_once"
    			}
    		},
    		{
    			id: "highlight",
    			label: "Markieren",
    			group: "Status",
    			type: InputTypes.SELECTION,
    			selectionOptions: [
    				{ value: "", label: "Nicht markieren" },
    				{
    					value: COLORS.HIGHLIGHT_GREEN,
    					label: "<a style='color:" + COLORS.HIGHLIGHT_GREEN + "'>■</a> Grün"
    				},
    				{
    					value: COLORS.HIGHLIGHT_BLUE,
    					label: "<a style='color: " + COLORS.HIGHLIGHT_BLUE + "'>■</a> Blau"
    				},
    				{
    					value: COLORS.HIGHLIGHT_YELLOW,
    					label: "<a style='color: " + COLORS.HIGHLIGHT_YELLOW + "'>■</a> Gelb"
    				},
    				{
    					value: COLORS.HIGHLIGHT_RED,
    					label: "<a style='color: " + COLORS.HIGHLIGHT_RED + "'>■</a> Rot"
    				}
    			],
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "highlight"
    			},
    			isClearable: true,
    			isMulti: false
    		}
    	]);

    	const delete_handler = async event => {
    		const doc = $keyValueStore["currentDoc"];

    		if (confirm("Soll dieser Gegenstand wirklich gelöscht werden?")) {
    			doc.status = "deleted";

    			await Database.updateDoc(doc).then(() => success("Gegenstand als gelöscht markiert!")).then(close).then(onSave).catch(error => {
    				Logger.error(error.message);
    				danger("Gegenstand konnte nicht gelöscht werden!", 6000);
    			});

    			await woocommerceClient.deleteItem(doc).then(() => success("Gegenstand von der Webseite gelöscht!", 3000)).catch(error => {
    				warning("Gegenstand konnte nicht von der Webseite gelöscht werden!", 6000);
    				Logger.error(error.message);
    			});
    		}
    	};

    	const save_handler = async event => {
    		let doc = $keyValueStore["currentDoc"];

    		Object.keys(doc).forEach(key => {
    			const colForKey = itemColumns.find(col => col.key === key);

    			if (colForKey && colForKey.numeric && doc[key] === "") {
    				doc[key] = 0; // default value for numbers
    			}
    		});

    		if (createNew && await Database.itemWithIdExists(doc.id)) {
    			danger("Ein Gegenstand mit dieser Nummer existiert bereits!", 6000);
    			return;
    		}

    		close();

    		const savePromise = createNew
    		? Database.createDoc(doc)
    		: Database.updateDoc(doc);

    		await savePromise.then(result => success("Gegenstand gespeichert!")).then(onSave).catch(error => {
    			danger("Gegenstand konnte nicht gespeichert werden!", 6000);
    			Logger.error(error.message);
    		});

    		// get _id
    		doc = await Database.fetchItemById(doc.id);

    		if (createNew) {
    			createOnWooCommerceAndUpdateInDb(doc);
    		} else {
    			woocommerceClient.updateItem(doc).then(() => success("Status auf der Webseite aktualisiert!", 3000)).catch(error => {
    				warning("Status auf der Webseite konnte nicht aktualisiert werden!", 6000);
    				Logger.error(error.message);
    			});
    		}
    	};

    	$$self.$$set = $$props => {
    		if ("createNew" in $$props) $$invalidate(0, createNew = $$props.createNew);
    		if ("onSave" in $$props) $$invalidate(1, onSave = $$props.onSave);
    	};

    	return [
    		createNew,
    		onSave,
    		$keyValueStore,
    		close,
    		woocommerceClient,
    		createOnWooCommerceAndUpdateInDb,
    		popupFormularConfiguration,
    		delete_handler,
    		save_handler
    	];
    }

    class ItemPopupFormular extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$9, create_fragment$8, safe_not_equal, { createNew: 0, onSave: 1 });
    	}
    }

    var itemFilters = {
      filters: {
        "nicht gelöscht": {
          required_fields: ["status"],
          selectors: {
            status: {
              $ne: "deleted",
            },
          },
        },
        gelöscht: {
          required_fields: ["status"],
          selectors: {
            status: {
              $eq: "deleted",
            },
          },
        },
        verfügbar: {
          required_fields: ["status"],
          selectors: {
            status: {
              $eq: "instock",
            },
          },
        },
        ausgeliehen: {
          required_fields: ["status"],
          selectors: {
            status: {
              $eq: "outofstock",
            },
          },
        },
        reserviert: {
          required_fields: ["status"],
          selectors: {
            status: {
              $eq: "reserved",
            },
          },
        },
        "nicht verleihbar": {
          required_fields: ["status"],
          selectors: {
            status: {
              $eq: "onbackorder",
            },
          },
        },
        "Kategorie Küche": {
          required_fields: ["category"],
          selectors: {
            category: {
              $eq: "Küche",
            },
          },
        },
        "Kategorie Haushalt": {
          required_fields: ["category"],
          selectors: {
            category: {
              $eq: "Haushalt",
            },
          },
        },
        "Kategorie Garten": {
          required_fields: ["category"],
          selectors: {
            category: {
              $eq: "Garten",
            },
          },
        },
        "Kategorie Heimwerker": {
          required_fields: ["category"],
          selectors: {
            category: {
              $eq: "Heimwerker",
            },
          },
        },
        "Kategorie Kinder": {
          required_fields: ["category"],
          selectors: {
            category: {
              $eq: "Kinder",
            },
          },
        },
        "Kategorie Freizeit": {
          required_fields: ["category"],
          selectors: {
            category: {
              $eq: "Freizeit",
            },
          },
        },
      },
      activeByDefault: ["nicht gelöscht"],
    };

    /* src/components/TableEditors/Rentals/RentalPopupFormular.svelte generated by Svelte v3.38.2 */

    function create_fragment$7(ctx) {
    	let popupformular;
    	let current;

    	popupformular = new PopupFormular({
    			props: {
    				popupFormularConfiguration: /*popupFormularConfiguration*/ ctx[5]
    			}
    		});

    	popupformular.$on("save", /*save_handler*/ ctx[6]);
    	popupformular.$on("delete", /*delete_handler*/ ctx[7]);
    	popupformular.$on("cancel", /*close*/ ctx[3]);

    	return {
    		c() {
    			create_component(popupformular.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(popupformular, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(popupformular.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(popupformular.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(popupformular, detaching);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $keyValueStore;
    	component_subscribe($$self, keyValueStore, $$value => $$invalidate(2, $keyValueStore = $$value));
    	const { close } = getContext("simple-modal");
    	const woocommerceClient = new WoocommerceClientMock();
    	let { createNew } = $$props;
    	let { onSave } = $$props;

    	if (createNew) {
    		keyValueStore.setValue("currentDoc", {
    			rented_on: millisAtStartOfToday(),
    			to_return_on: millisAtStartOfDay$1(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    			returned_on: 0,
    			extended_on: 0,
    			type: "rental",
    			image: "",
    			item_id: "",
    			item_name: "",
    			customer_id: "",
    			customer_name: "",
    			passing_out_employee: "",
    			receiving_employee: "",
    			deposit: "",
    			deposit_returned: "",
    			remark: ""
    		});
    	}

    	onMount(() => {
    		if ($keyValueStore["currentDoc"].item_id) {
    			Database.fetchItemById($keyValueStore["currentDoc"].item_id).then(hideToggleStatusOnWebsiteIfExistsMoreThanOnce);
    		}
    	});

    	keyValueStore.setValue("options", {
    		updateStatusOnWebsite: true,
    		disableToggleStatusOnWebsite: false
    	});

    	const hideToggleStatusOnWebsiteIfExistsMoreThanOnce = selectedItem => {
    		if (selectedItem.exists_more_than_once) {
    			keyValueStore.setValue("options", {
    				...$keyValueStore["options"],
    				disableToggleStatusOnWebsite: true
    			});
    		} else {
    			keyValueStore.setValue("options", {
    				...$keyValueStore["options"],
    				disableToggleStatusOnWebsite: false
    			});
    		}
    	};

    	const setItem = selectedItem => {
    		hideToggleStatusOnWebsiteIfExistsMoreThanOnce(selectedItem);

    		keyValueStore.setValue("currentDoc", {
    			...$keyValueStore["currentDoc"],
    			item_id: selectedItem.id,
    			item_name: selectedItem.name,
    			deposit: selectedItem.deposit
    		});
    	};

    	const setCustomer = async customer => {
    		keyValueStore.setValue("currentDoc", {
    			...$keyValueStore["currentDoc"],
    			customer_name: customer.lastname,
    			customer_id: customer.id
    		});

    		const activeRentals = await Database.fetchAllDocsBySelector(activeRentalsForCustomerSelector(customer.id), ["item_name"]).then(results => results.map(doc => doc["item_name"]));

    		if (activeRentals.length > 0 && activeRentals.length < 3) {
    			warning(`Kunde hat schon diese Gegenstände ausgeliehen: ${activeRentals.join(", ")}`, 6000);
    		} else if (activeRentals.length >= 3) {
    			danger(`Kunde hat schon mehr als 2 Gegenstände ausgeliehen: ${activeRentals.join(", ")}`, 6000);
    		}
    	};

    	const popupFormularConfiguration = new PopupFormularConfiguration().setTitle(`Leihvorgang ${createNew ? "anlegen" : "bearbeiten"}`).setDisplayDeleteButton(!createNew).setInputGroups(["Gegenstand", "Zeitraum", "Kunde", "Pfand", "Mitarbeiter"]).setInputs([
    		{
    			id: "item_id",
    			label: "Nr",
    			group: "Gegenstand",
    			type: InputTypes.AUTOCOMPLETE,
    			inputType: "number",
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "item_id"
    			},
    			onChange: setItem,
    			searchFunction: searchTerm => Database.fetchDocsBySelector(itemIdStartsWithAndNotDeletedSelector(searchTerm), ["id", "name", "deposit", "exists_more_than_once"]),
    			suggestionFormat: (id, item_name) => `${String(id).padStart(4, "0")}: ${item_name}`,
    			noResultsText: "Kein Gegenstand mit dieser Id"
    		},
    		{
    			id: "item_name",
    			label: "Name",
    			group: "Gegenstand",
    			type: InputTypes.AUTOCOMPLETE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "item_name"
    			},
    			onChange: setItem,
    			searchFunction: searchTerm => Database.fetchDocsBySelector(itemAttributeStartsWithIgnoreCaseAndNotDeletedSelector("name", searchTerm), ["id", "name", "deposit", "exists_more_than_once"]),
    			suggestionFormat: (id, item_name) => `${String(id).padStart(4, "0")}: ${item_name}`,
    			noResultsText: "Kein Gegenstand mit diesem Name"
    		},
    		{
    			id: "update_status",
    			label: "Status auf Webseite aktualisieren",
    			group: "Gegenstand",
    			bindTo: {
    				keyValueStoreKey: "options",
    				attr: "updateStatusOnWebsite"
    			},
    			hidden: () => $keyValueStore["options"]["disableToggleStatusOnWebsite"],
    			type: InputTypes.CHECKBOX
    		},
    		{
    			id: "rented_on",
    			label: "Erfasst am",
    			group: "Zeitraum",
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "rented_on"
    			}
    		},
    		{
    			id: "extended_on",
    			label: "Verlängert",
    			group: "Zeitraum",
    			hidden: () => createNew,
    			quickset: { 0: "Heute" },
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "extended_on"
    			}
    		},
    		{
    			id: "to_return_on",
    			label: "Zurückerwartet",
    			group: "Zeitraum",
    			quickset: {
    				7: "1 Woche",
    				14: "2 Wochen",
    				21: "3 Wochen"
    			},
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "to_return_on"
    			}
    		},
    		{
    			id: "returned_on",
    			label: "Zurückgegeben",
    			group: "Zeitraum",
    			hidden: () => createNew,
    			quickset: { 0: "Heute" },
    			type: InputTypes.DATE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "returned_on"
    			}
    		},
    		{
    			id: "customer_id",
    			label: "Nr",
    			group: "Kunde",
    			inputType: "number",
    			type: InputTypes.AUTOCOMPLETE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "customer_id"
    			},
    			onChange: setCustomer,
    			searchFunction: searchTerm => Database.fetchDocsBySelector(customerIdStartsWithSelector(searchTerm), ["id", "firstname", "lastname"]),
    			suggestionFormat: (id, firstname, lastname) => `${id}: ${firstname} ${lastname}`,
    			noResultsText: "Kein Kunde mit dieser Id"
    		},
    		{
    			id: "customer_name",
    			label: "Nachname",
    			group: "Kunde",
    			type: InputTypes.AUTOCOMPLETE,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "customer_name"
    			},
    			onChange: setCustomer,
    			searchFunction: searchTerm => Database.fetchDocsBySelector(customerAttributeStartsWithIgnoreCaseSelector("lastname", searchTerm), ["id", "firstname", "lastname"]),
    			suggestionFormat: (id, firstname, lastname) => `${id}: ${firstname} ${lastname}`,
    			noResultsText: "Kein Kunde mit diesem Name"
    		},
    		{
    			id: "deposit",
    			label: "Pfand",
    			group: "Pfand",
    			inputType: "number",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "deposit"
    			}
    		},
    		{
    			id: "deposit_returned",
    			label: "Pfand zurück",
    			group: "Pfand",
    			hidden: () => createNew,
    			inputType: "number",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "deposit_returned"
    			}
    		},
    		{
    			id: "passing_out_employee",
    			label: "Ausgabe",
    			group: "Mitarbeiter",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "passing_out_employee"
    			}
    		},
    		{
    			id: "receiving_employee",
    			label: "Rücknahme",
    			group: "Mitarbeiter",
    			hidden: () => createNew,
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "receiving_employee"
    			}
    		},
    		{
    			id: "remark",
    			label: "Bemerkung",
    			group: "Mitarbeiter",
    			type: InputTypes.TEXT,
    			bindTo: {
    				keyValueStoreKey: "currentDoc",
    				attr: "remark"
    			}
    		}
    	]);

    	const save_handler = async event => {
    		close();
    		const doc = $keyValueStore["currentDoc"];

    		Object.keys(doc).forEach(key => {
    			const colForKey = rentalColumns.find(col => col.key === key);

    			if (colForKey && colForKey.numeric && doc[key] === "") {
    				doc[key] = 0; // default value for numbers
    			}
    		});

    		if (doc.item_id) {
    			let itemIsUpdatable = true;

    			const item = await Database.fetchItemById(doc.item_id).catch(error => {
    				warning(`Gegenstand '${doc.item_id}' konnte nicht geladen werden!`, 6000);
    				Logger.error(error.message);
    				itemIsUpdatable = false;
    			});

    			doc.image = item.image;

    			if (itemIsUpdatable && !item.exists_more_than_once) {
    				if ($keyValueStore["options"]["updateStatusOnWebsite"]) {
    					if (doc.returned_on && doc.returned_on !== 0 && doc.returned_on <= new Date().getTime()) {
    						item.status = "instock";

    						await Database.updateDoc(item).then(() => woocommerceClient.updateItem(item)).then(() => {
    							success(`'${item.name}' wurde auf als verfügbar markiert.`);
    						}).catch(error => {
    							warning(`Status von '${item.name}' konnte nicht aktualisiert werden!`, 6000);
    							Logger.error(error.message);
    						});
    					} else if (createNew) {
    						item.status = "outofstock";

    						await Database.updateDoc(item).then(() => woocommerceClient.updateItem(item)).then(() => {
    							success(`'${item.name}' wurde als verliehen markiert.`);
    						}).catch(error => {
    							warning(`Status von '${item.name}' konnte nicht aktualisiert werden!`, 6000);
    							Logger.error(error.message);
    						});
    					}
    				}
    			}
    		}

    		await (createNew
    		? Database.createDoc(doc)
    		: Database.updateDoc(doc)).then(result => success("Leihvorgang gespeichert!")).then(onSave).catch(error => {
    			danger("Leihvorgang konnte nicht gespeichert werden!", 6000);
    			Logger.error(error.message);
    		});
    	};

    	const delete_handler = event => {
    		if (confirm("Soll dieser Leihvorgang wirklich gelöscht werden?")) {
    			Database.removeDoc($keyValueStore["currentDoc"]).then(() => success("Leihvorgang gelöscht!")).then(close).then(onSave).catch(error => {
    				Logger.error(error.message);
    				danger("Leihvorgang konnte nicht gelöscht werden!", 6000);
    			});
    		}
    	};

    	$$self.$$set = $$props => {
    		if ("createNew" in $$props) $$invalidate(0, createNew = $$props.createNew);
    		if ("onSave" in $$props) $$invalidate(1, onSave = $$props.onSave);
    	};

    	return [
    		createNew,
    		onSave,
    		$keyValueStore,
    		close,
    		woocommerceClient,
    		popupFormularConfiguration,
    		save_handler,
    		delete_handler
    	];
    }

    class RentalPopupFormular extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$8, create_fragment$7, safe_not_equal, { createNew: 0, onSave: 1 });
    	}
    }

    const MILLIS_PER_DAY = 86400 * 1000;
    const CURRENT_TIME_MILLIS = new Date().getTime();
    const START_OF_TODAY = millisAtStartOfDay(CURRENT_TIME_MILLIS);

    function millisAtStartOfDay(millis) {
      return millis - (millis % MILLIS_PER_DAY);
    }

    var rentalFilters = {
      filters: {
        aktuell: {
          required_fields: ["returned_on"],
          selectors: {
            $or: [
              {
                returned_on: {
                  $eq: 0,
                },
              },
              {
                returned_on: {
                  $exists: false,
                },
              },
              {
                $and: [
                  {
                    returned_on: {
                      $gte: START_OF_TODAY,
                    },
                  },
                  {
                    returned_on: {
                      $lt: START_OF_TODAY + MILLIS_PER_DAY,
                    },
                  },
                ],
              },
            ],
          },
        },
        abgeschlossen: {
          required_fields: ["returned_on"],
          selectors: {
            returned_on: {
              $gt: 0,
            },
          },
        },
        "Rückgabe heute": {
          required_fields: ["to_return_on"],
          selectors: {
            $and: [
              {
                to_return_on: {
                  $gte: START_OF_TODAY,
                },
              },
              {
                to_return_on: {
                  $lt: START_OF_TODAY + MILLIS_PER_DAY,
                },
              },
            ],
          },
        },
        verspätet: {
          required_fields: ["returned_on", "to_return_on"],
          selectors: {
            $and: [
              {
                to_return_on: {
                  $gt: 0,
                },
              },
              {
                returned_on: {
                  $eq: 0,
                },
              },
              {
                to_return_on: {
                  $lt: START_OF_TODAY,
                },
              },
            ],
          },
        },
      },
      activeByDefault: ["aktuell"],
    };

    const hasReturnDate = (rental) => rental.returned_on && rental.returned_on > 0;

    const hasBeenReturnedToday = (rental) =>
      hasReturnDate(rental) && rental.returned_on === millisAtStartOfToday();
    const shouldBeReturnedToday = (rental) =>
      rental.to_return_on && rental.to_return_on === millisAtStartOfToday() && !hasReturnDate(rental);
    const shouldHaveBeenReturnedBeforeToday = (rental) =>
      rental.to_return_on &&
      ((!hasReturnDate(rental) && rental.to_return_on < millisAtStartOfToday()) ||
        (hasReturnDate(rental) && rental.to_return_on < rental.returned_on));

    var CONFIG = {
      customers: {
        docType: "customer",
        columns: customerColumns,
        filters: customerFilters,
        popupFormularComponent: CustomerPopupFormular,
        cellBackgroundColorsFunction: async (customer, isEven) => {
          if (customer.highlight) {
            return new Array(customerColumns.length).fill(customer.highlight);
          } else {
            return isEven
              ? new Array(customerColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_EVEN)
              : new Array(customerColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_ODD);
          }
        },
      },
      items: {
        docType: "item",
        columns: itemColumns,
        filters: itemFilters,
        popupFormularComponent: ItemPopupFormular,
        cellBackgroundColorsFunction: async (item, isEven) => {
          if (item.highlight) {
            return new Array(itemColumns.length).fill(item.highlight);
          } else {
            return isEven
              ? new Array(itemColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_EVEN)
              : new Array(itemColumns.length).fill(COLORS.DEFAULT_ROW_BACKGROUND_ODD);
          }
        },
      },
      rentals: {
        docType: "rental",
        columns: rentalColumns,
        filters: rentalFilters,
        popupFormularComponent: RentalPopupFormular,
        cellBackgroundColorsFunction: async (rental, isEven) => {
          let item = {};
          let customer = {};
          try {
            item = await Database.fetchItemById(rental.item_id);
          } catch (e) {
            Logger.warn(e);
          }
          try {
            customer = await Database.fetchCustomerById(rental.customer_id);
          } catch (e) {
            Logger.warn(e);
          }
          return rentalColumns.map((col) => {
            if (item.highlight && ["item_id", "item_name"].includes(col.key)) {
              return item.highlight;
            } else if (customer.highlight && ["customer_id", "customer_name"].includes(col.key)) {
              return customer.highlight;
            } else if (hasBeenReturnedToday(rental)) {
              return COLORS.RENTAL_RETURNED_TODAY_GREEN;
            } else if (shouldBeReturnedToday(rental)) {
              return COLORS.RENTAL_TO_RETURN_TODAY_BLUE;
            } else if (shouldHaveBeenReturnedBeforeToday(rental)) {
              return COLORS.RENTAL_LATE_RED;
            } else {
              return isEven ? COLORS.DEFAULT_ROW_BACKGROUND_EVEN : COLORS.DEFAULT_ROW_BACKGROUND_ODD;
            }
          });
        },
      },
    };

    /* src/components/TableEditors/TableEditor.svelte generated by Svelte v3.38.2 */

    const { window: window_1$1 } = globals;

    function create_catch_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*error*/ ctx[33].status === 401) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (157:2) {:else}
    function create_else_block$1(ctx) {
    	let p;
    	let t0;
    	let br;

    	let t1_value = (/*error*/ ctx[33].hasOwnProperty("message")
    	? /*error*/ ctx[33].message
    	: "") + "";

    	let t1;

    	return {
    		c() {
    			p = element("p");
    			t0 = text("Keine Verbindung mit der Datenbank. ");
    			br = element("br");
    			t1 = text(t1_value);
    			attr(p, "class", "error svelte-5t1wte");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t0);
    			append(p, br);
    			append(p, t1);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*loadData*/ 512 && t1_value !== (t1_value = (/*error*/ ctx[33].hasOwnProperty("message")
    			? /*error*/ ctx[33].message
    			: "") + "")) set_data(t1, t1_value);
    		},
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (152:2) {#if error.status === 401}
    function create_if_block$1(ctx) {
    	let p;

    	return {
    		c() {
    			p = element("p");
    			p.textContent = "Nutzer oder Passwort für die Datenbank ist nicht korrekt. Bitte in den Einstellungen (Über\n      Menü rechts oben) überprüfen.";
    			attr(p, "class", "error svelte-5t1wte");
    		},
    		m(target, anchor) {
    			insert(target, p, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(p);
    		}
    	};
    }

    // (130:0) {:then data}
    function create_then_block(ctx) {
    	let div;
    	let table;
    	let div_intro;
    	let current;

    	table = new Table({
    			props: {
    				rowHeight,
    				columns: /*columns*/ ctx[7],
    				data: /*data*/ ctx[32].docs,
    				cellBackgroundColorsFunction: CONFIG[/*tab*/ ctx[0]].cellBackgroundColorsFunction,
    				indicateSort: /*indicateSort*/ ctx[13]
    			}
    		});

    	table.$on("rowClicked", /*rowClicked_handler*/ ctx[19]);
    	table.$on("colHeaderClicked", /*colHeaderClicked_handler*/ ctx[20]);

    	return {
    		c() {
    			div = element("div");
    			create_component(table.$$.fragment);
    			attr(div, "class", "animatecontainer svelte-5t1wte");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(table, div, null);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const table_changes = {};
    			if (dirty[0] & /*columns*/ 128) table_changes.columns = /*columns*/ ctx[7];
    			if (dirty[0] & /*loadData*/ 512) table_changes.data = /*data*/ ctx[32].docs;
    			if (dirty[0] & /*tab*/ 1) table_changes.cellBackgroundColorsFunction = CONFIG[/*tab*/ ctx[0]].cellBackgroundColorsFunction;
    			if (dirty[0] & /*indicateSort*/ 8192) table_changes.indicateSort = /*indicateSort*/ ctx[13];
    			table.$set(table_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);

    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, fade, {});
    					div_intro.start();
    				});
    			}

    			current = true;
    		},
    		o(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_component(table);
    		}
    	};
    }

    // (128:19)    <LoadingAnimation /> {:then data}
    function create_pending_block(ctx) {
    	let loadinganimation;
    	let current;
    	loadinganimation = new LoadingAnimation({});

    	return {
    		c() {
    			create_component(loadinganimation.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(loadinganimation, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(loadinganimation.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(loadinganimation.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(loadinganimation, detaching);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	let searchfilterbar;
    	let updating_searchTerm;
    	let t0;
    	let promise;
    	let t1;
    	let pagination;
    	let updating_currentPage;
    	let t2;
    	let addnewitembutton;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[15]);

    	function searchfilterbar_searchTerm_binding(value) {
    		/*searchfilterbar_searchTerm_binding*/ ctx[16](value);
    	}

    	let searchfilterbar_props = {
    		filterOptions: Object.keys(/*filters*/ ctx[12].filters).map(func),
    		activeFilters: /*activeFilters*/ ctx[4]
    	};

    	if (/*searchTerm*/ ctx[1] !== void 0) {
    		searchfilterbar_props.searchTerm = /*searchTerm*/ ctx[1];
    	}

    	searchfilterbar = new SearchFilterBar({ props: searchfilterbar_props });
    	binding_callbacks.push(() => bind$1(searchfilterbar, "searchTerm", searchfilterbar_searchTerm_binding));
    	/*searchfilterbar_binding*/ ctx[17](searchfilterbar);
    	searchfilterbar.$on("filtersChanged", /*filtersChanged_handler*/ ctx[18]);

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 32,
    		error: 33,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*loadData*/ ctx[9](), info);

    	function pagination_currentPage_binding(value) {
    		/*pagination_currentPage_binding*/ ctx[21](value);
    	}

    	let pagination_props = {
    		numberOfPagesPromise: /*numberOfPagesPromise*/ ctx[10]
    	};

    	if (/*currentPage*/ ctx[2] !== void 0) {
    		pagination_props.currentPage = /*currentPage*/ ctx[2];
    	}

    	pagination = new Pagination({ props: pagination_props });
    	binding_callbacks.push(() => bind$1(pagination, "currentPage", pagination_currentPage_binding));
    	addnewitembutton = new AddNewItemButton({});
    	addnewitembutton.$on("click", /*click_handler*/ ctx[22]);

    	return {
    		c() {
    			create_component(searchfilterbar.$$.fragment);
    			t0 = space();
    			info.block.c();
    			t1 = space();
    			create_component(pagination.$$.fragment);
    			t2 = space();
    			create_component(addnewitembutton.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(searchfilterbar, target, anchor);
    			insert(target, t0, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t1.parentNode;
    			info.anchor = t1;
    			insert(target, t1, anchor);
    			mount_component(pagination, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(addnewitembutton, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen(window_1$1, "resize", /*onwindowresize*/ ctx[15]);
    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			const searchfilterbar_changes = {};
    			if (dirty[0] & /*filters*/ 4096) searchfilterbar_changes.filterOptions = Object.keys(/*filters*/ ctx[12].filters).map(func);
    			if (dirty[0] & /*activeFilters*/ 16) searchfilterbar_changes.activeFilters = /*activeFilters*/ ctx[4];

    			if (!updating_searchTerm && dirty[0] & /*searchTerm*/ 2) {
    				updating_searchTerm = true;
    				searchfilterbar_changes.searchTerm = /*searchTerm*/ ctx[1];
    				add_flush_callback(() => updating_searchTerm = false);
    			}

    			searchfilterbar.$set(searchfilterbar_changes);
    			info.ctx = ctx;

    			if (dirty[0] & /*loadData*/ 512 && promise !== (promise = /*loadData*/ ctx[9]()) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}

    			const pagination_changes = {};
    			if (dirty[0] & /*numberOfPagesPromise*/ 1024) pagination_changes.numberOfPagesPromise = /*numberOfPagesPromise*/ ctx[10];

    			if (!updating_currentPage && dirty[0] & /*currentPage*/ 4) {
    				updating_currentPage = true;
    				pagination_changes.currentPage = /*currentPage*/ ctx[2];
    				add_flush_callback(() => updating_currentPage = false);
    			}

    			pagination.$set(pagination_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(searchfilterbar.$$.fragment, local);
    			transition_in(info.block);
    			transition_in(pagination.$$.fragment, local);
    			transition_in(addnewitembutton.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(searchfilterbar.$$.fragment, local);

    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			transition_out(pagination.$$.fragment, local);
    			transition_out(addnewitembutton.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			/*searchfilterbar_binding*/ ctx[17](null);
    			destroy_component(searchfilterbar, detaching);
    			if (detaching) detach(t0);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach(t1);
    			destroy_component(pagination, detaching);
    			if (detaching) detach(t2);
    			destroy_component(addnewitembutton, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    let rowHeight = 40;
    const func = filter => ({ value: filter, label: filter });

    function instance$7($$self, $$props, $$invalidate) {
    	let rowsPerPage;
    	let { tab } = $$props;
    	const openStyledModal = getContext("openStyledModal");

    	const openPopupFormular = createNew => {
    		openStyledModal(CONFIG[tab].popupFormularComponent, { createNew, onSave: refresh });
    	};

    	const shouldBeSortedByInitially = col => "initialSort" in col;

    	const refresh = () => $$invalidate(9, loadData = () => {
    		return Database.query({
    			filters: activeFilters.map(filterName => filters.filters[filterName]),
    			columns,
    			searchTerm,
    			currentPage,
    			rowsPerPage,
    			sortBy: sort,
    			sortReverse,
    			docType
    		}).then(data => {
    			searchInputRef?.focusSearchInput();

    			$$invalidate(10, numberOfPagesPromise = data.count.then(count => {
    				const rowsOnLastPage = count % rowsPerPage;
    				let numberOfPages = (count - rowsOnLastPage) / rowsPerPage;
    				if (rowsOnLastPage > 0) numberOfPages += 1;
    				return numberOfPages;
    			}));

    			return data;
    		}).catch(error => {
    			Logger.error(error.message);

    			// catch again in html
    			throw error;
    		});
    	});

    	const initNewTab = tab => {
    		if (tab) {
    			if (searchTerm !== "") $$invalidate(1, searchTerm = "");
    			$$invalidate(7, columns = CONFIG[tab].columns);
    			$$invalidate(12, filters = CONFIG[tab].filters);
    			docType = CONFIG[tab].docType;
    			$$invalidate(4, activeFilters = filters.activeByDefault);
    			$$invalidate(1, searchTerm = "");
    			setInitialSortCol();
    			setInitialSortDirection();
    		}
    	};

    	const setInitialSortCol = () => {
    		$$invalidate(5, sortByColKey = columns.some(shouldBeSortedByInitially)
    		? columns.find(shouldBeSortedByInitially).key
    		: "id");

    		const col = columns.find(col => col.key === sortByColKey);
    		$$invalidate(11, sort = col.sort ? col.sort : [sortByColKey]);
    	};

    	const setInitialSortDirection = () => $$invalidate(6, sortReverse = columns.some(shouldBeSortedByInitially)
    	? columns.find(shouldBeSortedByInitially).initialSort === "desc"
    	: false);

    	const goToFirstPage = () => {
    		if (currentPage !== 0) {
    			$$invalidate(2, currentPage = 0);
    		}
    	};

    	let searchInputRef;

    	let loadData = () => new Promise(() => {
    			
    		});

    	let numberOfPagesPromise = new Promise(() => {
    			
    		});

    	let searchTerm;
    	let currentPage = 0;
    	let innerHeight = window.innerHeight;
    	let activeFilters = [];
    	let sortByColKey;
    	let sortReverse;
    	let sort;
    	let columns;
    	let filters;
    	let docType;
    	let indicateSort;

    	function onwindowresize() {
    		$$invalidate(3, innerHeight = window_1$1.innerHeight);
    	}

    	function searchfilterbar_searchTerm_binding(value) {
    		searchTerm = value;
    		$$invalidate(1, searchTerm);
    	}

    	function searchfilterbar_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			searchInputRef = $$value;
    			$$invalidate(8, searchInputRef);
    		});
    	}

    	const filtersChanged_handler = event => {
    		if (JSON.stringify(event.detail) !== JSON.stringify(activeFilters)) {
    			$$invalidate(4, activeFilters = event.detail);
    		}
    	};

    	const rowClicked_handler = event => {
    		keyValueStore.setValue("currentDoc", event.detail);
    		openPopupFormular(false);
    	};

    	const colHeaderClicked_handler = event => {
    		if (sortByColKey == event.detail.key) $$invalidate(6, sortReverse = !sortReverse); else $$invalidate(6, sortReverse = false);
    		$$invalidate(5, sortByColKey = event.detail.key);
    		const col = columns.find(col => col.key === sortByColKey);
    		$$invalidate(11, sort = col.sort ? col.sort : [sortByColKey]);
    	};

    	function pagination_currentPage_binding(value) {
    		currentPage = value;
    		$$invalidate(2, currentPage);
    	}

    	const click_handler = () => {
    		keyValueStore.removeValue("currentDoc");
    		openPopupFormular(true);
    	};

    	$$self.$$set = $$props => {
    		if ("tab" in $$props) $$invalidate(0, tab = $$props.tab);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*tab*/ 1) {
    			initNewTab(tab);
    		}

    		if ($$self.$$.dirty[0] & /*innerHeight*/ 8) {
    			rowsPerPage = Math.round((innerHeight - 250) / rowHeight);
    		}

    		if ($$self.$$.dirty[0] & /*tab, currentPage, sortByColKey, sortReverse, searchTerm, activeFilters*/ 119) {
    			(refresh());
    		}

    		if ($$self.$$.dirty[0] & /*sortByColKey, sortReverse, searchTerm, activeFilters*/ 114) {
    			(goToFirstPage());
    		}

    		if ($$self.$$.dirty[0] & /*columns, sortByColKey, sortReverse*/ 224) {
    			$$invalidate(13, indicateSort = columns.map(col => {
    				if (col.key === sortByColKey) {
    					return sortReverse ? "up" : "down";
    				} else {
    					return "";
    				}
    			}));
    		}
    	};

    	return [
    		tab,
    		searchTerm,
    		currentPage,
    		innerHeight,
    		activeFilters,
    		sortByColKey,
    		sortReverse,
    		columns,
    		searchInputRef,
    		loadData,
    		numberOfPagesPromise,
    		sort,
    		filters,
    		indicateSort,
    		openPopupFormular,
    		onwindowresize,
    		searchfilterbar_searchTerm_binding,
    		searchfilterbar_binding,
    		filtersChanged_handler,
    		rowClicked_handler,
    		colHeaderClicked_handler,
    		pagination_currentPage_binding,
    		click_handler
    	];
    }

    class TableEditor extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$7, create_fragment$6, safe_not_equal, { tab: 0 }, [-1, -1]);
    	}
    }

    /* node_modules/svelte-simple-modal/src/Modal.svelte generated by Svelte v3.38.2 */

    const { window: window_1 } = globals;

    function create_if_block(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let t;
    	let div0;
    	let switch_instance;
    	let div1_transition;
    	let div3_transition;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*state*/ ctx[0].closeButton && create_if_block_1(ctx);
    	var switch_value = /*Component*/ ctx[1];

    	function switch_props(ctx) {
    		return {};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props());
    	}

    	return {
    		c() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			div0 = element("div");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr(div0, "class", "content svelte-2wx9ab");
    			attr(div0, "style", /*cssContent*/ ctx[8]);
    			attr(div1, "class", "window svelte-2wx9ab");
    			attr(div1, "role", "dialog");
    			attr(div1, "aria-modal", "true");
    			attr(div1, "style", /*cssWindow*/ ctx[7]);
    			attr(div2, "class", "window-wrap svelte-2wx9ab");
    			attr(div2, "style", /*cssWindowWrap*/ ctx[6]);
    			attr(div3, "class", "bg svelte-2wx9ab");
    			attr(div3, "style", /*cssBg*/ ctx[5]);
    		},
    		m(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append(div1, t);
    			append(div1, div0);

    			if (switch_instance) {
    				mount_component(switch_instance, div0, null);
    			}

    			/*div1_binding*/ ctx[37](div1);
    			/*div2_binding*/ ctx[38](div2);
    			/*div3_binding*/ ctx[39](div3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div1, "introstart", function () {
    						if (is_function(/*onOpen*/ ctx[12])) /*onOpen*/ ctx[12].apply(this, arguments);
    					}),
    					listen(div1, "outrostart", function () {
    						if (is_function(/*onClose*/ ctx[13])) /*onClose*/ ctx[13].apply(this, arguments);
    					}),
    					listen(div1, "introend", function () {
    						if (is_function(/*onOpened*/ ctx[14])) /*onOpened*/ ctx[14].apply(this, arguments);
    					}),
    					listen(div1, "outroend", function () {
    						if (is_function(/*onClosed*/ ctx[15])) /*onClosed*/ ctx[15].apply(this, arguments);
    					}),
    					listen(div3, "click", /*handleOuterClick*/ ctx[19])
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*state*/ ctx[0].closeButton) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*state*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (switch_value !== (switch_value = /*Component*/ ctx[1])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, div0, null);
    				} else {
    					switch_instance = null;
    				}
    			}

    			if (!current || dirty[0] & /*cssContent*/ 256) {
    				attr(div0, "style", /*cssContent*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*cssWindow*/ 128) {
    				attr(div1, "style", /*cssWindow*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*cssWindowWrap*/ 64) {
    				attr(div2, "style", /*cssWindowWrap*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*cssBg*/ 32) {
    				attr(div3, "style", /*cssBg*/ ctx[5]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, /*currentTransitionWindow*/ ctx[11], /*state*/ ctx[0].transitionWindowProps, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*currentTransitionBg*/ ctx[10], /*state*/ ctx[0].transitionBgProps, true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, /*currentTransitionWindow*/ ctx[11], /*state*/ ctx[0].transitionWindowProps, false);
    			div1_transition.run(0);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*currentTransitionBg*/ ctx[10], /*state*/ ctx[0].transitionBgProps, false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div3);
    			if (if_block) if_block.d();
    			if (switch_instance) destroy_component(switch_instance);
    			/*div1_binding*/ ctx[37](null);
    			if (detaching && div1_transition) div1_transition.end();
    			/*div2_binding*/ ctx[38](null);
    			/*div3_binding*/ ctx[39](null);
    			if (detaching && div3_transition) div3_transition.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (335:8) {#if state.closeButton}
    function create_if_block_1(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty[0] & /*state*/ 1) show_if = !!/*isFunction*/ ctx[16](/*state*/ ctx[0].closeButton);
    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx, [-1]);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (338:10) {:else}
    function create_else_block(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			button = element("button");
    			attr(button, "class", "close svelte-2wx9ab");
    			attr(button, "style", /*cssCloseButton*/ ctx[9]);
    		},
    		m(target, anchor) {
    			insert(target, button, anchor);

    			if (!mounted) {
    				dispose = listen(button, "click", /*close*/ ctx[17]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*cssCloseButton*/ 512) {
    				attr(button, "style", /*cssCloseButton*/ ctx[9]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(button);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (336:10) {#if isFunction(state.closeButton)}
    function create_if_block_2(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*state*/ ctx[0].closeButton;

    	function switch_props(ctx) {
    		return { props: { onClose: /*close*/ ctx[17] } };
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	return {
    		c() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (switch_value !== (switch_value = /*state*/ ctx[0].closeButton)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};
    }

    function create_fragment$5(ctx) {
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*Component*/ ctx[1] && create_if_block(ctx);
    	const default_slot_template = /*#slots*/ ctx[36].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[35], null);

    	return {
    		c() {
    			if (if_block) if_block.c();
    			t = space();
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen(window_1, "keydown", /*handleKeydown*/ ctx[18]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (/*Component*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*Component*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t.parentNode, t);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty[1] & /*$$scope*/ 16)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[35], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach(t);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function bind(Component, props = {}) {
    	return function ModalComponent(options) {
    		return new Component({
    				...options,
    				props: { ...props, ...options.props }
    			});
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const dispatch = createEventDispatcher();
    	const baseSetContext = setContext;
    	let { show = null } = $$props;
    	let { key = "simple-modal" } = $$props;
    	let { closeButton = true } = $$props;
    	let { closeOnEsc = true } = $$props;
    	let { closeOnOuterClick = true } = $$props;
    	let { styleBg = {} } = $$props;
    	let { styleWindowWrap = {} } = $$props;
    	let { styleWindow = {} } = $$props;
    	let { styleContent = {} } = $$props;
    	let { styleCloseButton = {} } = $$props;
    	let { setContext: setContext$1 = baseSetContext } = $$props;
    	let { transitionBg = fade } = $$props;
    	let { transitionBgProps = { duration: 250 } } = $$props;
    	let { transitionWindow = transitionBg } = $$props;
    	let { transitionWindowProps = transitionBgProps } = $$props;

    	const defaultState = {
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindowWrap,
    		styleWindow,
    		styleContent,
    		styleCloseButton,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps
    	};

    	let state = { ...defaultState };
    	let Component = null;
    	let background;
    	let wrap;
    	let modalWindow;
    	let scrollY;
    	let cssBg;
    	let cssWindowWrap;
    	let cssWindow;
    	let cssContent;
    	let cssCloseButton;
    	let currentTransitionBg;
    	let currentTransitionWindow;
    	let prevBodyPosition;
    	let prevBodyOverflow;
    	const camelCaseToDash = str => str.replace(/([a-zA-Z])(?=[A-Z])/g, "$1-").toLowerCase();
    	const toCssString = props => Object.keys(props).reduce((str, key) => `${str}; ${camelCaseToDash(key)}: ${props[key]}`, "");
    	const isFunction = f => !!(f && f.constructor && f.call && f.apply);

    	const updateStyleTransition = () => {
    		$$invalidate(5, cssBg = toCssString(state.styleBg));
    		$$invalidate(6, cssWindowWrap = toCssString(state.styleWindowWrap));
    		$$invalidate(7, cssWindow = toCssString(state.styleWindow));
    		$$invalidate(8, cssContent = toCssString(state.styleContent));
    		$$invalidate(9, cssCloseButton = toCssString(state.styleCloseButton));
    		$$invalidate(10, currentTransitionBg = state.transitionBg);
    		$$invalidate(11, currentTransitionWindow = state.transitionWindow);
    	};

    	const toVoid = () => {
    		
    	};

    	let onOpen = toVoid;
    	let onClose = toVoid;
    	let onOpened = toVoid;
    	let onClosed = toVoid;

    	const open = (NewComponent, newProps = {}, options = {}, callback = {}) => {
    		$$invalidate(1, Component = bind(NewComponent, newProps));
    		$$invalidate(0, state = { ...defaultState, ...options });
    		updateStyleTransition();
    		disableScroll();

    		($$invalidate(12, onOpen = event => {
    			if (callback.onOpen) callback.onOpen(event);
    			dispatch("open");
    			dispatch("opening"); // Deprecated. Do not use!
    		}), $$invalidate(13, onClose = event => {
    			if (callback.onClose) callback.onClose(event);
    			dispatch("close");
    			dispatch("closing"); // Deprecated. Do not use!
    		}), $$invalidate(14, onOpened = event => {
    			if (callback.onOpened) callback.onOpened(event);
    			dispatch("opened");
    		}));

    		$$invalidate(15, onClosed = event => {
    			if (callback.onClosed) callback.onClosed(event);
    			dispatch("closed");
    		});
    	};

    	const close = (callback = {}) => {
    		$$invalidate(13, onClose = callback.onClose || onClose);
    		$$invalidate(15, onClosed = callback.onClosed || onClosed);
    		$$invalidate(1, Component = null);
    		enableScroll();
    	};

    	const handleKeydown = event => {
    		if (state.closeOnEsc && Component && event.key === "Escape") {
    			event.preventDefault();
    			close();
    		}

    		if (Component && event.key === "Tab") {
    			// trap focus
    			const nodes = modalWindow.querySelectorAll("*");

    			const tabbable = Array.from(nodes).filter(node => node.tabIndex >= 0);
    			let index = tabbable.indexOf(document.activeElement);
    			if (index === -1 && event.shiftKey) index = 0;
    			index += tabbable.length + (event.shiftKey ? -1 : 1);
    			index %= tabbable.length;
    			tabbable[index].focus();
    			event.preventDefault();
    		}
    	};

    	const handleOuterClick = event => {
    		if (state.closeOnOuterClick && (event.target === background || event.target === wrap)) {
    			event.preventDefault();
    			close();
    		}
    	};

    	const disableScroll = () => {
    		scrollY = window.scrollY;
    		prevBodyPosition = document.body.style.position;
    		prevBodyOverflow = document.body.style.overflow;
    		document.body.style.position = "fixed";
    		document.body.style.top = `-${scrollY}px`;
    		document.body.style.overflow = "hidden";
    	};

    	const enableScroll = () => {
    		document.body.style.position = prevBodyPosition || "";
    		document.body.style.top = "";
    		document.body.style.overflow = prevBodyOverflow || "";
    		window.scrollTo(0, scrollY);
    	};

    	setContext$1(key, { open, close });

    	onDestroy(() => {
    		close();
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			modalWindow = $$value;
    			$$invalidate(4, modalWindow);
    		});
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			wrap = $$value;
    			$$invalidate(3, wrap);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			background = $$value;
    			$$invalidate(2, background);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("show" in $$props) $$invalidate(20, show = $$props.show);
    		if ("key" in $$props) $$invalidate(21, key = $$props.key);
    		if ("closeButton" in $$props) $$invalidate(22, closeButton = $$props.closeButton);
    		if ("closeOnEsc" in $$props) $$invalidate(23, closeOnEsc = $$props.closeOnEsc);
    		if ("closeOnOuterClick" in $$props) $$invalidate(24, closeOnOuterClick = $$props.closeOnOuterClick);
    		if ("styleBg" in $$props) $$invalidate(25, styleBg = $$props.styleBg);
    		if ("styleWindowWrap" in $$props) $$invalidate(26, styleWindowWrap = $$props.styleWindowWrap);
    		if ("styleWindow" in $$props) $$invalidate(27, styleWindow = $$props.styleWindow);
    		if ("styleContent" in $$props) $$invalidate(28, styleContent = $$props.styleContent);
    		if ("styleCloseButton" in $$props) $$invalidate(29, styleCloseButton = $$props.styleCloseButton);
    		if ("setContext" in $$props) $$invalidate(30, setContext$1 = $$props.setContext);
    		if ("transitionBg" in $$props) $$invalidate(31, transitionBg = $$props.transitionBg);
    		if ("transitionBgProps" in $$props) $$invalidate(32, transitionBgProps = $$props.transitionBgProps);
    		if ("transitionWindow" in $$props) $$invalidate(33, transitionWindow = $$props.transitionWindow);
    		if ("transitionWindowProps" in $$props) $$invalidate(34, transitionWindowProps = $$props.transitionWindowProps);
    		if ("$$scope" in $$props) $$invalidate(35, $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*show*/ 1048576) {
    			{
    				if (isFunction(show)) {
    					open(show);
    				} else {
    					close();
    				}
    			}
    		}
    	};

    	return [
    		state,
    		Component,
    		background,
    		wrap,
    		modalWindow,
    		cssBg,
    		cssWindowWrap,
    		cssWindow,
    		cssContent,
    		cssCloseButton,
    		currentTransitionBg,
    		currentTransitionWindow,
    		onOpen,
    		onClose,
    		onOpened,
    		onClosed,
    		isFunction,
    		close,
    		handleKeydown,
    		handleOuterClick,
    		show,
    		key,
    		closeButton,
    		closeOnEsc,
    		closeOnOuterClick,
    		styleBg,
    		styleWindowWrap,
    		styleWindow,
    		styleContent,
    		styleCloseButton,
    		setContext$1,
    		transitionBg,
    		transitionBgProps,
    		transitionWindow,
    		transitionWindowProps,
    		$$scope,
    		slots,
    		div1_binding,
    		div2_binding,
    		div3_binding
    	];
    }

    class Modal extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$6,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				show: 20,
    				key: 21,
    				closeButton: 22,
    				closeOnEsc: 23,
    				closeOnOuterClick: 24,
    				styleBg: 25,
    				styleWindowWrap: 26,
    				styleWindow: 27,
    				styleContent: 28,
    				styleCloseButton: 29,
    				setContext: 30,
    				transitionBg: 31,
    				transitionBgProps: 32,
    				transitionWindow: 33,
    				transitionWindowProps: 34
    			},
    			[-1, -1]
    		);
    	}
    }

    /* src/components/Layout/StyledModal.svelte generated by Svelte v3.38.2 */

    function create_fragment$4(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[0], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	const { open } = getContext("simple-modal");

    	setContext("openStyledModal", (component, props, onClose) => {
    		open(
    			component,
    			props,
    			{
    				closeButton: false,
    				closeOnEsc: true,
    				closeOnOuterClick: false,
    				styleWindow: {
    					width: "60rem",
    					"max-width": "90%",
    					height: "90%",
    					overflow: "hidden"
    				},
    				styleContent: { height: "100%" }
    			},
    			{ onClose }
    		);
    	});

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class StyledModal extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$4, safe_not_equal, {});
    	}
    }

    /* src/components/Layout/Modal.svelte generated by Svelte v3.38.2 */

    function create_default_slot_1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[0].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (6:0) <Modal>
    function create_default_slot$1(ctx) {
    	let styledmodal;
    	let current;

    	styledmodal = new StyledModal({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(styledmodal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(styledmodal, target, anchor);
    			current = true;
    		},
    		p(ctx, dirty) {
    			const styledmodal_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				styledmodal_changes.$$scope = { dirty, ctx };
    			}

    			styledmodal.$set(styledmodal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(styledmodal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(styledmodal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(styledmodal, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let modal;
    	let current;

    	modal = new Modal({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(modal.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(modal, target, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const modal_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(modal, detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;

    	$$self.$$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	return [slots, $$scope];
    }

    class Modal_1 extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$3, safe_not_equal, {});
    	}
    }

    const defaultSettings = {
      couchdbHost: "127.0.0.1",
      couchdbHTTPS: false,
      couchdbPort: "5984",
      couchdbUser: "user",
      couchdbPassword: "password",
      couchdbName: "leihlokal_test",
      wcUrl: "https://www.buergerstiftung-karlsruhe.de/wp-json/wc/v3",
      wcKey: "",
      wcSecret: "",
    };

    const settingsKeys = Object.keys(defaultSettings);

    const readFromLocalStorage = () => {
      let settings = defaultSettings;
      settingsKeys.forEach((key) => {
        if (localStorage.hasOwnProperty(key)) {
          if (localStorage.getItem(key) === "true") {
            settings[key] = true;
          } else if (localStorage.getItem(key) === "false") {
            settings[key] = false;
          } else {
            settings[key] = localStorage.getItem(key);
          }
        }
      });
      return settings;
    };

    const writeToLocalStorage = (settings) => {
      for (const [key, value] of Object.entries(settings)) {
        localStorage.setItem(key, String(value));
      }
    };

    const createStore = () => {
      const data = readFromLocalStorage();
      //if sub is broken, sets value to current local storage value
      const store = writable(data, () => {
        const unsubscribe = store.subscribe((value) => {
          writeToLocalStorage(value);
        });
        return unsubscribe;
      });
      return store;
    };

    const settingsStore = createStore();

    /* src/components/Input/SettingsFormular.svelte generated by Svelte v3.38.2 */

    function create_fragment$2(ctx) {
    	let div32;
    	let div31;
    	let div1;
    	let t1;
    	let div4;
    	let div2;
    	let t3;
    	let div3;
    	let input0;
    	let t4;
    	let div7;
    	let div5;
    	let t6;
    	let div6;
    	let checkbox;
    	let updating_checked;
    	let t7;
    	let div10;
    	let div8;
    	let t9;
    	let div9;
    	let input1;
    	let t10;
    	let div13;
    	let div11;
    	let t12;
    	let div12;
    	let input2;
    	let t13;
    	let div16;
    	let div14;
    	let t15;
    	let div15;
    	let input3;
    	let t16;
    	let div19;
    	let div17;
    	let t18;
    	let div18;
    	let input4;
    	let t19;
    	let div21;
    	let t21;
    	let div24;
    	let div22;
    	let t23;
    	let div23;
    	let input5;
    	let t24;
    	let div27;
    	let div25;
    	let t26;
    	let div26;
    	let input6;
    	let t27;
    	let div30;
    	let div28;
    	let t29;
    	let div29;
    	let input7;
    	let current;
    	let mounted;
    	let dispose;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[2](value);
    	}

    	let checkbox_props = { size: "2rem" };

    	if (/*$settingsStore*/ ctx[0].couchdbHTTPS !== void 0) {
    		checkbox_props.checked = /*$settingsStore*/ ctx[0].couchdbHTTPS;
    	}

    	checkbox = new Checkbox({ props: checkbox_props });
    	binding_callbacks.push(() => bind$1(checkbox, "checked", checkbox_checked_binding));

    	return {
    		c() {
    			div32 = element("div");
    			div31 = element("div");
    			div1 = element("div");
    			div1.innerHTML = `<div class="col-25 svelte-wezv84"><h2 class="svelte-wezv84">Datenbank</h2></div>`;
    			t1 = space();
    			div4 = element("div");
    			div2 = element("div");
    			div2.innerHTML = `<label for="couchdbhost" class="svelte-wezv84">Host</label>`;
    			t3 = space();
    			div3 = element("div");
    			input0 = element("input");
    			t4 = space();
    			div7 = element("div");
    			div5 = element("div");
    			div5.innerHTML = `<label for="couchdbhost" class="svelte-wezv84">HTTPS</label>`;
    			t6 = space();
    			div6 = element("div");
    			create_component(checkbox.$$.fragment);
    			t7 = space();
    			div10 = element("div");
    			div8 = element("div");
    			div8.innerHTML = `<label for="couchdbport" class="svelte-wezv84">Port</label>`;
    			t9 = space();
    			div9 = element("div");
    			input1 = element("input");
    			t10 = space();
    			div13 = element("div");
    			div11 = element("div");
    			div11.innerHTML = `<label for="couchdbuser" class="svelte-wezv84">Nutzer</label>`;
    			t12 = space();
    			div12 = element("div");
    			input2 = element("input");
    			t13 = space();
    			div16 = element("div");
    			div14 = element("div");
    			div14.innerHTML = `<label for="couchdbpassword" class="svelte-wezv84">Passwort</label>`;
    			t15 = space();
    			div15 = element("div");
    			input3 = element("input");
    			t16 = space();
    			div19 = element("div");
    			div17 = element("div");
    			div17.innerHTML = `<label for="couchdbhost" class="svelte-wezv84">Datenbank</label>`;
    			t18 = space();
    			div18 = element("div");
    			input4 = element("input");
    			t19 = space();
    			div21 = element("div");
    			div21.innerHTML = `<div class="col-25 svelte-wezv84"><h2 class="svelte-wezv84">WooCommerce</h2></div>`;
    			t21 = space();
    			div24 = element("div");
    			div22 = element("div");
    			div22.innerHTML = `<label for="wcurl" class="svelte-wezv84">URL</label>`;
    			t23 = space();
    			div23 = element("div");
    			input5 = element("input");
    			t24 = space();
    			div27 = element("div");
    			div25 = element("div");
    			div25.innerHTML = `<label for="wckey" class="svelte-wezv84">API Key</label>`;
    			t26 = space();
    			div26 = element("div");
    			input6 = element("input");
    			t27 = space();
    			div30 = element("div");
    			div28 = element("div");
    			div28.innerHTML = `<label for="wcsecret" class="svelte-wezv84">Secret</label>`;
    			t29 = space();
    			div29 = element("div");
    			input7 = element("input");
    			attr(div1, "class", "row svelte-wezv84");
    			attr(div2, "class", "col-25 svelte-wezv84");
    			attr(input0, "id", "couchdbhost");
    			attr(input0, "type", "text");
    			attr(input0, "placeholder", "127.0.0.1");
    			attr(input0, "class", "svelte-wezv84");
    			attr(div3, "class", "col-75 svelte-wezv84");
    			attr(div4, "class", "row svelte-wezv84");
    			attr(div5, "class", "col-25 svelte-wezv84");
    			attr(div6, "class", "col-75 svelte-wezv84");
    			attr(div7, "class", "row svelte-wezv84");
    			attr(div8, "class", "col-25 svelte-wezv84");
    			attr(input1, "id", "couchdbport");
    			attr(input1, "type", "text");
    			attr(input1, "placeholder", "6984");
    			attr(input1, "class", "svelte-wezv84");
    			attr(div9, "class", "col-75 svelte-wezv84");
    			attr(div10, "class", "row svelte-wezv84");
    			attr(div11, "class", "col-25 svelte-wezv84");
    			attr(input2, "id", "couchdbuser");
    			attr(input2, "type", "text");
    			attr(input2, "placeholder", "Nutzer");
    			attr(input2, "class", "svelte-wezv84");
    			attr(div12, "class", "col-75 svelte-wezv84");
    			attr(div13, "class", "row svelte-wezv84");
    			attr(div14, "class", "col-25 svelte-wezv84");
    			attr(input3, "id", "couchdbpassword");
    			attr(input3, "type", "password");
    			attr(input3, "placeholder", "Passwort");
    			attr(input3, "class", "svelte-wezv84");
    			attr(div15, "class", "col-75 svelte-wezv84");
    			attr(div16, "class", "row svelte-wezv84");
    			attr(div17, "class", "col-25 svelte-wezv84");
    			attr(input4, "id", "couchdbname");
    			attr(input4, "type", "text");
    			attr(input4, "placeholder", "Datenbank Name");
    			attr(input4, "class", "svelte-wezv84");
    			attr(div18, "class", "col-75 svelte-wezv84");
    			attr(div19, "class", "row svelte-wezv84");
    			attr(div21, "class", "row svelte-wezv84");
    			attr(div22, "class", "col-25 svelte-wezv84");
    			attr(input5, "id", "wcurl");
    			attr(input5, "type", "text");
    			attr(input5, "placeholder", "https://");
    			attr(input5, "class", "svelte-wezv84");
    			attr(div23, "class", "col-75 svelte-wezv84");
    			attr(div24, "class", "row svelte-wezv84");
    			attr(div25, "class", "col-25 svelte-wezv84");
    			attr(input6, "id", "wckey");
    			attr(input6, "type", "text");
    			attr(input6, "placeholder", "API Key");
    			attr(input6, "class", "svelte-wezv84");
    			attr(div26, "class", "col-75 svelte-wezv84");
    			attr(div27, "class", "row svelte-wezv84");
    			attr(div28, "class", "col-25 svelte-wezv84");
    			attr(input7, "id", "wcsecret");
    			attr(input7, "type", "password");
    			attr(input7, "placeholder", "Secret");
    			attr(input7, "class", "svelte-wezv84");
    			attr(div29, "class", "col-75 svelte-wezv84");
    			attr(div30, "class", "row svelte-wezv84");
    			attr(div31, "class", "content svelte-wezv84");
    			attr(div32, "class", "container svelte-wezv84");
    		},
    		m(target, anchor) {
    			insert(target, div32, anchor);
    			append(div32, div31);
    			append(div31, div1);
    			append(div31, t1);
    			append(div31, div4);
    			append(div4, div2);
    			append(div4, t3);
    			append(div4, div3);
    			append(div3, input0);
    			set_input_value(input0, /*$settingsStore*/ ctx[0].couchdbHost);
    			append(div31, t4);
    			append(div31, div7);
    			append(div7, div5);
    			append(div7, t6);
    			append(div7, div6);
    			mount_component(checkbox, div6, null);
    			append(div31, t7);
    			append(div31, div10);
    			append(div10, div8);
    			append(div10, t9);
    			append(div10, div9);
    			append(div9, input1);
    			set_input_value(input1, /*$settingsStore*/ ctx[0].couchdbPort);
    			append(div31, t10);
    			append(div31, div13);
    			append(div13, div11);
    			append(div13, t12);
    			append(div13, div12);
    			append(div12, input2);
    			set_input_value(input2, /*$settingsStore*/ ctx[0].couchdbUser);
    			append(div31, t13);
    			append(div31, div16);
    			append(div16, div14);
    			append(div16, t15);
    			append(div16, div15);
    			append(div15, input3);
    			set_input_value(input3, /*$settingsStore*/ ctx[0].couchdbPassword);
    			append(div31, t16);
    			append(div31, div19);
    			append(div19, div17);
    			append(div19, t18);
    			append(div19, div18);
    			append(div18, input4);
    			set_input_value(input4, /*$settingsStore*/ ctx[0].couchdbName);
    			append(div31, t19);
    			append(div31, div21);
    			append(div31, t21);
    			append(div31, div24);
    			append(div24, div22);
    			append(div24, t23);
    			append(div24, div23);
    			append(div23, input5);
    			set_input_value(input5, /*$settingsStore*/ ctx[0].wcUrl);
    			append(div31, t24);
    			append(div31, div27);
    			append(div27, div25);
    			append(div27, t26);
    			append(div27, div26);
    			append(div26, input6);
    			set_input_value(input6, /*$settingsStore*/ ctx[0].wcKey);
    			append(div31, t27);
    			append(div31, div30);
    			append(div30, div28);
    			append(div30, t29);
    			append(div30, div29);
    			append(div29, input7);
    			set_input_value(input7, /*$settingsStore*/ ctx[0].wcSecret);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(input0, "input", /*input0_input_handler*/ ctx[1]),
    					listen(input1, "input", /*input1_input_handler*/ ctx[3]),
    					listen(input2, "input", /*input2_input_handler*/ ctx[4]),
    					listen(input3, "input", /*input3_input_handler*/ ctx[5]),
    					listen(input4, "input", /*input4_input_handler*/ ctx[6]),
    					listen(input5, "input", /*input5_input_handler*/ ctx[7]),
    					listen(input6, "input", /*input6_input_handler*/ ctx[8]),
    					listen(input7, "input", /*input7_input_handler*/ ctx[9])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$settingsStore*/ 1 && input0.value !== /*$settingsStore*/ ctx[0].couchdbHost) {
    				set_input_value(input0, /*$settingsStore*/ ctx[0].couchdbHost);
    			}

    			const checkbox_changes = {};

    			if (!updating_checked && dirty & /*$settingsStore*/ 1) {
    				updating_checked = true;
    				checkbox_changes.checked = /*$settingsStore*/ ctx[0].couchdbHTTPS;
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);

    			if (dirty & /*$settingsStore*/ 1 && input1.value !== /*$settingsStore*/ ctx[0].couchdbPort) {
    				set_input_value(input1, /*$settingsStore*/ ctx[0].couchdbPort);
    			}

    			if (dirty & /*$settingsStore*/ 1 && input2.value !== /*$settingsStore*/ ctx[0].couchdbUser) {
    				set_input_value(input2, /*$settingsStore*/ ctx[0].couchdbUser);
    			}

    			if (dirty & /*$settingsStore*/ 1 && input3.value !== /*$settingsStore*/ ctx[0].couchdbPassword) {
    				set_input_value(input3, /*$settingsStore*/ ctx[0].couchdbPassword);
    			}

    			if (dirty & /*$settingsStore*/ 1 && input4.value !== /*$settingsStore*/ ctx[0].couchdbName) {
    				set_input_value(input4, /*$settingsStore*/ ctx[0].couchdbName);
    			}

    			if (dirty & /*$settingsStore*/ 1 && input5.value !== /*$settingsStore*/ ctx[0].wcUrl) {
    				set_input_value(input5, /*$settingsStore*/ ctx[0].wcUrl);
    			}

    			if (dirty & /*$settingsStore*/ 1 && input6.value !== /*$settingsStore*/ ctx[0].wcKey) {
    				set_input_value(input6, /*$settingsStore*/ ctx[0].wcKey);
    			}

    			if (dirty & /*$settingsStore*/ 1 && input7.value !== /*$settingsStore*/ ctx[0].wcSecret) {
    				set_input_value(input7, /*$settingsStore*/ ctx[0].wcSecret);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(checkbox.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(checkbox.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div32);
    			destroy_component(checkbox);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $settingsStore;
    	component_subscribe($$self, settingsStore, $$value => $$invalidate(0, $settingsStore = $$value));
    	let prevValue;
    	let timer;

    	const debounce = functionAfterDebounce => {
    		clearTimeout(timer);

    		timer = setTimeout(
    			() => {
    				functionAfterDebounce();
    			},
    			750
    		);
    	};

    	const onSettingsChanged = () => {
    		Database.connect();
    		success("Einstellungen gespeichert!", 1500);
    	};

    	const unsubscribe = settingsStore.subscribe(value => {
    		if (prevValue && JSON.stringify(value) !== JSON.stringify(prevValue)) {
    			debounce(onSettingsChanged);
    		}

    		prevValue = JSON.parse(JSON.stringify(value));
    	});

    	onDestroy(unsubscribe);

    	function input0_input_handler() {
    		$settingsStore.couchdbHost = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function checkbox_checked_binding(value) {
    		if ($$self.$$.not_equal($settingsStore.couchdbHTTPS, value)) {
    			$settingsStore.couchdbHTTPS = value;
    			settingsStore.set($settingsStore);
    		}
    	}

    	function input1_input_handler() {
    		$settingsStore.couchdbPort = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function input2_input_handler() {
    		$settingsStore.couchdbUser = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function input3_input_handler() {
    		$settingsStore.couchdbPassword = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function input4_input_handler() {
    		$settingsStore.couchdbName = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function input5_input_handler() {
    		$settingsStore.wcUrl = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function input6_input_handler() {
    		$settingsStore.wcKey = this.value;
    		settingsStore.set($settingsStore);
    	}

    	function input7_input_handler() {
    		$settingsStore.wcSecret = this.value;
    		settingsStore.set($settingsStore);
    	}

    	return [
    		$settingsStore,
    		input0_input_handler,
    		checkbox_checked_binding,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		input4_input_handler,
    		input5_input_handler,
    		input6_input_handler,
    		input7_input_handler
    	];
    }

    class SettingsFormular extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$3, create_fragment$2, safe_not_equal, {});
    	}
    }

    const MAX_LOG_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
    const currentMs = new Date().getTime();

    const loadLogs = () => JSON.parse(localStorage.getItem("logs") ?? "[]");

    const persistLogs = (logs) =>
      localStorage.setItem(
        "logs",
        JSON.stringify(logs.filter((log) => currentMs - log.time < MAX_LOG_AGE_MS))
      );

    const appendLog = (log) => persistLogs([...loadLogs(), log]);

    /* src/components/Logging/Logger.svelte generated by Svelte v3.38.2 */

    function instance$2($$self) {
    	Logger.setLevel(Logger.DEBUG);
    	var consoleHandler = Logger.createDefaultHandler();

    	Logger.setHandler(function (messages, context) {
    		consoleHandler(messages, context);
    		if (typeof messages[0] === "object") messages[0] = messages[0].toString();

    		appendLog({
    			time: new Date().getTime(),
    			level: context.level,
    			message: messages[0]
    		});
    	});

    	return [];
    }

    class Logger_1 extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$2, null, safe_not_equal, {});
    	}
    }

    /* src/components/Logging/LogView.svelte generated by Svelte v3.38.2 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (34:2) {#each loadLogs() as log}
    function create_each_block(ctx) {
    	let t0_value = /*formatLog*/ ctx[1](/*log*/ ctx[2]) + "";
    	let t0;
    	let t1;
    	let br;

    	return {
    		c() {
    			t0 = text(t0_value);
    			t1 = space();
    			br = element("br");
    		},
    		m(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    			insert(target, br, anchor);
    		},
    		p: noop,
    		d(detaching) {
    			if (detaching) detach(t0);
    			if (detaching) detach(t1);
    			if (detaching) detach(br);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;
    	let each_value = loadLogs();
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Logs";
    			t1 = space();
    			button = element("button");
    			button.textContent = "Download";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div0, "class", "header");
    			attr(div1, "class", "content svelte-1jmp5ie");
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, h1);
    			append(div0, t1);
    			append(div0, button);
    			append(div1, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			if (!mounted) {
    				dispose = listen(button, "click", /*download*/ ctx[0]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*formatLog, loadLogs*/ 2) {
    				each_value = loadLogs();
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$1($$self) {
    	function download() {
    		var text = loadLogs().map(formatLog).join("\n");
    		var element = document.createElement("a");
    		element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
    		element.setAttribute("download", `LeihLokalVerwaltung_Logs_${new Date().getUTCDate()}_${new Date().getUTCMonth() + 1}`);
    		element.style.display = "none";
    		document.body.appendChild(element);
    		element.click();
    		document.body.removeChild(element);
    	}

    	const formatLog = log => {
    		return `${new Date(log.time).toLocaleDateString()} ${new Date(log.time).toLocaleTimeString()} [${log.level.name}] ${log.message}`;
    	};

    	return [download, formatLog];
    }

    class LogView extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
    	}
    }

    /* src/components/App.svelte generated by Svelte v3.38.2 */

    function create_default_slot(ctx) {
    	let router;
    	let current;

    	router = new Router({
    			props: {
    				routes: {
    					"/logs": LogView,
    					"/rentals": wrap({
    						component: TableEditor,
    						props: { tab: "rentals" }
    					}),
    					"/items": wrap({
    						component: TableEditor,
    						props: { tab: "items" }
    					}),
    					"/customers": wrap({
    						component: TableEditor,
    						props: { tab: "customers" }
    					}),
    					"/settings": wrap({ component: SettingsFormular }),
    					"*": wrap({
    						component: {},
    						conditions: [/*func*/ ctx[0]]
    					})
    				}
    			}
    		});

    	return {
    		c() {
    			create_component(router.$$.fragment);
    		},
    		m(target, anchor) {
    			mount_component(router, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(router, detaching);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let logger;
    	let t0;
    	let notificationdisplay;
    	let t1;
    	let div;
    	let navbar;
    	let t2;
    	let modal;
    	let current;
    	logger = new Logger_1({});
    	notificationdisplay = new Notifications({});
    	navbar = new Navbar({});

    	modal = new Modal_1({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			}
    		});

    	return {
    		c() {
    			create_component(logger.$$.fragment);
    			t0 = space();
    			create_component(notificationdisplay.$$.fragment);
    			t1 = space();
    			div = element("div");
    			create_component(navbar.$$.fragment);
    			t2 = space();
    			create_component(modal.$$.fragment);
    			attr(div, "class", "container svelte-1x1qe49");
    		},
    		m(target, anchor) {
    			mount_component(logger, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(notificationdisplay, target, anchor);
    			insert(target, t1, anchor);
    			insert(target, div, anchor);
    			mount_component(navbar, div, null);
    			append(div, t2);
    			mount_component(modal, div, null);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			const modal_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			modal.$set(modal_changes);
    		},
    		i(local) {
    			if (current) return;
    			transition_in(logger.$$.fragment, local);
    			transition_in(notificationdisplay.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(logger.$$.fragment, local);
    			transition_out(notificationdisplay.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d(detaching) {
    			destroy_component(logger, detaching);
    			if (detaching) detach(t0);
    			destroy_component(notificationdisplay, detaching);
    			if (detaching) detach(t1);
    			if (detaching) detach(div);
    			destroy_component(navbar);
    			destroy_component(modal);
    		}
    	};
    }

    function instance($$self) {
    	const func = detail => {
    		replace("/rentals");
    		return false;
    	};

    	return [func];
    }

    class App extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, {});
    	}
    }

    // https://github.com/cypress-io/cypress/issues/702
    if ("serviceWorker" in navigator && !window.Cypress) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("service-worker.js").then(
          function (registration) {
            // Registration was successful
            console.debug("ServiceWorker registration successful with scope: ", registration.scope);
          },
          function (err) {
            // registration failed :(
            console.error("ServiceWorker registration failed: ", err);
          }
        );
      });
    }

    var app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
