<template>
  <div class="emoji-picker-container" v-if="show">
    <div class="emoji-picker">
      <div class="emoji-grid">
        <div
          v-for="emoji in commonEmojis"
          :key="emoji"
          class="emoji"
          @click="selectEmoji(emoji)"
        >
          {{ emoji }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'close']);

// Lista comum de emojis para WhatsApp
const commonEmojis = [
  '👍', '👎', '❤️', '😊', '😂', '🙏',
  '😭', '😘', '🤔', '😉', '😍', '😎',
  '😢', '🙄', '😳', '🤗', '🤪', '😴',
  '🤓', '😇', '😡', '🤯', '🎉', '👋',
  '✌️', '👌', '🙌', '🤝', '💪', '🙂',
  '😅', '😌', '🤩', '🥰', '😤', '🤬'
];

const selectEmoji = (emoji) => {
  emit('select', emoji);
  emit('close');
};
</script>

<style scoped>
.emoji-picker-container {
  position: relative;
}

.emoji-picker {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  background-color: #fff;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,.1);
  width: 320px;
  max-height: 300px;
  overflow-y: auto;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
  padding: 0.5rem;
}

.emoji {
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.2s;
  font-size: 1.2rem;
}

.emoji:hover {
  background-color: #f0f0f0;
}
</style>
