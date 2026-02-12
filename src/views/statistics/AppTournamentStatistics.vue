<script setup>
import { tournamentApi } from "@/services/tournament/tournament.service"
import { coinApi } from "@/services/parts/coin"
import { onMounted, ref, watch } from "vue"
import { useLoading } from "@/composable/useLoading"
import { getValueMatchLocale } from "@/util/helper"
import SelectInfiniteScroll from "@/components/form/SelectInfiniteScroll.vue"
import CardStatisticsVertical from "@core/components/cards/CardStatisticsVertical.vue"
import AppDateTimePicker from "@core/components/app-form-elements/AppDateTimePicker.vue"
import { formatYMD, getFirstDateOfMonth, getLastDateOfMonth } from "@/util/date"

const { loading, startFetching, finishFetching } = useLoading()

const { merchantId } = useMerchantStore()
const activeUsers = ref(null)
const policyTotal = ref(null)
const tournamentList = ref([])
const tournament = ref(null)
const groupList = ref([])
const group = ref(null)
const dateRange = ref([])
const windowWidth = window.innerWidth

const tasks = ref({
  list: [],
  isFetching: false,
  pagination: {
    current: 1,
    next: 1,
    perPage: 15,
    previous: 0,
    totalItem: 0,
    totalPage: 0,
  },
})

const task = ref(null)

const userSeries = ref([])
const tasksSeries = ref([])

const userChartOptions = ref({
  chart: {
    type: 'bar',
    height: 500,
    width: '100%',
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 1,
      barHeight: '70%',
      dataLabels: {
        position: 'top',
        total: {
          enabled: true,
          style: {
            fontSize: '13px',
            fontWeight: 900,
          },
        },
      },
    },
  },
  dataLabels: {
    enabled: true,
    style: {
      colors: undefined,
    },
    background: {
      enabled: true,
    },
  },
  yaxis: {
    labels: {
      show: true,
      style: {
        colors: '#8d8d8d',
      },
    },
  },
  xaxis: {
    type: 'category',
    categories: [],
    labels: {
      show: true,
      style: {
        colors: '#8d8d8d',
      },
    },
  },
  legend: {
    show: false,
  },
  tooltip: {
    enabled: true,
    intersect: false,
    theme: true,
  },

  // responsive: [
  //   {
  //     breakpoint: 992,
  //     options: {
  //       plotOptions: {
  //         bar: {
  //           horizontal: true,
  //         },
  //       },
  //       chart: {
  //         height: 700,
  //       },
  //     },
  //   },
  // ],
})

const tasksChartOptions = ref({
  chart: {
    type: 'bar',
    height: 500,
    stacked: true,
    width: '100%',
    toolbar: {
      show: false,
    },
    zoom: {
      enabled: false,
    },
  },
  plotOptions: {
    bar: {
      horizontal: false,
      borderRadius: 10,
      dataLabels: {
        position: 'center',
        total: {
          enabled: true,
          offsetX: 100,
          offsetY: '10%',
          style: {
            color: '#373d3f',
            fontSize: '20px',
            fontFamily: undefined,
            fontWeight: 600,
          },
        },
      },
    },
  },

  dataLabels: {
    show: true,
    enabled: true,
    style: {
      colors: undefined,
    },
    background: {
      enabled: true,
    },
  },
  yaxis: {
    labels: {
      show: true,
      style: {
        colors: '#8d8d8d',
      },
    },
  },
  xaxis: {
    type: 'category',
    categories: [],
    labels: {
      show: true,
      style: {
        colors: '#8d8d8d',
      },
    },
  },
  legend: {
    show: true,
    labels: {
      colors: '#8d8d8d',
    },
  },
  tooltip: {
    enabled: true,
  },

  // responsive: [
  //   {
  //     breakpoint: 1000,
  //     options: {
  //       plotOptions: {
  //         bar: {
  //           horizontal: true,
  //         },
  //       },
  //       chart: {
  //         height: 700,
  //       },
  //     },
  //   },
  // ],
})

watch(tournament, (newVal, oldVal) => {
  if(oldVal !== newVal) {
    groupList.value = []
    if (newVal) {
      fetchGroupList()
    }
  }
})

async function fetchActiveUsers() {
  try {
    const { data } = await tournamentApi.activeUserTotal()

    activeUsers.value = data.result
  } finally {}
}

async function fetchPolicyTotal() {
  const body = {
    merchant_id: merchantId,
  }

  try {
    const { data } = await coinApi.getTournamentPolicyTotal(body)

    policyTotal.value = data.result
  } finally {}
}

async function fetchTournamentList() {
  const body = {
    merchant_id: merchantId,
    page: 1,
    limit: 20,
  }

  try {
    startFetching()

    const { data } = await tournamentApi.fetchAllTournaments(body)

    tournamentList.value = data.result.map(item => {
      return {
        ...item,
        name: getValueMatchLocale(item.name),
      }
    })
  } finally {
    finishFetching()
  }
}

async function fetchGroupList() {
  const body = {
    tournament_id: tournament?.value?.id,
    page: 1,
    limit: 20,
  }

  if(tournament?.value?.id) {
    try {
      startFetching()

      const { data } = await tournamentApi.fetchAllGroups(body)

      groupList.value = data.result.map(item => {
        return {
          ...item,
          name: getValueMatchLocale(item.name),
        }
      }).sort((a, b) => {
        if(a.name < b.name) { return -1 }
        if(a.name > b.name) { return 1 }

        return 0
      })
    } finally {
      finishFetching()
    }
  }
}

async function getTasks() {
  if(tasks.value.isFetching || tasks.value.pagination.next === 0) {
    return
  }
  try {
    tasks.value.isFetching = true

    const body = {
      page: tasks.value.pagination.next,
      limit: tasks.value.pagination.perPage,
    }

    const { data } = await tournamentApi.fetchAllTasks(body)

    const result = data.result.map(item => {
      return {
        ...item,
        name: getValueMatchLocale(item.name),
      }
    })

    tasks.value.pagination = data.pagination
    result.forEach(item => {
      tasks.value.list.push(item)
    })
  } finally {
    tasks.value.isFetching = false
  }
}

async function getActiveUsersStatistics(fromDate, toDate) {
  const body = {
    merchant_id: merchantId,
    from_date: fromDate,
    to_date: toDate,
  }

  if(group.value) {
    body.group_id = group.value
  }

  if(task.value) {
    body.task_id = task.value
  }

  if(tournament?.value?.id) {
    body.from_date = getFirstDateOfMonth(tournament.value.start_date)
    body.to_date = getLastDateOfMonth(tournament.value.start_date)
  }

  userChartOptions.value.xaxis.categories.length = 0
  try {
    const { data } = await tournamentApi.activeUserStatistics(body)

    const arr = data.result

    userSeries.value = [
      {
        name: '',
        data: [],
      },
    ]

    arr.forEach(item => {
      userSeries.value[0].name = 'Users'
      userSeries.value[0].data.push(item.count)
    })

    for (let i = 0; i < arr.length; i++) {
      const [d, m] = arr[i].date.split('-')

      userChartOptions.value.xaxis.categories.push(`${d}.${m}`)
    }
  } finally {}
}

async function getFullTaskMultipleStatistics(fromDate, toDate) {
  const body = {
    merchant_id: merchantId,
    from_date: fromDate,
    to_date: toDate,
  }

  if(group.value) {
    body.group_id = group.value
  }

  if(task.value) {
    body.task_id = task.value
  }

  if(tournament?.value?.id) {
    body.from_date = getFirstDateOfMonth(tournament.value.start_date)
    body.to_date = getLastDateOfMonth(tournament.value.start_date)
  }
  tasksChartOptions.value.xaxis.categories.length = 0
  try {
    const { data } = await tournamentApi.fullTaskStatisticsByTask()

    const arr = data.result

    tasksSeries.value = arr.map(item => {
      return {
        name: getValueMatchLocale(item.award.name),
        data: item.statistics.map(i => {
          return i['count']
        }),
      }
    })

    if (arr.length) {
      arr[0].statistics.forEach(item => {
        const [d, m] = item['date'].split('-')

        tasksChartOptions.value.xaxis.categories.push(`${d}.${m}`)
      })
    }

  } finally {}
}

async function resetFilter() {
  tournament.value = null
  task.value = null
  group.value = null
  await fixDateRange()
}

async function changeRange(dates) {
  dateRange.value = []
  dateRange.value[0] = formatYMD(dates[0])
  dateRange.value[1] = formatYMD(dates[1])
  await statisticsApiCall()
}

async function fixDateRange() {
  const date = new Date()
  const year = date.getUTCFullYear() // Get the full year (4 digits)
  const beforeMonth = String(date.getMonth()).padStart(2, '0') // Month is zero-based, so add 1 and pad with leading zero if necessary
  const currentMonth = String(date.getMonth() + 1).padStart(2, '0') // Month is zero-based, so add 1 and pad with leading zero if necessary
  const day = String(date.getDate()).padStart(2, '0') // Pad day with leading zero if necessary

  dateRange.value = []
  dateRange.value[0] = `${year}-${beforeMonth}-${day}`
  dateRange.value[1] = `${year}-${currentMonth}-${day}`
  await statisticsApiCall()
}

function changeChartType() {
  userChartOptions.value.plotOptions.bar.horizontal =
    windowWidth < 576
}

function splitDateRange(str) {
  let string = []
  if (typeof str === 'string') {
    string = str.split(' to ')
  }
  dateRange.value = string
}

async function statisticsApiCall() {
  if (typeof dateRange.value === 'string') {
    splitDateRange(dateRange.value)
  }
  await Promise.allSettled([
    getActiveUsersStatistics(dateRange.value[0], dateRange.value[1]),
    getFullTaskMultipleStatistics(dateRange.value[0], dateRange.value[1]),
  ])
}

onMounted(async () => {
  await fetchActiveUsers()
  await fetchPolicyTotal()

  changeChartType()
  await fetchTournamentList()
  await getTasks()
  await fixDateRange()
})
</script>

<template>
  <section class="statistics">
    <h2 class="table-title mb-5">
      Tournament Statistics
    </h2>
    <VRow>
      <VCol cols="6">
        <VCard class="pa-4 d-flex">
          <VAvatar
            color="success"
            icon="tabler-users"
            size="large"
            variant="tonal"
            class="mr-3"
          />
          <div>
            <p class="mb-0">
              {{ activeUsers }}
            </p>
            <span>Статистика активных пользователей</span>
          </div>
        </VCard>
      </VCol>
      <VCol cols="6">
        <VCard class="pa-4 d-flex">
          <VAvatar
            color="info"
            icon="tabler-arrows-down"
            size="large"
            variant="tonal"
            class="mr-3"
          />
          <div>
            <p class="mb-0">
              {{ policyTotal }}
            </p>
            <span>Oбщая статистика посещаемости</span>
          </div>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard class="pa-5">
          <VRow>
            <VCol cols="3">
              <VSelect
                v-model="tournament"
                :items="tournamentList"
                variant="outlined"
                label="Tournaments"
                item-title="name"
                return-object
                placeholder="Choose tournament"
                clearable
              />
            </VCol>

            <VCol cols="2">
              <VSelect
                v-model="group"
                :items="groupList"
                item-title="name"
                item-value="id"
                density="compact"
                variant="outlined"
                label="Groups"
                placeholder="Choose group"
                :disabled="!tournament?.id"
                clearable
              />
            </VCol>

            <VCol cols="6">
              <SelectInfiniteScroll
                v-model="task"
                :items="tasks.list"
                item-title="name"
                item-value="id"
                :loading="tasks.isFetching"
                clearable
                @load="getTasks"
              />
            </VCol>

            <VCol
              cols="1"
              class="d-flex align-center justify-space-between"
            >
              <VBtn
                variant="outlined"
                size="40px"
                class="px-1"
                @click="resetFilter"
              >
                <VIcon icon="tabler-refresh" />
              </VBtn>
              <VBtn
                size="40px"
                variant="outlined"
                color="info"
                @click="statisticsApiCall"
              >
                <VIcon icon="tabler-search" />
              </VBtn>
            </VCol>
          </VRow>
        </VCard>
      </VCol>
      <VCol cols="12">
        <VCard>
          <div class="px-5 pt-5 d-flex align-center justify-space-between">
            <h2>Active Users Statistics</h2>
            <div
              v-if="!tournament?.id && !task?.id"
              class="d-flex align-end"
            >
              <AppDateTimePicker
                v-model="dateRange"
                label="Date"
                placeholder="Select date"
                :config="{ mode: 'range' }"
                style="min-width: 220px"
                @on-close="changeRange"
              />
              <VBtn
                variant="outlined"
                size="40px"
                class="px-1 ml-2"
                @click="resetFilter"
              >
                <VIcon icon="tabler-refresh" />
              </VBtn>
            </div>
          </div>
          <CardStatisticsVertical
            :chart-options="userChartOptions"
            :series="userSeries"
            :height="userChartOptions.chart.height"
          />

          <h2 class="px-5 mt-5">
            Tasks Statistics
          </h2>
          <CardStatisticsVertical
            :chart-options="tasksChartOptions"
            :series="tasksSeries"
            :height="tasksChartOptions.chart.height"
          />
        </VCard>
      </VCol>
    </VRow>
  </section>
</template>

<style scoped lang="scss">
::v-deep .apexcharts-tooltip {
  background: #f3f3f3;
  color: black;
}
</style>
