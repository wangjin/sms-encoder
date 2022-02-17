import styles from './index.less';
import {
  Button,
  Divider,
  Drawer,
  Modal,
  Progress,
  Result,
  Upload,
  message,
} from 'antd';
import { InboxOutlined, SettingOutlined } from '@ant-design/icons';
import { RcFile } from 'antd/lib/upload/interface';
import XLSX from 'xlsx';
import { useEffect, useState } from 'react';
// @ts-ignore
import FileSaver from 'file-saver';
import moment from 'moment';

const { Dragger } = Upload;

interface EncryptedData {
  /**
   * 手机号码
   */
  mobile: string;
  /**
   * 短信内容
   */
  content: string;
  /**
   * 脱敏后手机号码
   */
  desensitization: string;
}

const index = () => {
  const [resultModalVisible, setResultModalVisible] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [processPercent, setProcessPercent] = useState(0);
  const [excelData, setExcelData] = useState<string[]>([]);
  const [encryptData, setEncryptData] = useState<EncryptedData[]>([]);
  const [errPhoneData] = useState<string[]>([]);

  /**
   * 监听excelData数据变化，对excelData进行加密
   */
  useEffect(() => {
    if (excelData.length > 0) {
      // 校验文件格式
      if (
        excelData.filter((o) => o[0] === '手机号码').length === 1 &&
        excelData.filter((o) => o[1] === '发送内容').length === 1
      ) {
        excelData.forEach((o) => {
          // 校验手机号格式
          if (
            o[0] !== '手机号码' &&
            (null === o[0] ||
              !new RegExp(
                '^1(3\\d|4[5-9]|5[0-35-9]|6[567]|7[0-8]|8\\d|9[0-35-9])\\d{8}$',
              ).test(o[0]))
          ) {
            errPhoneData.push(o[0]);
          }
        });
        if (errPhoneData.length > 0) {
          message
            .error('手机号错误：' + errPhoneData[0], 5)
            .then((r) => console.log('手机号错误'));
          return;
        } else {
          const encrypt = excelData
            .map((item, index) => {
              // 显示进度条
              setProcessModalVisible(true);
              setProcessPercent(index / excelData.length);
              // 处理加密
              if (item[0] !== '手机号码') {
                // 表头
                return {
                  mobile: Buffer.from(item[0].toString()).toString('base64'),
                  content: item[1],
                  desensitization: `${item[0]
                    .toString()
                    .substring(0, 3)}****${item[0]
                    .toString()
                    .substring(7, 11)}`,
                };
              } else {
                // 数据
                return {
                  mobile: '加密手机号码',
                  content: '发送内容',
                  desensitization: '脱敏手机号码',
                };
              }
            })
            .filter((item) => item !== undefined);
          // 保存加密数据
          setEncryptData(encrypt);
        }
      } else {
        message
          .error('文件格式不正确，请使用模板下载的文件填写后上传加密', 3)
          .then((r) =>
            console.log('文件格式不正确，请使用模板下载的文件填写后上传加密'),
          );
      }
    }
  }, [excelData]);

  /**
   * 监听encryptData数据变化
   */
  useEffect(() => {
    console.log(encryptData);
    setProcessModalVisible(false);
    if (encryptData.length > 0) {
      setResultModalVisible(true);
    }
  }, [encryptData]);

  return (
    <div>
      <h1 className={styles.title}>翼企云短信模板加密</h1>
      <div className={styles.uploader}>
        <Dragger
          height={400}
          beforeUpload={(file: RcFile) => {
            const reader = new FileReader();

            let data: any[] = [];
            // 读取上传的excel数据
            reader.onload = (e) => {
              try {
                if (e.target) {
                  // 文件格式校验->文件后缀名
                  const suffix = file.name.substring(
                    file.name.lastIndexOf('.'),
                  );
                  console.log('suffix' + suffix);
                  if (suffix !== '.xlsx') {
                    message
                      .error('文件格式不正确！', 3)
                      .then((r) => console.log('文件格式不正确！'));
                    return false;
                  } else if (file.size > 100 * 1024 * 1024) {
                    message
                      .error('文件大小超过100Mb！', 3)
                      .then((r) => console.log('文件大小超过100Mb！'));
                    return false;
                  } else {
                    // 读取excel内容
                    const workbook = XLSX.read(e.target.result, {
                      type: 'binary',
                    });
                    data = XLSX.utils.sheet_to_json(
                      workbook.Sheets[workbook.SheetNames[0]],
                      { header: 1 },
                    );
                    // 读取完成后保存数据，当前数据为明文状态
                    setExcelData(data);
                  }
                } else {
                  console.log('事件为空');
                }
              } catch (e) {
                message
                  .error('文件格式不正确！', 3)
                  .then((r) => console.log('文件格式不正确！'));
                console.log('excel转json失败', e);
              }
            };

            reader.readAsBinaryString(file);

            return false;
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            点击选择文件或将文件拖拽到这里进行加密
          </p>
          <p className="ant-upload-hint">
            文件必须按照模板要求填写，否则无法加密。模板可点击右上角{' '}
            <SettingOutlined className={styles.settingsHint} spin={false} />{' '}
            中的'模板下载'进行下载。
          </p>
        </Dragger>
      </div>

      <Modal
        title="处理中"
        visible={processModalVisible}
        onCancel={() => {
          setProcessModalVisible(false);
        }}
        destroyOnClose={true}
        footer={null}
      >
        <Progress
          strokeColor={{
            from: '#108ee9',
            to: '#87d068',
          }}
          percent={processPercent}
          status="active"
        />
      </Modal>

      <Modal
        title="加密结果"
        visible={resultModalVisible}
        onOk={() => {
          setResultModalVisible(false);
        }}
        footer={null}
      >
        <Result
          status="success"
          title="加密处理完成"
          subTitle={`合计${encryptData.length - 1}条加密数据`}
          extra={[
            <Button
              type="primary"
              key="console"
              onClick={() => {
                const workbook = XLSX.utils.book_new();
                const workSheet = XLSX.utils.json_to_sheet(encryptData, {
                  header: ['mobile', 'content', 'desensitization'],
                  skipHeader: true,
                });

                XLSX.utils.book_append_sheet(workbook, workSheet, '加密数据');
                const wbout = XLSX.write(workbook, {
                  bookType: 'xlsx',
                  bookSST: false,
                  type: 'array',
                });
                FileSaver.saveAs(
                  new Blob([wbout], { type: 'application/octet-stream' }),
                  `加密短信-${moment().format('YYYYMMDHHmmdssSSS')}.xlsx`,
                );
                setResultModalVisible(false);
              }}
            >
              下载
            </Button>,
          ]}
        />
      </Modal>

      <SettingOutlined
        className={styles.settings}
        spin={false}
        onClick={() => setSettingsVisible(true)}
      />
      <Drawer
        title="设置"
        placement="right"
        maskClosable={false}
        onClose={() => {
          setSettingsVisible(false);
        }}
        visible={settingsVisible}
      >
        <Divider orientation="left">模板下载</Divider>
        <Button
          type="primary"
          onClick={() => {
            const workbook = XLSX.utils.book_new();
            const workSheet = XLSX.utils.json_to_sheet(
              [{ mobile: '手机号码', content: '发送内容' }],
              {
                header: ['mobile', 'content'],
                skipHeader: true,
              },
            );

            XLSX.utils.book_append_sheet(workbook, workSheet, '短信加密模板');
            const wbout = XLSX.write(workbook, {
              bookType: 'xlsx',
              bookSST: false,
              type: 'array',
            });
            FileSaver.saveAs(
              new Blob([wbout], { type: 'application/octet-stream' }),
              `短信加密模板-v1.0.0.xlsx`,
            );
          }}
        >
          下载
        </Button>
      </Drawer>
    </div>
  );
};

export default index;
