import * as THREE from 'three'
import g from '../assets/images/gradient.png'
import {instanceBasic} from '../declare/THREE/instance'


function getRandomRange(a:number,b:number){
    return Math.random() * (a -b) + b
}
// 定义氛围粒子系统的入参
export interface AtmosphereParticleProps {
    // 粒子出现的范围
    longestDistance: number

    // 系统粒子的个数
    particleSum: number

    // 每一帧更新渲染时调用
    renderUpdate?: (Point: THREE.Points) => void 
    
    // 粒子系统初始时调用
    onInitialize?: (Point: THREE.Points) => void

    // 切换粒子系统时调用
    onChangeModel?: (Point: THREE.Points) => void
}

// 定义氛围粒子系统
export class AtmosphereParticle extends instanceBasic{
    private readonly longestDistance: number
    private readonly particleSum: number
    private readonly renderUpdate?: (Point: THREE.Points) => void
    private readonly onChangeModel?: (Point: THREE.Points) => void
    private readonly onInitialize?: (Point: THREE.Points) => void
    public Geometry?: THREE.Points

    constructor(options: AtmosphereParticleProps){
        super()
        const{longestDistance, particleSum, renderUpdate, onChangeModel} = options
        this.longestDistance = longestDistance
        this.particleSum = particleSum
        this.renderUpdate = renderUpdate
        this.onChangeModel = onChangeModel

        //为粒子生成初始随机坐标 
        const vertix = []
        for(let i =0; i<particleSum; i++){
            const x = getRandomRange(-1 * longestDistance,longestDistance)
            const y = getRandomRange(-1 * longestDistance,longestDistance)
            const z = getRandomRange(-1 * longestDistance,longestDistance)
            vertix.push(x,y,z)
        }
    }

    



}