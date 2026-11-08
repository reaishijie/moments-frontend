<script setup lang="ts">
import AdminUser from '~/components/admin/User.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '用户管理', robots: PRIVATE_ROBOTS })
</script>

<template>
  <AdminUser />
</template>
