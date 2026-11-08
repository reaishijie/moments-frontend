<script setup lang="ts">
import SettingView from '~/components/admin/Setting.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '系统设置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <SettingView />
</template>
