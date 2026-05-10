/**
 * Naver Maps Marker Clustering Extension
 * Source: https://navermaps.github.io/maps.js.ncp/docs/js/MarkerClustering.js
 *
 * ---------------------------------------------------------------------------
 * [이 파일이 하는 일 — 전체 흐름]
 * ---------------------------------------------------------------------------
 * 1) MarkerClustering: 네이버 지도 OverlayView를 확장한 “클러스터 매니저”입니다.
 *    - 지도에 붙으면(onAdd) 지도 idle 시마다 화면 안의 마커만 모아 클러스터를 다시 그립니다.
 * 2) Cluster: 물리적으로 가까운 마커들을 담는 그룹 하나입니다.
 *    - 격자(gridSize)로 확장한 bounds 안에 들어오는 마커는 같은 클러스터 후보가 됩니다.
 *    - 줌이 낮으면 클러스터 전용 마커(원형 아이콘 등)만 보이고, 멤버 마커는 숨깁니다.
 *    - 줌이 maxZoom 이상이거나, 멤버 수가 minClusterSize 미만이면 개별 마커를 보여 줍니다.
 *
 * [옵션과 동작의 관계]
 * - minClusterSize: 이 개수 “미만”이면 클러스터링 의미가 없다고 보고 멤버만 표시합니다.
 * - maxZoom: 지도 줌 레벨이 이 값 “이상”이면(>=) 클러스터를 풀고 멤버 마커를 지도에 올립니다.
 * - gridSize: 클러스터 중심 주변을 픽셀 단위로 얼마나 넓게 잡을지(같은 셀에 묶일 범위)입니다.
 * - indexGenerator + icons: 클러스터에 포함된 마커 개수에 따라 몇 번째 아이콘을 쓸지 결정합니다.
 * - disableClickZoom: false면 클러스터 클릭 시 지도가 한 단계 확대(morph)됩니다.
 */

/**
 * MarkerClustering 생성자
 * @param {object} t - 옵션 객체. map, markers 등을 넘기며, DEFAULT_OPTIONS와 병합됩니다.
 */
var MarkerClustering = function(t) {
    // 네이버 예제 기본값. 앱(NaverMap.tsx 등)에서 넘긴 옵션으로 대부분 덮어씁니다.
    this.DEFAULT_OPTIONS = {
        map: null, // 연결할 지도 인스턴스
        markers: [], // 클러스터링 대상 마커 배열
        disableClickZoom: !0, // true: 클러스터 클릭 확대 비활성(기본은 끔)
        minClusterSize: 2, // 클러스터로 묶을 최소 마커 개수(미만이면 개별 마커만)
        maxZoom: 13, // 이 줌 “이상”이면 클러스터 해제 후 멤버 표시
        gridSize: 100, // 픽셀 격자 한 변의 반(내부 _calcBounds에서 /2 와 함께 사용)
        icons: [], // 클러스터 마커에 쓸 아이콘 정의 배열
        indexGenerator: [10, 100, 200, 500, 1e3], // 개수 구간 → icons 인덱스 매핑용 임계값들
        stylingFunction: function() {} // 아이콘 위에 숫자 등을 그릴 때 호출되는 훅
    },
        // 현재 화면에 존재하는 Cluster 인스턴스들의 목록
        this._clusters = [],
        // 지도 이벤트 리스너 참조(원본 변수명 _mapRelations / onRemove의 _mapRelation 불일치는 예제 그대로)
        this._mapRelations = null,
        // 각 멤버 마커 dragend 리스너들을 모아 두었다가 한꺼번에 제거하기 위함
        this._markerRelations = [],
        // 두 번째 인자 true: 초기 set 시 changed 콜백을 건너뛰는 등 내부 초기화 플래그로 사용됨
        this.setOptions(naver.maps.Util.extend({}, this.DEFAULT_OPTIONS, t), !0),
        // OverlayView이므로 지도에 올리면 onAdd → 클러스터 생성이 이어짐
        this.setMap(t.map || null)
};

naver.maps.Util.ClassExtend(MarkerClustering, naver.maps.OverlayView, {
    /**
     * 지도에 오버레이가 추가될 때: idle마다 클러스터를 다시 계산하도록 리스너 등록,
     * 이미 마커가 있으면 즉시 한 번 클러스터를 만듭니다.
     */
    onAdd: function() {
        var t = this.getMap();
        this._mapRelations = naver.maps.Event.addListener(t, "idle", naver.maps.Util.bind(this._onIdle, this)), this.getMarkers().length > 0 && (this._createClusters(), this._updateClusters())
    },
    draw: naver.maps.Util.noop,
    /**
     * 지도에서 제거될 때: 리스너 해제 및 모든 클러스터 파괴(메모리·마커 정리)
     */
    onRemove: function() {
        naver.maps.Event.removeListener(this._mapRelation), this._clearClusters(), this._geoTree = null, this._mapRelation = null
    },
    /**
     * 옵션 일괄/단일 설정.
     * - 객체를 넘기면 키별로 set() 호출 후, map이 있으면 setMap으로 지도 연결.
     * - 문자열 키 + 값 형태면 단일 옵션만 변경.
     */
    setOptions: function(t) {
        var e = this;
        if ("string" == typeof t) {
            var s = t,
                r = arguments[1];
            e.set(s, r)
        } else {
            var n = arguments[1];
            naver.maps.Util.forEach(t, function(t, s) {
                "map" !== s && e.set(s, t)
            }), t.map && !n && e.setMap(t.map)
        }
    },
    /** 특정 키만 조회하거나, 기본 옵션 키 전체에 대해 현재 값 객체로 반환 */
    getOptions: function(t) {
        var e = this,
            s = {};
        return void 0 !== t ? e.get(t) : (naver.maps.Util.forEach(e.DEFAULT_OPTIONS, function(t, r) {
            s[r] = e.get(r)
        }), s)
    },
    getMinClusterSize: function() {
        return this.getOptions("minClusterSize")
    },
    setMinClusterSize: function(t) {
        this.setOptions("minClusterSize", t)
    },
    getMaxZoom: function() {
        return this.getOptions("maxZoom")
    },
    setMaxZoom: function(t) {
        this.setOptions("maxZoom", t)
    },
    getGridSize: function() {
        return this.getOptions("gridSize")
    },
    setGridSize: function(t) {
        this.setOptions("gridSize", t)
    },
    getIndexGenerator: function() {
        return this.getOptions("indexGenerator")
    },
    setIndexGenerator: function(t) {
        this.setOptions("indexGenerator", t)
    },
    getMarkers: function() {
        return this.getOptions("markers")
    },
    setMarkers: function(t) {
        this.setOptions("markers", t)
    },
    getIcons: function() {
        return this.getOptions("icons")
    },
    setIcons: function(t) {
        this.setOptions("icons", t)
    },
    getStylingFunction: function() {
        return this.getOptions("stylingFunction")
    },
    setStylingFunction: function(t) {
        this.setOptions("stylingFunction", t)
    },
    getDisableClickZoom: function() {
        return this.getOptions("disableClickZoom")
    },
    setDisableClickZoom: function(t) {
        this.setOptions("disableClickZoom", t)
    },
    /**
     * 옵션 변경 시 부분 갱신(전체를 다 그리지 않아도 되는 경우는 가볍게 처리).
     * @param {string} t - 변경된 옵션 키
     * @param {*} e - 새 값 (disableClickZoom에서 이전값 여부 판단에 사용)
     */
    changed: function(t, e) {
        if (this.getMap()) switch (t) {
            case "marker":
            case "minClusterSize":
            case "gridSize":
                // 마커 구성·최소 크기·격자가 바뀌면 클러스터 멤버십이 달라지므로 전체 재구성
                this._redraw();
                break;
            case "indexGenerator":
            case "icons":
                // 묶음 구조는 같고 표시만 바뀌면 아이콘만 갱신
                this._clusters.forEach(function(t) {
                    t.updateIcon()
                });
                break;
            case "maxZoom":
                // 줌 임계값만 바뀐 경우: 멤버가 2개 이상인 클러스터만 표시 모드 재판정
                this._clusters.forEach(function(t) {
                    t.getCount() > 1 && t.checkByZoomAndMinClusterSize()
                });
                break;
            case "stylingFunction":
                this._clusters.forEach(function(t) {
                    t.updateCount()
                });
                break;
            case "disableClickZoom":
                // e가 truthy면 비활성화, 아니면 활성화 메서드명 선택
                var s = "enableClickZoom";
                e && (s = "disableClickZoom"), this._clusters.forEach(function(t) {
                    t[s]()
                })
        }
    },
    /**
     * 현재 지도 bounds 안에 보이는 마커만 순회하며,
     * 좌표에 가장 가까운 기존 Cluster에 넣거나, 없으면 새 Cluster를 만듭니다.
     * dragend 시 클러스터를 다시 계산하기 위해 마커마다 리스너를 등록합니다.
     */
    _createClusters: function() {
        var t = this.getMap();
        if (t)
            for (var e = t.getBounds(), s = this.getMarkers(), r = 0, n = s.length; r < n; r++) {
                var i = s[r],
                    o = i.getPosition();
                if (e.hasLatLng(o)) this._getClosestCluster(o).addMarker(i), this._markerRelations.push(naver.maps.Event.addListener(i, "dragend", naver.maps.Util.bind(this._onDragEnd, this)))
            }
    },
    /** 모든 Cluster에 대해 아이콘·개수·줌/최소크기에 따른 표시 모드 동기화 */
    _updateClusters: function() {
        for (var t = this._clusters, e = 0, s = t.length; e < s; e++) t[e].updateCluster()
    },
    /** 클러스터별 destroy → 마커 리스너 일괄 제거 → 내부 배열 초기화 */
    _clearClusters: function() {
        for (var t = this._clusters, e = 0, s = t.length; e < s; e++) t[e].destroy();
        naver.maps.Event.removeListener(this._markerRelations), this._markerRelations = [], this._clusters = []
    },
    /** 완전히 지우고 다시 만들고 갱신(이동·줌 idle, 드래그 종료 시 공통 경로) */
    _redraw: function() {
        this._clearClusters(), this._createClusters(), this._updateClusters()
    },
    /**
     * 좌표 t가 들어갈 클러스터 선택:
     * - 이미 존재하는 클러스터 중, 확장 bounds(isInBounds) 안에 들어가는 것들만 후보로 하고
     * - 그중에서 중심까지의 화면상 거리(getDistance)가 최소인 클러스터를 고릅니다.
     * - 후보가 없으면 새 Cluster를 만들어 배열에 push 후 반환합니다.
     */
    _getClosestCluster: function(t) {
        for (var e = this.getProjection(), s = this._clusters, r = null, n = 1 / 0, i = 0, o = s.length; i < o; i++) {
            var a = s[i],
                u = a.getCenter();
            if (a.isInBounds(t)) {
                var l = e.getDistance(u, t);
                l < n && (n = l, r = a)
            }
        }
        return r || (r = new Cluster(this), this._clusters.push(r)), r
    },
    /** 지도 이동/줌이 끝난 뒤(idle) 화면이 바뀌었으므로 클러스터 전체 재계산 */
    _onIdle: function() {
        this._redraw()
    },
    /** 마커를 드래그해 위치가 바뀌면 멤버십이 달라질 수 있어 동일하게 전체 재계산 */
    _onDragEnd: function() {
        this._redraw()
    }
});

/**
 * 단일 클러스터 그룹. MarkerClustering 인스턴스를 참조해 옵션·지도·projection을 얻습니다.
 */
var Cluster = function(t) {
    this._clusterCenter = null, this._clusterBounds = null, this._clusterMarker = null, this._relation = null, this._clusterMember = [], this._markerClusterer = t
};
Cluster.prototype = {
    constructor: Cluster,
    /**
     * 이 클러스터에 마커 추가. 중복(_isMember) 방지.
     * 첫 마커일 때 중심과 gridSize 기반 bounds(_calcBounds)를 초기화합니다.
     */
    addMarker: function(t) {
        if (!this._isMember(t)) {
            if (!this._clusterCenter) {
                var e = t.getPosition();
                this._clusterCenter = e, this._clusterBounds = this._calcBounds(e)
            }
            this._clusterMember.push(t)
        }
    },
    /**
     * 클러스터 해체: 클릭 줌 리스너 제거, 멤버 마커를 지도에서 내림, 클러스터 마커 제거, 필드 초기화
     */
    destroy: function() {
        naver.maps.Event.removeListener(this._relation);
        for (var t = this._clusterMember, e = 0, s = t.length; e < s; e++) t[e].setMap(null);
        this._clusterMarker.setMap(null), this._clusterMarker = null, this._clusterCenter = null, this._clusterBounds = null, this._relation = null, this._clusterMember = []
    },
    getCenter: function() {
        return this._clusterCenter
    },
    getBounds: function() {
        return this._clusterBounds
    },
    getCount: function() {
        return this._clusterMember.length
    },
    /** 좌표 t가 이 클러스터의 “격자로 확장된” bounds 안에 있는지 — 묶기 후보 판별에 사용 */
    isInBounds: function(t) {
        return this._clusterBounds && this._clusterBounds.hasLatLng(t)
    },
    /**
     * 클러스터 마커 클릭 시 지도를 클릭 좌표 기준으로 한 단계 확대(morph).
     * disableClickZoom이 true면 이 리스너는 붙지 않음(updateCluster 참고).
     */
    enableClickZoom: function() {
        if (!this._relation) {
            var t = this._markerClusterer.getMap();
            this._relation = naver.maps.Event.addListener(this._clusterMarker, "click", function(e) {
                t.morph(e.coord, t.getZoom() + 1)
            })
        }
    },
    disableClickZoom: function() {
        this._relation && (naver.maps.Event.removeListener(this._relation), this._relation = null)
    },
    /**
     * 클러스터 마커가 없으면 생성하고, 아이콘/숫자 갱신 후
     * 줌·minClusterSize에 따라 멤버 표시 vs 클러스터 마커 표시를 결정합니다.
     */
    updateCluster: function() {
        this._clusterMarker || (this._clusterMarker = new naver.maps.Marker({
            position: this._clusterCenter
        }), this._markerClusterer.getDisableClickZoom() || this.enableClickZoom()), this.updateIcon(), this.updateCount(), this.checkByZoomAndMinClusterSize()
    },
    /**
     * [핵심 표시 분기]
     * - 멤버 수 < minClusterSize → 항상 개별 마커만(_showMember)
     * - 그 외 → 먼저 클러스터 모드(_hideMember: 멤버 숨기고 클러스터 마커만 지도에)
     *   이후 지도 줌 r >= maxZoom s 이면 다시 _showMember로 전환(줌이 충분히 들어왔으므로 펼침)
     */
    checkByZoomAndMinClusterSize: function() {
        var t = this._markerClusterer,
            e = t.getMinClusterSize(),
            s = t.getMaxZoom(),
            r = t.getMap().getZoom();
        this.getCount() < e ? this._showMember() : (this._hideMember(), s <= r && this._showMember())
    },
    /** stylingFunction이 있으면 (클러스터 마커, 개수)로 호출 — 보통 숫자 텍스트 삽입 */
    updateCount: function() {
        var t = this._markerClusterer.getStylingFunction();
        t && t(this._clusterMarker, this.getCount())
    },
    /**
     * _getIndex로 개수 구간에 맞는 아이콘 슬롯을 고르고, 배열 범위로 클램프 후 setIcon
     */
    updateIcon: function() {
        var t = this.getCount(),
            e = this._getIndex(t),
            s = this._markerClusterer.getIcons();
        e = Math.max(e, 0), e = Math.min(e, s.length - 1), this._clusterMarker.setIcon(s[e])
    },
    /** 개별 멤버 마커를 지도에 올리고, 클러스터 대표 마커는 지도에서 제거 */
    _showMember: function() {
        for (var t = this._markerClusterer.getMap(), e = this._clusterMarker, s = this._clusterMember, r = 0, n = s.length; r < n; r++) s[r].setMap(t);
        e && e.setMap(null)
    },
    /** 멤버는 지도에서 내리고, 클러스터 대표 마커만 지도에 표시(원형 묶음 UI) */
    _hideMember: function() {
        for (var t = this._markerClusterer.getMap(), e = this._clusterMarker, s = this._clusterMember, r = 0, n = s.length; r < n; r++) s[r].setMap(null);
        e && e.setMap(t)
    },
    /**
     * 중심 좌표 t를 기준으로 “픽셀 공간에서 gridSize/2 만큼 넓힌” 사각 영역을 LatLngBounds로 반환.
     * - 먼저 중심만 있는 bounds를 픽셀 오프셋으로 변환한 뒤 NE/SW 코너에 반경을 더함
     * - 현재 화면 bounds와 교차(clamp)하여 화면 밖으로 무한 확장되지 않게 자름
     * → 같은 격자 셀 안의 마커들이 같은 클러스터 후보 범위를 공유하게 됨
     */
    _calcBounds: function(t) {
        var e = this._markerClusterer.getMap(),
            s = new naver.maps.LatLngBounds(t.clone(), t.clone()),
            r = e.getBounds(),
            n = e.getProjection(),
            i = n.fromCoordToOffset(r.getNE()),
            o = n.fromCoordToOffset(r.getSW()),
            a = n.fromCoordToOffset(s.getNE()),
            u = n.fromCoordToOffset(s.getSW()),
            l = this._markerClusterer.getGridSize() / 2;
        a.add(l, -l), u.add(-l, l);
        var c = Math.min(i.x, a.x),
            h = Math.max(i.y, a.y),
            m = Math.max(o.x, u.x),
            _ = Math.min(o.y, u.y),
            f = n.fromOffsetToCoord(new naver.maps.Point(c, h)),
            d = n.fromOffsetToCoord(new naver.maps.Point(m, _));
        return new naver.maps.LatLngBounds(d, f)
    },
    /**
     * 마커 개수 t에 대해 icons 배열의 인덱스를 구함.
     * - indexGenerator가 함수면 그 함수에 위임
     * - 배열이면 오름차순 임계값과 비교해 “몇 번째 구간인지” 카운트 반환
     */
    _getIndex: function(t) {
        var e = this._markerClusterer.getIndexGenerator();
        if (naver.maps.Util.isFunction(e)) return e(t);
        if (naver.maps.Util.isArray(e)) {
            for (var s = 0, r = s, n = e.length; r < n; r++) {
                if (t < e[r]) break;
                s++
            }
            return s
        }
    },
    _isMember: function(t) {
        return -1 !== this._clusterMember.indexOf(t)
    }
};
