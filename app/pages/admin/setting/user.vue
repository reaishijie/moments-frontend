<script setup lang="ts">
import UserSetting from '~/components/admin/Setting/User.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '用户设置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <UserSetting />
</template>
