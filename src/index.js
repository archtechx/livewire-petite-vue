import { createApp, nextTick, reactive } from 'https://unpkg.com/petite-vue?module'

let wireProxies = new WeakMap

// Vue-tracked object that changes after every LW request
const __livewireMemo = reactive({
    previous: 'none',
    checksum: 'start',
})

Livewire.hook('message.received', (data) => __livewireMemo.checksum = data.response.serverMemo.checksum)

// Vue changes -> LW
let wireProperty = (livewire, prop, defer = false) => new Proxy(livewire.get(prop), {
    set(target, property, value) {
        livewire.set(prop + '.' + property, value, defer)

        return true
    },

    get(target, property, val, receiver) {
        if (property === Symbol.toStringTag) {
            return 'WireProperty'
        }

        let value = livewire.get(prop + '.' + property);

        if (typeof value === 'object') {
            return wireProperty(livewire, prop + '.' + property, defer)
        }

        return value
    }
})

// Vue changes -> LW
let wireProxy = (livewire, defer = false) => {
    if (wireProxies.has(livewire) && ! defer) {
        return wireProxies.get(livewire)
    }

    let proxy = new Proxy(__livewireMemo, {
        set(target, property, value) {
            livewire.set(property, value, defer)

            return true
        },

        get(target, property) {
            if (property === 'deferred') {
                return wireProxy(livewire, true)
            }

            if (property === Symbol.toStringTag) {
                return 'WireProxy'
            }

            let value = livewire.get(property);

            if (value === undefined && ! property.startsWith('__v')) {
                return (...args) => livewire.call(property, ...args);
            }

            if (typeof value === 'object') {
                return wireProperty(livewire, property, defer)
            }

            return value
        }
    })

    if (! defer) {
        wireProxies.set(livewire, proxy)
    }

    return proxy
}

const directive = ctx => {
    ctx.el.setAttribute('wire:ignore', true)

    const wire = wireProxy(ctx.el.closest('[wire\\:id]').__livewire);

    const state = ctx.ctx.scope;

    state.wire = wire

    ctx.effect(() => {
        if (state.__livewireMemo.checksum !== state.__livewireMemo.previous) {
            let data = ctx.get()

            if (Array.isArray(data)) {
                data = data.reduce((map, property) => {
                    map[property] = property

                    return map
                }, {})
            }

            for (const [property, livewire] of Object.entries(data)) {
                // LW changes -> Vue
                if (ctx.modifiers && ctx.modifiers.defer) {
                    state[property] = wire.deferred[livewire]
                } else {
                    state[property] = wire[livewire]
                }
            }
        }
    });

    return () => {}
}

const state = {
    __livewireMemo,
};

const create = (data) => createApp({ ...state, ...data }).directive('livewire', directive)

export { state, directive, create as createApp, nextTick, reactive };
