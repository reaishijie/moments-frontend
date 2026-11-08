<script setup lang="ts">
import AdminComment from '~/components/admin/Comment.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '评论管理', robots: PRIVATE_ROBOTS })
</script>

<template>
  <AdminComment />
</template>
