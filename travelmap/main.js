// 当DOM加载完毕后执行
document.addEventListener('DOMContentLoaded', () => {

    // 初始化 ECharts 实例
    const myChart = echarts.init(document.getElementById('main'));

    // 使用fetch API异步加载城市数据
    fetch('cities.json')
        .then(response => response.json())
        .then(citiesData => {
            // --- ECharts 配置项 ---
            const option = {
                // 背景色，设为透明会使用CSS的背景
                backgroundColor: 'transparent',

                // 3D地球组件
                globe: {
                    baseTexture: 'https://cdn.jsdelivr.net/gh/apache/echarts-website@asf-site/examples/data-gl/asset/world.topo.bathy.200401.jpg',
                    heightTexture: 'https://cdn.jsdelivr.net/gh/apache/echarts-website@asf-site/examples/data-gl/asset/bathymetry_bw_composite_4k.jpg',
                    environment: 'https://cdn.jsdelivr.net/gh/apache/echarts-website@asf-site/examples/data-gl/asset/starfield.jpg',
                    shading: 'realistic',
                    realisticMaterial: {
                        roughness: 0.9
                    },
                    postEffect: {
                        enable: true
                    },
                    viewControl: {
                        autoRotate: true,
                        autoRotateSpeed: 5,
                        zoomSensitivity: 1, // 允许缩放
                        // 初始视角定位到第一个城市
                        targetCoord: citiesData.length ? citiesData[0].value : [0, 0]
                    }
                },

                // 提示框，鼠标悬停时触发
                tooltip: {
                    trigger: 'item',
                    // 自定义提示框内容，使其更丰富
                    formatter: params => {
                        // params.data 是 cities.json 中对应城市的对象
                        if (params.componentType === 'series' && params.data) {
                            const city = params.data;
                            return `
                                <div style="font-size: 14px; line-height: 1.5;">
                                    <strong>📍 ${city.name}</strong><br>
                                    到访次数：${city.visits || 'N/A'}<br>
                                    类 &nbsp; 型：${city.type || 'N/A'}<br>
                                    说 &nbsp; 明：${city.details || '无'}
                                </div>
                            `;
                        }
                        return `📍 ${params.name}`;
                    }
                },

                // 系列（要显示的数据）
                series: [{
                    name: '足迹',
                    type: 'scatter3D',
                    coordinateSystem: 'globe',
                    symbol: 'pin',
                    symbolSize: 25,
                    label: {
                        show: true,
                        formatter: '{b}', // b 代表城市名称 (name)
                        position: 'top',
                        textStyle: {
                            color: '#fff',
                            fontSize: 14,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            borderRadius: 4,
                            padding: 4
                        }
                    },
                    itemStyle: {
                        color: '#409EFF', // 标记点的颜色
                        opacity: 0.8
                    },
                    // 绑定从cities.json加载的数据
                    data: citiesData
                }]
            };

            // 应用配置
            myChart.setOption(option);

            // 监听点击事件，实现点击城市后地球聚焦
            myChart.on('click', params => {
                // 确保点击的是系列中的数据点
                if (params.componentType === 'series' && params.seriesName === '足迹') {
                    const cityCoord = params.data.value;
                    // 更新地球的视角中心点
                    myChart.setOption({
                        globe: {
                            viewControl: {
                                autoRotate: false, // 点击后停止自动旋转以便观察
                                targetCoord: cityCoord
                            }
                        }
                    });
                }
            });

        })
        .catch(error => {
            console.error('加载城市数据失败:', error);
            document.getElementById('main').innerText = '加载城市数据失败，请检查cities.json文件是否存在且格式正确。';
        });

    // 监听窗口大小变化，使图表自适应
    window.addEventListener('resize', () => {
        myChart.resize();
    });
});
