<script setup lang="ts">
import AdminDashboard from '~/components/views/AdminDashboard.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '控制台', robots: PRIVATE_ROBOTS })
</script>

<template>
  <AdminDashboard />
</template>
