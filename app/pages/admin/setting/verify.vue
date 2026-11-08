<script setup lang="ts">
import VerifySetting from '~/components/admin/Setting/Verify.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '验证设置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <VerifySetting />
</template>
