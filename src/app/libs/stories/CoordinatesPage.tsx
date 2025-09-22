import React from 'react';
import './coordinates-page.css';

export const CoordinatesPage: React.FC = () => {
  return (
    <div className="coordinates-page">
      <div className="page-header">
        <h1 className="page-title">좌표 관리</h1>
        <div className="search-section">
          <input 
            type="text" 
            placeholder="좌표를 검색하세요" 
            className="search-input"
          />
          <button className="search-btn">좌표 검색</button>
        </div>
      </div>

      <div className="page-content">
        {/* 지도 영역 */}
        <div className="map-section">
          <div className="map-container">
            <div className="map-placeholder">
              🗺️ 지도 영역
            </div>
            <div className="map-overlay">
              <div className="overlay-content">
                <h3 className="overlay-title">[모집공고명] 군산소룡신도시</h3>
                <p className="overlay-address">
                  도로명 주소: 전북특별자치도 정읍시 수성2로 13-12(수성동) 주공1단지아파트
                </p>
                <p className="overlay-coordinates">
                  위도: 37.5765261 / 경도: 126.9750486
                </p>
                <button className="add-coordinate-btn">공고에 현재 좌표 추가하기</button>
              </div>
            </div>
          </div>
        </div>

        {/* 데이터 테이블 영역 */}
        <div className="table-section">
          <h2 className="table-title">좌표가 없는 공고 (5개)</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>모집공고</th>
                  <th>주소</th>
                  <th>모집공고문 링크</th>
                  <th>버튼</th>
                </tr>
              </thead>
              <tbody>
                <tr className="highlighted-row">
                  <td>군산소룡신도시</td>
                  <td>전북특별자치도 정읍시 수성2로 13-12</td>
                  <td>
                    <button className="link-btn">링크</button>
                  </td>
                  <td>
                    <button className="coordinate-btn">좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>서울강남아파트</td>
                  <td>서울특별시 강남구 테헤란로 123</td>
                  <td>
                    <button className="link-btn">링크</button>
                  </td>
                  <td>
                    <button className="coordinate-btn">좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>부산해운대아파트</td>
                  <td>부산광역시 해운대구 센텀중앙로 456</td>
                  <td>
                    <button className="link-btn">링크</button>
                  </td>
                  <td>
                    <button className="coordinate-btn">좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>대구수성아파트</td>
                  <td>대구광역시 수성구 동대구로 789</td>
                  <td>
                    <button className="link-btn">링크</button>
                  </td>
                  <td>
                    <button className="coordinate-btn">좌표 찾기</button>
                  </td>
                </tr>
                <tr>
                  <td>인천송도아파트</td>
                  <td>인천광역시 연수구 송도과학로 321</td>
                  <td>
                    <button className="link-btn">링크</button>
                  </td>
                  <td>
                    <button className="coordinate-btn">좌표 찾기</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
