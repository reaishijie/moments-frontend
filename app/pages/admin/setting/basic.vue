<script setup lang="ts">
import BasicSetting from '~/components/admin/Setting/Basic.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '基础设置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <BasicSetting />
</template>
