/*
 * Copyright (c) 2021, Alibaba Group Holding Limited;
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.alibaba.gaiax.render.view.basic.boxshadow

import android.graphics.BlurMaskFilter
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path

/**
 * @suppress
 */
internal class GXBlurMaskShadowDrawable(shadowPath: Path) : GXShadowDrawable(shadowPath) {

    private val shadowPaint = Paint().apply {
        isDither = true
        isAntiAlias = true
        style = Paint.Style.FILL
    }

    override fun draw(canvas: Canvas) {
        canvas.drawPath(shadowPath, shadowPaint)
    }

    override fun onShadowChange(blur: Float, color: Int, inset: Boolean) {
        val type = if (shadowInset) {
            BlurMaskFilter.Blur.INNER
        } else {
            BlurMaskFilter.Blur.NORMAL
        }
        shadowPaint.maskFilter = if (shadowBlur == 0f) null else BlurMaskFilter(shadowBlur, type)
        shadowPaint.color = color
    }
}