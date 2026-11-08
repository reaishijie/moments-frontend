<script setup lang="ts">
import EmailSetting from '~/components/admin/Setting/Email.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '邮箱配置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <EmailSetting />
</template>
