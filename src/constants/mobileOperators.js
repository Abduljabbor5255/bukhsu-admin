import uzMobile from "@images/operators/uzmobile.svg"
import ucell from "@images/operators/ucell.png"
import beeline from "@images/operators/beeline.svg"
import mobiUz from "@images/operators/mobiuz.png"
import humans from "@images/operators/humans.svg"
import perfectum from "@images/operators/perfectum.svg"

const operatorsLogo = [
  {
    name: 'uzmobile',
    logo: uzMobile,
  },
  {
    name: 'beeline',
    logo: beeline,
  },
  {
    name: 'humans',
    logo: humans,
  },
  {
    name: 'mobiuz',
    logo: mobiUz,
  },
  {
    name: 'ucell',
    logo: ucell,
  },
  {
    name: 'perfectum',
    logo: perfectum,
  },
]

export default function getMobileOperatorLogo(name) {
  const { logo } = operatorsLogo.find(item => {
    return item.name === name
  })

  return logo
}
