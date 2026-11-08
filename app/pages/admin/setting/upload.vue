<script setup lang="ts">
import UploadSetting from '~/components/admin/Setting/Upload.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: '上传设置', robots: PRIVATE_ROBOTS })
</script>

<template>
  <UploadSetting />
</template>
