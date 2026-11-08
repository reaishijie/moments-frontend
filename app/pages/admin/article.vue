<script setup lang="ts">
import AdminArticle from '~/components/admin/Article.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '文章管理', robots: PRIVATE_ROBOTS })
</script>

<template>
  <AdminArticle />
</template>
