import deepMerge from "../libs/functions/deepMerge";

class GzScroll {
  options = {};
  isScrollBody = false;
  isDownScrolling = false; // 是否在执行下拉刷新回调
  isUpScrolling = false; // 是否在执行上拉加载回调
  isUpAutoLoad = false; // 标记为是否执行过上拉加载

  constructor(options = {}, isScrollBody = false) {
    this.options = options;
    this.isScrollBody = isScrollBody;

    let hasDownCallback = this.options.down && this.options.down.callback; // 是否配置了down的callback

    this.initDownScroll(); // 初始化下拉刷新
    this.initUpScroll(); // 初始化上拉加载

    setTimeout(() => {
      const { optDown, optUp } = this.options;
      // 判断是否要执行下拉刷新
      if ((optDown.use || optDown.native) && optDown.auto && hasDownCallback) {
        if (optDown.autoShowLoading) {
          this.triggerDownScroll(); // 显示下拉进度,执行下拉回调
        } else {
          optDown.callback && optDown.callback();
        }
      }
      // 执行上拉加载
      if (!this.isUpAutoLoad) {
        setTimeout(function () {
          optUp.use &&
            optUp.auto &&
            !this.isUpAutoLoad &&
            this.triggerUpScroll();
        }, 100);
      }
    }, 30);
  }

  initDownScroll() {
    this.optDown = this.options.down || {};
    if (!this.optDown.textColor && this.hasColor(this.optDown.bgColor)) {
      this.optDown.textColor = "#fff"; // 当bgColor有值且textColor未设置,则textColor默认白色
    }
    this.extendDownScroll(this.optDown);

    // 如果是gzscroll-body且配置了native,则禁止自定义的下拉刷新
    if (this.isScrollBody && this.optDown.native) {
      this.optDown.use = false;
    } else {
      this.optDown.native = false; // 仅gzscroll-body支持,gzscroll-uni不支持
    }
    this.downHight = 0; // 下拉区域的高度
    // 在页面中加入下拉布局
    if (this.optDown.use && this.optDown.inited) {
      // 初始化完毕的回调
      setTimeout(function () {
        // 待主线程执行完毕再执行,避免new MeScroll未初始化,在回调获取不到gzscroll的实例
        this.optDown.inited(me);
      }, 0);
    }
  }

  initUpScroll() {}

  extendDownScroll(options) {
    deepMerge(options, {
      use: true, // 是否启用下拉刷新; 默认true
      auto: true, // 是否在初始化完毕之后自动执行下拉刷新的回调; 默认true
      native: false, // 是否使用系统自带的下拉刷新; 默认false; 仅gzscroll-body生效 (值为true时,还需在pages配置enablePullDownRefresh:true;详请参考gzscroll-native的案例)
      autoShowLoading: false, // 如果设置auto=true(在初始化完毕之后自动执行下拉刷新的回调),那么是否显示下拉刷新的进度; 默认false
      isLock: false, // 是否锁定下拉刷新,默认false;
      offset: 80, // 在列表顶部,下拉大于80px,松手即可触发下拉刷新的回调
      startTop: 100, // scroll-view快速滚动到顶部时,此时的scroll-top可能大于0, 此值用于控制最大的误差
      inOffsetRate: 1, // 在列表顶部,下拉的距离小于offset时,改变下拉区域高度比例;值小于1且越接近0,高度变化越小,表现为越往下越难拉
      outOffsetRate: 0.2, // 在列表顶部,下拉的距离大于offset时,改变下拉区域高度比例;值小于1且越接近0,高度变化越小,表现为越往下越难拉
      bottomOffset: 20, // 当手指touchmove位置在距离body底部20px范围内的时候结束上拉刷新,避免Webview嵌套导致touchend事件不执行
      minAngle: 45, // 向下滑动最少偏移的角度,取值区间  [0,90];默认45度,即向下滑动的角度大于45度则触发下拉;而小于45度,将不触发下拉,避免与左右滑动的轮播等组件冲突;
      textInOffset: "下拉刷新", // 下拉的距离在offset范围内的提示文本
      textOutOffset: "释放更新", // 下拉的距离大于offset范围的提示文本
      textLoading: "加载中 ...", // 加载中的提示文本
      textSuccess: "加载成功", // 加载成功的文本
      textErr: "加载失败", // 加载失败的文本
      beforeEndDelay: 0, // 延时结束的时长 (显示加载成功/失败的时长, android小程序设置此项结束下拉会卡顿, 配置后请注意测试)
      bgColor: "transparent", // 背景颜色 (建议在pages.json中再设置一下backgroundColorTop)
      textColor: "gray", // 文本颜色 (当bgColor配置了颜色,而textColor未配置时,则textColor会默认为白色)
      inited: null, // 下拉刷新初始化完毕的回调
      inOffset: null, // 下拉的距离进入offset范围内那一刻的回调
      outOffset: null, // 下拉的距离大于offset那一刻的回调
      onMoving: null, // 下拉过程中的回调,滑动过程一直在执行; rate下拉区域当前高度与指定距离的比值(inOffset: rate<1; outOffset: rate>=1); downHight当前下拉区域的高度
      beforeLoading: null, // 准备触发下拉刷新的回调: 如果return true,将不触发showLoading和callback回调; 常用来完全自定义下拉刷新, 参考案例【淘宝 v6.8.0】
      showLoading: null, // 显示下拉刷新进度的回调
      afterLoading: null, // 显示下拉刷新进度的回调之后,马上要执行的代码 (如: 在wxs中使用)
      beforeEndDownScroll: null, // 准备结束下拉的回调. 返回结束下拉的延时执行时间,默认0ms; 常用于结束下拉之前再显示另外一小段动画,才去隐藏下拉刷新的场景, 参考案例【dotJump】
      endDownScroll: null, // 结束下拉刷新的回调
      afterEndDownScroll: null, // 结束下拉刷新的回调,马上要执行的代码 (如: 在wxs中使用)
      callback: function (gzScroll) {
        // 下拉刷新的回调;默认重置上拉加载列表为第一页
        gzScroll.resetUpScroll();
      }
    });
  }

  extendUpScroll(options) {
    deepMerge(options, {
      use: true, // 是否启用上拉加载; 默认true
      auto: true, // 是否在初始化完毕之后自动执行上拉加载的回调; 默认true
      isLock: false, // 是否锁定上拉加载,默认false;
      isBoth: true, // 上拉加载时,如果滑动到列表顶部是否可以同时触发下拉刷新;默认true,两者可同时触发;
      callback: null, // 上拉加载的回调;function(page,gzscroll){ }
      page: {
        num: 0, // 当前页码,默认0,回调之前会加1,即callback(page)会从1开始
        size: 10, // 每页数据的数量
        time: null // 加载第一页数据服务器返回的时间; 防止用户翻页时,后台新增了数据从而导致下一页数据重复;
      },
      noMoreSize: 5, // 如果列表已无数据,可设置列表的总数量要大于等于5条才显示无更多数据;避免列表数据过少(比如只有一条数据),显示无更多数据会不好看
      offset: 150, // 距底部多远时,触发upCallback,仅gzscroll-uni生效 ( gzscroll-body配置的是pages.json的 onReachBottomDistance )
      textLoading: "加载中 ...", // 加载中的提示文本
      textNoMore: "暂无更多", // 没有更多数据的提示文本
      bgColor: "transparent", // 背景颜色 (建议在pages.json中再设置一下backgroundColorBottom)
      textColor: "gray", // 文本颜色 (当bgColor配置了颜色,而textColor未配置时,则textColor会默认为白色)
      inited: null, // 初始化完毕的回调
      showLoading: null, // 显示加载中的回调
      showNoMore: null, // 显示无更多数据的回调
      hideUpScroll: null, // 隐藏上拉加载的回调
      errDistance: 60, // endErr的时候需往上滑动一段距离,使其往下滑动时再次触发onReachBottom,仅gzscroll-body生效
      toTop: {
        // 回到顶部按钮,需配置src才显示
        src: null, // 图片路径,默认null (绝对路径或网络图)
        offset: 1000, // 列表滚动多少距离才显示回到顶部按钮,默认1000
        duration: 300, // 回到顶部的动画时长,默认300ms (当值为0或300则使用系统自带回到顶部,更流畅; 其他值则通过step模拟,部分机型可能不够流畅,所以非特殊情况不建议修改此项)
        btnClick: null, // 点击按钮的回调
        onShow: null, // 是否显示的回调
        zIndex: 9990, // fixed定位z-index值
        left: null, // 到左边的距离, 默认null. 此项有值时,right不生效. (支持20, "20rpx", "20px", "20%"格式的值, 其中纯数字则默认单位rpx)
        right: 20, // 到右边的距离, 默认20 (支持20, "20rpx", "20px", "20%"格式的值, 其中纯数字则默认单位rpx)
        bottom: 120, // 到底部的距离, 默认120 (支持20, "20rpx", "20px", "20%"格式的值, 其中纯数字则默认单位rpx)
        safearea: false, // bottom的偏移量是否加上底部安全区的距离, 默认false, 需要适配iPhoneX时使用 (具体的界面如果不配置此项,则取本vue的safearea值)
        width: 72, // 回到顶部图标的宽度, 默认72 (支持20, "20rpx", "20px", "20%"格式的值, 其中纯数字则默认单位rpx)
        radius: "50%" // 圆角, 默认"50%" (支持20, "20rpx", "20px", "20%"格式的值, 其中纯数字则默认单位rpx)
      },
      empty: {
        use: true, // 是否显示空布局
        icon: null, // 图标路径
        tip: "暂无数据", // 提示
        btnText: "", // 按钮
        btnClick: null, // 点击按钮的回调
        onShow: null, // 是否显示的回调
        fixed: false, // 是否使用fixed定位,默认false; 配置fixed为true,以下的top和zIndex才生效 (transform会使fixed失效,最终会降级为absolute)
        top: "100rpx", // fixed定位的top值 (完整的单位值,如 "10%"; "100rpx")
        zIndex: 99 // fixed定位z-index值
      },
      onScroll: false // 是否监听滚动事件
    });
  }

  triggerUpScroll() {}

  hasColor(color) {
    if (!color) return false;
    let c = color.toLowerCase();
    return c != "#fff" && c != "#ffffff" && c != "transparent" && c != "white";
  }
}
