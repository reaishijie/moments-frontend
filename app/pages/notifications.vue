<script setup lang="ts">
import NotificationsView from '~/components/views/Notifications.vue'
import { PRIVATE_ROBOTS } from '~/composables/useSeo'

definePageMeta({ middleware: 'auth' })

useSeo({ title: '消息通知', robots: PRIVATE_ROBOTS })
</script>

<template>
  <NotificationsView />
</template>
