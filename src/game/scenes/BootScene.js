import Phaser from 'phaser'
import { ASSET_BASE } from '../config'

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    const B = ASSET_BASE + 'Buildings/'
    const R = ASSET_BASE + 'Roads and Grounds/'
    const P = ASSET_BASE + 'Props/'

    // ── Loading bar UI ────────────────────────────────────────────────────────
    const w = this.cameras.main.width
    const h = this.cameras.main.height

    const bar    = this.add.graphics()
    const border = this.add.graphics()
    border.lineStyle(2, 0xe94560)
    border.strokeRect(w / 2 - 152, h / 2 - 12, 304, 24)

    this.load.on('progress', (v) => {
      bar.clear()
      bar.fillStyle(0xe94560)
      bar.fillRect(w / 2 - 150, h / 2 - 10, 300 * v, 20)
    })

    this.add.text(w / 2, h / 2 - 40, 'STARTUP CITY', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '20px',
      color: '#e94560',
    }).setOrigin(0.5)

    this.add.text(w / 2, h / 2 + 44, 'Cargando ciudad...', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '8px',
      color: '#9ca3af',
    }).setOrigin(0.5)

    // ── Startup buildings (reserved: office variants) ─────────────────────────
    this.load.image('startup_0', B + 'bld_contruction_neutral_SE_normal.png')
    this.load.image('startup_1', B + 'bld_mobile_blue_SE_normal.png')
    this.load.image('startup_2', B + 'bld_office_gray_SE_normal.png')
    this.load.image('startup_3', B + 'bld_office_brown_SE_normal.png')
    this.load.image('startup_4', B + 'bld_office2_green_SE_normal.png')
    this.load.image('startup_5', B + 'bld_office3_yellow_SE_normal.png')
    this.load.image('startup_6', B + 'bld_office3_blue_SE_normal.png')

    // ── City buildings — cottages (4 variants) ────────────────────────────────
    this.load.image('city_cottage_0', B + 'bld_house_red_SE_normal.png')
    this.load.image('city_cottage_1', B + 'bld_house_blue_SE_normal.png')
    this.load.image('city_cottage_2', B + 'bld_house_yellow_SE_normal.png')
    this.load.image('city_cottage_3', B + 'bld_house_purple_SE_normal.png')

    // ── City buildings — houses (4 variants) ──────────────────────────────────
    this.load.image('city_house_0', B + 'bld_house2_blue_SE_normal.png')
    this.load.image('city_house_1', B + 'bld_house2_brown_SE_normal.png')
    this.load.image('city_house_2', B + 'bld_house2_sand_SE_normal.png')
    this.load.image('city_house_3', B + 'bld_house2_white_SE_normal.png')

    // ── City buildings — shops (4 variants) ───────────────────────────────────
    this.load.image('city_shop_0', B + 'bld_autoshop_yellow_SE_normal.png')
    this.load.image('city_shop_1', B + 'bld_barbershop_purple_SE_normal.png')
    this.load.image('city_shop_2', B + 'bld_fruitstand_neutral_SE_normal.png')
    this.load.image('city_shop_3', B + 'bld_gasstation_green_SE_normal.png')

    // ── City buildings — offices (3 variants) ─────────────────────────────────
    this.load.image('city_office_0', B + 'bld_clinic_mint_SE_normal.png')
    this.load.image('city_office_1', B + 'bld_policestation_blue_SE_normal.png')
    this.load.image('city_office_2', B + 'bld_warehouse_brown_SE_normal.png')

    // ── City buildings — apartments (3 variants) ──────────────────────────────
    this.load.image('city_apart_0', B + 'bld_hospital_white_SE_normal.png')
    this.load.image('city_apart_1', B + 'bld_church_neutral_SE_normal.png')
    this.load.image('city_apart_2', B + 'bld_warehouse_orange_SE_normal.png')

    // ── Terrain tiles ─────────────────────────────────────────────────────────
    this.load.image('tile_grass',             R + 'tile_ground_grass.png')
    this.load.image('tile_water',             R + 'tile_ground_water.png')
    this.load.image('tile_road_straight_se',  R + 'tile_road_straight_SE_normal.png')
    this.load.image('tile_road_straight_sw',  R + 'tile_road_straight_SW_normal.png')
    this.load.image('tile_road_xing',         R + 'tile_road_xing_normal.png')
    this.load.image('tile_road_corner_e',     R + 'tile_road_corner_E_normal.png')
    this.load.image('tile_road_corner_n',     R + 'tile_road_corner_N_normal.png')
    this.load.image('tile_road_corner_s',     R + 'tile_road_corner_S_normal.png')
    this.load.image('tile_road_corner_w',     R + 'tile_road_corner_W_normal.png')
    this.load.image('tile_road_intersect_ne', R + 'tile_road_intersect_NE_normal.png')
    this.load.image('tile_road_intersect_nw', R + 'tile_road_intersect_NW_normal.png')
    this.load.image('tile_road_intersect_se', R + 'tile_road_intersect_SE_normal.png')
    this.load.image('tile_road_intersect_sw', R + 'tile_road_intersect_SW_normal.png')

    // ── Props ─────────────────────────────────────────────────────────────────
    this.load.image('prop_tree_a', P + 'prop_tree_styleA_normal.png')
    this.load.image('prop_tree_b', P + 'prop_tree_styleB_normal.png')
    this.load.image('prop_tree_c', P + 'prop_tree_styleC_normal.png')
  }

  create() {
    this.scene.start('MapScene')
  }
}
