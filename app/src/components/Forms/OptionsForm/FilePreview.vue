<template>
  <div v-if="file" class="file-preview mt-2">
    <!-- Imagem -->
    <div v-if="isImage" class="preview-container">
      <img :src="previewUrl" class="img-preview" :alt="file.name" />
    </div>
    <!-- Vídeo -->
    <div v-else-if="isVideo" class="preview-container">
      <video controls class="video-preview">
        <source :src="previewUrl" :type="file.type">
        Seu navegador não suporta o elemento de vídeo.
      </video>
    </div>
    <!-- Áudio -->
    <div v-else-if="isAudio" class="preview-container">
      <audio controls class="audio-preview">
        <source :src="previewUrl" :type="file.type">
        Seu navegador não suporta o elemento de áudio.
      </audio>
    </div>
    <!-- Outros tipos de arquivo -->
    <div v-else class="file-info">
      <i class="bi" :class="fileIcon"></i>
      <span class="ms-2">{{ file.name }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  file: {
    type: File,
    required: true
  }
});

const previewUrl = ref('');

const isImage = computed(() => props.file?.type.startsWith('image/'));
const isVideo = computed(() => props.file?.type.startsWith('video/'));
const isAudio = computed(() => props.file?.type.startsWith('audio/'));

const fileIcon = computed(() => {
  if (props.file?.type === 'application/pdf') return 'bi-file-pdf';
  if (isImage.value) return 'bi-file-image';
  if (isVideo.value) return 'bi-file-play';
  if (isAudio.value) return 'bi-file-music';
  return 'bi-file-earmark';
});

const createPreview = () => {
  if (props.file) {
    previewUrl.value = URL.createObjectURL(props.file);
  }
};

watch(() => props.file, () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
  createPreview();
});

onMounted(() => {
  createPreview();
});

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value);
  }
});
</script>

<style scoped>
.file-preview {
  border: 1px solid #dee2e6;
  border-radius: 0.375rem;
  padding: 0.5rem;
  background-color: #f8f9fa;
}

.preview-container {
  max-width: 100%;
  max-height: 200px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.img-preview {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.video-preview,
.audio-preview {
  width: 100%;
  max-height: 200px;
}

.file-info {
  display: flex;
  align-items: center;
  padding: 0.5rem;
}

.file-info i {
  font-size: 1.5rem;
}
</style>
