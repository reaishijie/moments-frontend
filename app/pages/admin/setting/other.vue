<script setup lang="ts">
import OtherSetting from '~/components/admin/Setting/Other.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '其他设置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <OtherSetting />
</template>
