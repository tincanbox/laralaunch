<template>
    <span>
        <span @click="startConfirmingPassword">
            <slot />
        </span>

        <jet-dialog-modal :show="confirmingPassword" @close="confirmingPassword = false">
            <template #title>
                {{ __(title) }}
            </template>

            <template #content>
                {{ __(content) }}

                <div class="mt-4">
                    <jet-input type="password" class="mt-1 block w-3/4" placeholder="Password"
                                ref="password"
                                v-model="form.password"
                                @keyup.enter.native="confirmPassword" />

                    <jet-input-error :message="form.error" class="mt-2" />
                </div>
            </template>

            <template #footer>
                <jet-secondary-button @click.native="confirmingPassword = false">
                    {{ __('$.nevermind') }}
                </jet-secondary-button>

                <jet-button class="ml-2" @click.native="confirmPassword" :class="{ 'opacity-25': form.processing }" :disabled="form.processing">
                    {{ __('$.confirm') }}
                </jet-button>
            </template>
        </jet-dialog-modal>
    </span>
</template>

<script>
import JetButton from './Button'
import JetDialogModal from './DialogModal'
import JetInput from './Input'
import JetInputError from './InputError'
import JetSecondaryButton from './SecondaryButton'

export default {
    props: {
        title: {
            default: 'modal.confirm-password:title',
        },
        content: {
            default: 'modal.confirm-password:desc',
        },
        button: {
            default: '$.confirm',
        }
    },

    components: {
        JetButton,
        JetDialogModal,
        JetInput,
        JetInputError,
        JetSecondaryButton,
    },

    data() {
        return {
            confirmingPassword: false,

            form: this.$inertia.form({
                password: '',
                error: '',
            }, {
                bag: 'confirmPassword',
            })
        }
    },

    methods: {
        startConfirmingPassword() {
            this.form.error = '';

            axios.get(route('password.confirmation').url()).then(response => {
                if (response.data.confirmed) {
                    this.$emit('confirmed');
                } else {
                    this.confirmingPassword = true;
                    this.form.password = '';

                    setTimeout(() => {
                        this.$refs.password.focus()
                    }, 250)
                }
            })
        },

        confirmPassword() {
            this.form.processing = true;

            axios.post(route('password.confirm').url(), {
                password: this.form.password,
            }).then(response => {
                this.confirmingPassword = false;
                this.form.password = '';
                this.form.error = '';
                this.form.processing = false;

                this.$nextTick(() => this.$emit('confirmed'));
            }).catch(error => {
                this.form.processing = false;
                this.form.error = error.response.data.errors.password[0];
            });
        }
    }
}
</script>
