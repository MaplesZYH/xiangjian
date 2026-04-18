<template>
  <footer class="site-footer">
    <div class="footer-shell">
      <section class="footer-grid">
        <div class="footer-panel footer-panel--intro">
          <p class="footer-brand__eyebrow">XIANGJIAN ONLINE</p>
          <h2>乡建在线</h2>
          <p class="footer-brand__summary">
            面向乡村建房场景的在线平台，提供户型选择、在线下单、订单跟踪与供应链入驻申请。
          </p>
        </div>

        <div class="footer-panel footer-panel--contact">
          <h3>联系与支持</h3>
          <div class="contact-list">
            <p>
              <span class="contact-label">公司名称</span>
              <span>乡建在线</span>
            </p>
            <p>
              <span class="contact-label">公司地址</span>
              <span>成都高新区府城大道西段399号天府新谷7号楼C座</span>
            </p>
            <p>
              <span class="contact-label">服务热线</span>
              <a href="tel:13101308866">131 0130 8866</a>
            </p>
            <p>
              <span class="contact-label">服务时间</span>
              <span>09:00-19:00</span>
            </p>
          </div>
        </div>
      </section>

      <div class="footer-bottom">
        <p>© {{ currentYear }} 乡建在线. 保留所有权利。</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

<style lang="scss" scoped>
.site-footer {
  background: linear-gradient(180deg, #1d2b22 0%, #162019 100%);
  color: #f7fbf8;
}

.footer-shell {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto;
  padding: 36px 0 20px;
}

.footer-brand__eyebrow {
  margin: 0 0 8px;
  color: rgba(190, 255, 203, 0.78);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
}

.footer-brand h2 {
  margin: 0 0 10px;
  font-size: 28px;
  line-height: 1.2;
}

.footer-brand__summary {
  margin: 0;
  color: rgba(235, 243, 237, 0.76);
  line-height: 1.75;
}

.footer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 32px;
}

.footer-panel {
  min-width: 0;
}

.footer-panel--intro {
  max-width: 620px;
}

.footer-panel h3 {
  margin: 0 0 18px;
  font-size: 16px;
  font-weight: 700;
}

.contact-list {
  display: grid;
  gap: 14px;
}

.contact-list p {
  margin: 0;
  display: grid;
  gap: 4px;
  color: rgba(235, 243, 237, 0.76);
  line-height: 1.7;
}

.contact-label {
  color: rgba(190, 255, 203, 0.82);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.contact-list a {
  color: #ffffff;
  text-decoration: none;
}

.footer-bottom {
  display: flex;
  justify-content: center;
  margin-top: 28px;
  padding: 18px 0 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(235, 243, 237, 0.54);
  font-size: 13px;
}

.footer-bottom p {
  margin: 0;
}

@media (max-width: 1080px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .footer-shell {
    width: min(100% - 24px, 100%);
    padding-top: 30px;
  }

  .footer-grid {
    grid-template-columns: 1fr;
  }

  .footer-bottom {
    flex-direction: column;
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 4px);
  }
}
</style>
