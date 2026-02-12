<script setup>
import { toRef } from 'vue'
import { useField } from 'vee-validate'

const props = defineProps({
  type: {
    type: String,
    default: 'text',
  },
  value: {
    type: String,
    default: undefined,
  },
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: '',
  },
})

// use `toRef` to create reactive references to `name` prop which is passed to `useField`
// this is important because vee-validte needs to know if the field name changes
// https://vee-validate.logaretm.com/v4/guide/composition-api/caveats
const name = toRef(props, 'name')

// we don't provide any rules here because we are using form-level validation
// https://vee-validate.logaretm.com/v4/guide/validation#form-level-validation
const {
  value: inputValue,
  errorMessage,
  handleBlur,
  handleChange,
  meta,
} = useField(name, undefined, {
  initialValue: props.value,
})
</script>

<template>
  <div
    class="TextInput"
    :class="{ 'has-error': !!errorMessage, success: meta.valid }"
  >
    <label :for="name">{{ label }}</label>
    <input
      :id="name"
      :name="name"
      :type="type"
      :value="inputValue"
      :placeholder="placeholder"
      @input="handleChange"
      @blur="handleBlur"
    >

    <p
      v-show="errorMessage || meta.valid"
      class="help-message"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<style scoped>
.TextInput {
  position: relative;
  margin-bottom: 1rem;
  width: 100%;
}

label {
  display: block;
  margin-bottom: 4px;
  width: 100%;
}

input {
  border-radius: 5px;
  border: 2px solid transparent;
  padding: 6px 8px;
  outline: none;
  background-color: #f2f5f7;
  width: 100%;
  transition: border-color 0.3s ease-in-out, color 0.3s ease-in-out,
  background-color 0.3s ease-in-out;
}

input:focus {
  border-color: #0071FEFF;
}

.help-message {
  position: absolute;
  bottom: calc(-1.5 * 1em);
  left: 0;
  margin: 0;
  font-size: 14px;
}

.TextInput.has-error input {
  background-color: #FDDFE2FF;
  color: #F23648FF;
}

.TextInput.has-error input:focus {
  border-color: #F23648FF;
}

.TextInput.has-error .help-message {
  color: #F23648FF;
}

.TextInput.success input {
  background-color: #E0EEE4FF;
  color: #21A67AFF;
}

.TextInput.success input:focus {
  border-color: #21A67AFF;
}

.TextInput.success .help-message {
  color: #21A67AFF;
}
</style>
