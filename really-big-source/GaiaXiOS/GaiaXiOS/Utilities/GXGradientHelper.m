//
//  GXGradientHelper.m
//  GaiaXiOS
//
//  Copyright (c) 2021, Alibaba Group Holding Limited.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//  http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.

#import "GXGradientHelper.h"
#import "NSDictionary+GX.h"
#import "NSArray+GX.h"
#import "UIColor+GX.h"
#import "GXUtils.h"

@implementation GXGradientHelper

#pragma mark - 渐变图片

+ (UIImage *)creatGradientImageWithParams:(NSDictionary *)params bounds:(CGRect)bounds{
    //生成layer
    CAGradientLayer *gradientLayer = [self creatGradientLayerWithParams:params bounds:bounds];
    //绘制图片
    UIImage *gradientImage = [self renderImageFromLayer:gradientLayer];
    return gradientImage;
}


//渐变layer
+ (CAGradientLayer *)creatGradientLayerWithParams:(NSDictionary *)params bounds:(CGRect)bounds{
    if (![GXUtils isValidDictionary:params]) {
        return nil;
    }
    
    //direction
    NSString *direction = [params gx_stringForKey:@"direction"];
    CGPoint startPoint = CGPointZero;
    CGPoint endPoint = CGPointZero;
    if ([direction isEqualToString:@"toright"]) {
        startPoint = CGPointMake(0.0, 0.0);
        endPoint = CGPointMake(1.0, 0.0);
    } else if ([direction isEqualToString:@"toleft"]) {
        startPoint = CGPointMake(1.0, 0.0);
        endPoint = CGPointMake(0.0, 0.0);
    } else if ([direction isEqualToString:@"tobottom"]) {
        startPoint = CGPointMake(0.0, 0.0);
        endPoint = CGPointMake(0.0, 1.0);
    } else if ([direction isEqualToString:@"totop"]) {
        startPoint = CGPointMake(0.0, 1.0);
        endPoint = CGPointMake(0.0, 0.0);
    } else if ([direction isEqualToString:@"tobottomright"]) {
        startPoint = CGPointMake(0, 0);
        endPoint = CGPointMake(1, 1);
    } else if ([direction isEqualToString:@"tobottomleft"]) {
        startPoint = CGPointMake(1.0, 0.0);
        endPoint = CGPointMake(0.0, 1.0);
    } else if ([direction isEqualToString:@"totopright"]) {
        startPoint = CGPointMake(0.0, 1.0);
        endPoint = CGPointMake(1.0, 0.0);
    } else if ([direction isEqualToString:@"totopleft"]) {
        startPoint = CGPointMake(1.0, 1.0);
        endPoint = CGPointMake(0, 0);
    } else {
        startPoint = CGPointMake(0, 0.0);
        endPoint = CGPointMake(1.0, 0.0);
    }
    
    //colors
    NSArray *colors = [params gx_arrayForKey:@"colors"];
    if (colors == nil || ![colors isKindOfClass:NSArray.class]) {
        return nil;
    }
    
    //颜色
    NSMutableArray *colorRefArray = [NSMutableArray array];
    for (int i = 0; i < colors.count; i++) {
        NSString *colorStr = [colors gx_objectAtIndex:i];
        UIColor *tmpColor = [UIColor gx_colorWithString:colorStr];
        [colorRefArray gx_addObject:(id)tmpColor.CGColor];
    }
    
    //创建layer
    CAGradientLayer * gradientLayer = [CAGradientLayer layer];
    gradientLayer.colors = colorRefArray;
    gradientLayer.startPoint = startPoint;
    gradientLayer.endPoint = endPoint;
    gradientLayer.frame = bounds;
    
    //locations
    NSArray *locations = [params gx_arrayForKey:@"locations"];
    if (locations) {
        gradientLayer.locations = locations;
    }
    
    //异步绘制
    //gradientLayer.drawsAsynchronously = YES;
    
    return gradientLayer;
}

//layer绘制成图片
+ (UIImage *)renderImageFromLayer:(CALayer *)layer{
    if (nil == layer) {
        return nil;
    }
    
    //创建视图
    CGRect bounds = layer.bounds;
    //开启上下文
    UIGraphicsBeginImageContextWithOptions(bounds.size, NO, 0);
    //绘制layer
    [layer renderInContext:UIGraphicsGetCurrentContext()];
    //获取新图片
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    //结束图形上下文
    UIGraphicsEndImageContext();
    
    return image;
}


#pragma mark - 解析渐变色

+ (NSDictionary *)parserLinearGradient:(NSString *)linearGradient{
    if (![linearGradient hasPrefix:@"linear-gradient("] || ![linearGradient hasSuffix:@")"]) {
        return nil;
    }
    NSMutableDictionary *dict = nil;
    NSString *linearString = [linearGradient substringWithRange:NSMakeRange(16, [linearGradient length]-17)];
    NSArray *linearArray = [linearString componentsSeparatedByString:@","];
    if (linearArray.count) {
        //构建渐变数据源
        dict = [NSMutableDictionary dictionaryWithCapacity:2];
        NSMutableArray *locations = [NSMutableArray arrayWithCapacity:2];
        NSMutableArray *colors = [NSMutableArray arrayWithCapacity:2];
        for (NSUInteger i = 0; i < [linearArray count]; i++) {
            NSString *linear = linearArray[i];
            if (i == 0) {
                //解析location
                linear = [linear stringByReplacingOccurrencesOfString:@" " withString:@""];
                [dict gx_setValue:linear forKey:@"direction"];
            } else {
                //解析颜色
                linear = [linear stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
                if ([linear hasSuffix:@"%"]) {
                    //包含百分比，设置location
                    NSArray *linears = [linear componentsSeparatedByString:@" "];
                    for (int j = 0; j < linears.count; j++) {
                        NSString *tmpLinear = linears[j];
                        if (j == 0) {
                            linear = tmpLinear;
                        } else {
                            //添加location
                            if (tmpLinear.length > 1) {
                                NSNumber *location = @([[tmpLinear substringToIndex:tmpLinear.length-1] floatValue] / 100.0f);
                                [locations gx_addObject:location];
                            }
                        }
                    }
                }
                
                //添加颜色
                [colors gx_addObject:linear];
            }
        }
        
        //location和color一致时才会设置
        if (locations.count && (locations.count == colors.count)) {
            [dict gx_setObject:locations forKey:@"locations"];
        }
        
        //设置color
        [dict gx_setObject:colors forKey:@"colors"];
    }
    
    return dict;
}


@end
