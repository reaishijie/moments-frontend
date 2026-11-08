<script setup lang="ts">
import OAuthSetting from '~/components/admin/Setting/OAuth.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ layout: 'admin', middleware: 'admin' })

useSeo({ title: 'OAuth 登录', robots: PRIVATE_ROBOTS })
</script>

<template>
  <OAuthSetting />
</template>
