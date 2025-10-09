# todo计划
## 115
- access_token 自动刷新开关保存不上
  
## 功能增强
### 未开启的功能
- 聚合
- 缓存
  
### 已开启的功能
- 影片详情页显示演员是否已收藏
- 略缩图跳转存在无效的问题，与跳转至网页中间位置
- 显示优化：可选择屏蔽黑名单
- 智能内容过滤的规则排列为一行两个，优化编辑页面的单选框样式
- 加载上次应用的标签，未生效
- 智能内容过滤，增加正则配置提示
- 调整“预览来源”的选择
- "🔓 破解评论区"和"🚫 破解FC2拦截"功能（**待验证**）
- 右击后台打开，支持影片页的“你可能也喜歡”
- 智能内容过滤无效

### 新增的功能
- 新增区间划分，用于间隔影片，比如近六个月和六个月前的影片，就增加一行高亮区域去间隔两个时间范围，增强显示

## 新作品
- 优化已读作品的删除（**待验证**）
- 根据现有番号库重新刷新过滤未看的新作品（还有问题）
- 批量打开未读新作品
- 排除标签：單體作品 含磁鏈（**待验证**）
- 在演员页面，按钮快速添加订阅，如：https://javdb.com/actors/65APQ
- 新作品功能未启用，请先在全局配置中启用？

## 列表显示设置
- 隐藏VR有问题（**待验证**）
- 隐藏拉黑演员的影片（通过标题去过滤，有误差但可接受）
- 支持一键，隐藏未收藏演员的作品（快捷，过滤非必要的影片）
- 重新设计popup页面，方便显示多个开关
  
## WebDAV 设置
- 恢复功能，不完善，没有分析按钮了
  
## 日志设置
- 检查所有功能增强时候有独立的标签

## 番号库
- 增加点击“想看”按钮，更新番号库影片状态，如果番号库没有该影片，则添加
  - @todo.md#L40-41在影片页，实现这个功能，并且将这个功能和已有的（115推送自动已看）的功能，做成影片页的增强区块，可供开关

<div class="column">
      <div class="buttons are-small review-buttons">
          <form class="button_to" method="post" action="/v/wK5ZJ1/reviews/want_to_watch" data-remote="true"><button type="submit" class="button" data-disable-with="...">
            <span class="icon is-small">
              <i class="icon-check-circle-o"></i>
            </span>
            <span>想看</span>
</button><input type="hidden" name="authenticity_token" value="bIqcl19D8eCIJ7sMRhTx_aYJHp3PdTIbcLR0gbgQxv_Cqay4W6LooSp4KGCRvCyxKWj-x6ORM-ulPyWet_6pQQ" autocomplete="off"></form>          <button name="button" type="button" id="review-watched" data-target="modal-review-watched" data-haspopup="true" data-auth="true" class="button modal-button">
            <span class="icon is-small">
              <i class="icon-check-circle"></i>
            </span>
            <span>看過</span>
</button>        <!-- 保存清单 -->
        <button name="button" type="button" data-target="modal-save-list" data-haspopup="true" data-auth="true" id="save-list-button" class="button modal-button modal-save-list-button">
          <span class="icon is-small">
            <i class="icon-bookmark-o"></i>
          </span>
          <span>存入清單</span>
</button>      </div>
    </div> 
- 增加功能按钮，显示封面，则在番号库列表左侧直接显示影片封面，减少点击。当页面滚动到图片容器才开始加载封面，避免加载过多的图片
- 整理影片页的功能加载顺序，保存番号库与更换icon的优先级最高（**待验证**）
- ！！！优化开始识别番号，保存番号库的开始判断，当页面识别到navbar-item 的元素时，才开始识别数据回写。要是没有，说明页面被安全拦截了或请求频繁了，就不要回写番号库。（**待验证**）

## emby
- 删除
  
## 其他
- 暗色主题优化
- 设置页面的对齐有问题，应该居左对齐（现在是居右对齐）
