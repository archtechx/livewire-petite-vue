# petite-vue driver for Livewire

This package provides [petite-vue](https://github.com/vuejs/petite-vue) support for [Livewire](https://laravel-livewire.com).

## Installation

Currently it's only possible to use this library using a `<script type="module">`. Later we'd also like to support a self-initializing non-module `<script>` as well as an npm package.

```html
<script type="module">
    import { createApp } from 'https://unpkg.com/@archtechx/livewire-petite-vue'

    window.addEventListener('livewire:load', () => {
        createApp().mount()
    })
</script>
```

The imported `createApp` automatically includes a bit of global state and a `v-livewire` directive. If you'd like to do this manually, you can use:

```html
<script type="module">
    import { state, directive } from 'https://unpkg.com/@archtechx/livewire-petite-vue'
    import { createApp } from 'https://unpkg.com/petite-vue?module'

    window.addEventListener('livewire:load', () => {
        createApp(state).directive('livewire', directive).mount()
    })
</script>
```

## Usage

The package provides a `v-livewire` directive that lets you configure bi-directional links between Vue state and Livewire state.

For example, if you had a `messages` property in Vue and an `items` property in Livewire, you could do:

```html
<div v-livewire="{ messages: 'items' }" v-scope="{ messages: {} }">
```

Note that you **always need to have the property in Vue as well**. You need some initial state, and your template must work with the empty state. In our case, an empty state for messages is just `{}`.

If the properties are named the same, you can simply pass an array:

```html
<div v-livewire="['messages']" v-scope="{ messages: {} }">
```

If you'd like to defer value changes, i.e. have reactive state in Vue but only update Livewire backend state when a Livewire action is executed, you can use the `.defer` modifier:

```html
<div v-livewire.defer="['messages']" v-scope="{ messages: {} }">
```

After your bindings are configured, you can simply update state and the changes will sync between Vue and Livewire. Any changes done in Livewire will be reflected in Vue, and any changes done in Vue (e.g. via `v-model` inputs) will be reflected in Livewire.

That's the state. But Livewire can also call methods.

For that, you can simply use the `wire` proxy in your component's state:

```html
<button type="button" @click="wire.send(id)">
    Send
</button>
```

If the methods return a value, you can do something like `await wire.foo('bar')`.

```html
<div v-livewire="['messages']" v-scope="{ messages: {}, foo: 'bar' }">
    You can use Vue-only state in the component: {{ foo }}
    <input v-model="foo">

    <template v-for="(message, id) in messages">
        <div>
            <div>
                <label :for="`message-${id}`">Message</label>
                <input :id="`message-${id}`" v-model.lazy="messages[id].message">
            </div>

            <button type="button" @click="wire.send(id)">
                Send
            </button>

            <button type="button" @click="wire.remove(id)">
                Remove
            </button>
        </div>
    </template>
</div>
```

## Things to note

Vue uses templates which contain `{{ these }}` things, and that doesn't pair with Livewire as well as Alpine.

For that reason, the library automatically adds `wire:ignore` to the root element of each petite-vue component.
