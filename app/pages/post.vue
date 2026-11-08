<script setup lang="ts">
import PostView from '~/components/views/Post.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ middleware: 'auth' })

useSeo({ title: '发表文章', robots: PRIVATE_ROBOTS })
</script>

<template>
  <PostView />
</template>
